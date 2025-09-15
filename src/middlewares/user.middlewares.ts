import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import envConfig from '~/constants/env'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import userServices from '~/services/user.services'
import { TokenPayload } from '~/types/user.type'
import { hashPassword } from '~/utils/crypto'
import { ErrorWithStatus } from '~/utils/error'
import { verifyToken } from '~/utils/jwt'
import validate from '~/utils/validate'
import { NextFunction, Request, Response } from 'express'
import { usernameFormatRegex } from '~/utils/regex'
import { userProjection } from '~/utils/projection'

const password: ParamSchema = {
  trim: true,
  isString: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_AT_LEAST_8_AND_MAX_50_CHARACTERS
  },
  isStrongPassword: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  }
}

const confirm_password: ParamSchema = {
  trim: true,
  isString: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  notEmpty: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new ErrorWithStatus({ message: USER_MESSAGES.CONFIRM_PASSWORD_IS_NOT_CORRECT, status: 401 })
      }
      return true
    }
  }
}

const name: ParamSchema = {
  trim: true,
  notEmpty: {
    errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USER_MESSAGES.NAME_MUST_BE_FROM_1_TO_100_CHARACTERS
  }
}

const username: ParamSchema = {
  trim: true,
  isString: {
    errorMessage: USER_MESSAGES.USERNAME_MUST_BE_A_STRING
  },
  isLength: {
    options: { min: 2, max: 25 },
    errorMessage: USER_MESSAGES.USERNAME_MUST_BE_AT_LEAST_2_AND_MAX_15_CHARACTERS
  },
  matches: {
    options: usernameFormatRegex,
    errorMessage: USER_MESSAGES.USER_INVALID_FORMAT
  },
  custom: {
    options: async (username: string, { req }) => {
      if (req.route.path === '/register') return undefined
      const { user_id } = req.decoded_authorization as TokenPayload
      const usernameIsExisted = await databaseService.users.findOne({ username }, { projection: userProjection })

      if (usernameIsExisted && usernameIsExisted._id.toString() !== user_id) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USERNAME_EXISTED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      return true
    }
  }
}

const email: ParamSchema = {
  trim: true,
  notEmpty: {
    errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USER_MESSAGES.EMAIL_MUST_BE_AN_EMAIL
  },
  custom: {
    options: async (value) => {
      const emailExist = await userServices.checkEmailExist(value)
      if (emailExist) {
        throw new ErrorWithStatus({ message: USER_MESSAGES.EMAIL_ALREADY_EXISTS, status: 401 })
      }
      return true
    }
  }
}

const date_of_birth: ParamSchema = {
  notEmpty: true,
  trim: true,
  isISO8601: {
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601,
    options: {
      strict: true,
      strictSeparator: true
    }
  }
}

export const registerValidators = validate(
  checkSchema(
    {
      name,
      username,
      email,
      password,
      confirm_password,
      date_of_birth
    },
    ['body']
  )
)

