import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import MESSAGES, { USER_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import userServices from '~/services/user.services'
import { hashPassword } from '~/utils/crypto'
import { ErrorWithStatus } from '~/utils/error'
import { verifyToken } from '~/utils/jwt'
import validate from '~/utils/validate'

export const registerValidators = validate(
  checkSchema(
    {
      name: {
        trim: true,
        isString: {
          errorMessage: MESSAGES.NAME_MUST_BE_A_STRING
        },
        notEmpty: {
          errorMessage: MESSAGES.NAME_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: MESSAGES.NAME_MUST_BE_FROM_1_TO_100_CHARACTERS
        }
      },
      email: {
        trim: true,
        notEmpty: {
          errorMessage: MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: MESSAGES.EMAIL_MUST_BE_AN_EMAIL
        },
        custom: {
          options: async (value) => {
            const emailExist = await userServices.checkEmailExist(value)
            if (emailExist) {
              throw new ErrorWithStatus({ message: MESSAGES.EMAIL_ALREADY_EXISTS, status: 401 })
            }
            return true
          }
        }
      },
      password: {
        trim: true,
        isString: {
          errorMessage: MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        notEmpty: {
          errorMessage: MESSAGES.PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: MESSAGES.PASSWORD_MUST_BE_AT_LEAST_8_AND_MAX_50_CHARACTERS
        },
        isStrongPassword: {
          errorMessage: MESSAGES.PASSWORD_MUST_BE_STRONG,
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        }
      },
      confirm_password: {
        trim: true,
        isString: {
          errorMessage: MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        notEmpty: {
          errorMessage: MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new ErrorWithStatus({ message: MESSAGES.CONFIRM_PASSWORD_IS_NOT_CORRECT, status: 401 })
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          errorMessage: MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601,
          options: {
            strict: true,
            strictSeparator: true
          }
        }
      }
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
          errorMessage: MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: MESSAGES.EMAIL_MUST_BE_AN_EMAIL
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
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
      password: {
        trim: true,
        isString: {
          errorMessage: MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        notEmpty: {
          errorMessage: MESSAGES.PASSWORD_IS_REQUIRED
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: MESSAGES.PASSWORD_MUST_BE_AT_LEAST_8_AND_MAX_50_CHARACTERS
        },
        isStrongPassword: {
          errorMessage: MESSAGES.PASSWORD_MUST_BE_STRONG,
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        }
      }
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