export const loginValidators = validate(
  checkSchema(
    {
      email: {
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_MUST_BE_AN_EMAIL
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne(
              {
                email: value,
                password: hashPassword(req.body.password)
              },
              {
                projection: userProjection
              }
            )

            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            req.user = user
            return true
          }
        }
      },
      password
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            const decoded_authorization = await verifyToken({
              token: access_token,
              secretOrPublicKey: process.env.ACCESS_TOKEN_SECRET as string
            })

            req.decoded_authorization = decoded_authorization
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (token: string, { req }) => {
            const user_id = req.decoded_authorization?.user_id
            if (!token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ secretOrPublicKey: process.env.REFRESH_TOKEN_SECRET as string, token }),
                databaseService.refreshTokens.findOne({ token, user_id: new ObjectId(user_id) })
              ])

              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_NOT_EXIST_OR_NOT_VALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      token: {
        trim: true,
        custom: {
          options: async (token: string, { req }) => {
            try {
              const email_verify_token_decoded = await verifyToken({
                token,
                secretOrPublicKey: envConfig.EMAIL_VERIFY_TOKEN
              })

              const { user_id, verify } = email_verify_token_decoded

              if (verify === UserVerifyStatus.Verified) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_IS_VERIFIRED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              const user = await databaseService.users.findOne(
                { _id: new ObjectId(user_id), verify },
                {
                  projection: userProjection
                }
              )

              if (!user) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_NOT_FOUND_OR_VERIFIED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              req.email_verify_token_decoded = email_verify_token_decoded
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const resendVerifyEmailTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id, verify } = req?.decoded_authorization as TokenPayload

            if (verify === UserVerifyStatus.Verified) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_IS_VERIFIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const user = await databaseService.users.findOne(
              {
                _id: new ObjectId(user_id),
                verify: UserVerifyStatus.Unverified
              },
              { projection: userProjection }
            )

            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND_OR_VERIFIED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        isEmail: true,
        custom: {
          options: async (email: string, { req }) => {
            const user = await databaseService.users.findOne(
              {
                email
              },
              { projection: userProjection }
            )

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: USER_MESSAGES.USER_NOT_FOUND
              })
            }

            req.user = user

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      token: {
        trim: true,
        custom: {
          options: async (token: string, { req }) => {
            try {
              const forgot_password_token_decoded = await verifyToken({
                token,
                secretOrPublicKey: envConfig.FORGOT_PASSWORD_TOKEN
              })
              const { user_id } = forgot_password_token_decoded

              const user = await databaseService.users.findOne(
                {
                  _id: new ObjectId(user_id),
                  forgot_password_token: token
                },
                { projection: userProjection }
              )

              if (!user) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_NOT_FOUND_OR_INVALID_TOKEN,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              req.forgot_password_token_decoded = forgot_password_token_decoded
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['query']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      token: {
        trim: true,
        custom: {
          options: async (token: string, { req }) => {
            try {
              const forgot_password_token_decoded = await verifyToken({
                token,
                secretOrPublicKey: envConfig.FORGOT_PASSWORD_TOKEN
              })

              const { user_id } = forgot_password_token_decoded

              const user = await databaseService.users.findOne(
                {
                  _id: new ObjectId(user_id),
                  forgot_password_token: token
                },
                { projection: userProjection }
              )

              if (!user) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USER_NOT_FOUND_OR_INVALID_TOKEN,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              req.forgot_password_token_decoded = forgot_password_token_decoded
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      },
      password,
      confirm_password
    },
    ['body']
  )
)

export const userVerifiedValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_IS_NOT_VERIFIRED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  next()
}

export const UpdateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...name,
        optional: true,
        isEmpty: undefined
      },
      date_of_birth: {
        ...date_of_birth,
        optional: true,
        isEmpty: undefined
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.BIO_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 300
          },
          errorMessage: USER_MESSAGES.BIO_MUST_BE_AT_LEAST_1_AND_MAX_300_CHARACTERS
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.LOCATION_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USER_MESSAGES.LOCATION_MUST_BE_AT_LEAST_1_AND_MAX_50_CHARACTERS
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_A_STRING
        },
        trim: true,
        isURL: {
          options: {
            protocols: ['http', 'https'],
            require_protocol: true
          },
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_A_VALID_URL
        }
      },
      username,
      avatar: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.AVATAR_MUST_BE_A_STRING
        },
        trim: true,
        isURL: {
          options: {
            protocols: ['http', 'https'],
            require_protocol: true
          },
          errorMessage: USER_MESSAGES.AVATAR_MUST_BE_A_VALID_URL
        }
      },
      cover_photo: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.COVER_PHOTO_MUST_BE_A_STRING
        },
        trim: true,
        isURL: {
          options: {
            protocols: ['http', 'https'],
            require_protocol: true
          },
          errorMessage: USER_MESSAGES.COVER_PHOTO_MUST_BE_A_VALID_URL
        }
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        notEmpty: {
          errorMessage: USER_MESSAGES.FOLLOWED_USER_ID_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.FOLLOWED_USER_ID_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (id: string, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload

            if (!ObjectId.isValid(id)) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.FOLLOWED_USER_ID_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (user_id === id) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACTION_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const user = await databaseService.users.findOne(
              { _id: new ObjectId(id) },
              { projection: { ...userProjection, verify: 1 } }
            )

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: USER_MESSAGES.USER_NOT_FOUND
              })
            }

            if (user.verify === UserVerifyStatus.Unverified) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: USER_MESSAGES.USER_NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const unFollowValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        notEmpty: {
          errorMessage: USER_MESSAGES.FOLLOWED_USER_ID_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.FOLLOWED_USER_ID_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (id: string, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload

            if (!ObjectId.isValid(id)) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.FOLLOWED_USER_ID_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (user_id === id) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACTION_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const user = await databaseService.users.findOne(
              { _id: new ObjectId(id) },
              {
                projection: {
                  ...userProjection,
                  verify: 1
                }
              }
            )

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: USER_MESSAGES.USER_NOT_FOUND
              })
            }

            if (user.verify === UserVerifyStatus.Unverified) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: USER_MESSAGES.USER_NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const profileValidator = validate(
  checkSchema(
    {
      username: {
        trim: true,
        notEmpty: {
          errorMessage: USER_MESSAGES.USERNAME_IS_REQUIRED
        },
        custom: {
          options: async (username, { req }) => {
            const user = await databaseService.users.findOne(
              {
                username,
                verify: UserVerifyStatus.Verified
              },
              {
                projection: userProjection
              }
            )

            if (!user) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            req.user = user
            return true
          }
        }
      }
    },
    ['params']
  )
)
