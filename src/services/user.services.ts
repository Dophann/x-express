import User from '~/models/users.model'
import databaseService from './database.services'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { hashPassword } from '~/utils/crypto'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/refresh_tokens.model'
import {
  LoginReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  VerifyEmailBody
} from '~/types/user.type'
import envConfig from '~/constants/env'

class UserServices {
  private async signAccessToken({ user_id, verify }: { user_id: string; verify?: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.ACCESS_TOKEN_SECRET,
      options: {
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      privateKey: envConfig.REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      privateKey: envConfig.FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: envConfig.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken, verify },
      privateKey: envConfig.EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: envConfig.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        created_at: new Date()
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()

    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: user_id,
        created_at: new Date()
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string) {
    const emailExist = await databaseService.users.findOne({ email })
    return Boolean(emailExist)
  }

  async logout(refresh_token: string) {
    return databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async resendVerifyEmail({ user_id }: { user_id: string; email: string }) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return result
  }

  async verifyEmail(payload: VerifyEmailBody) {
    const { user_id } = payload
    const [_, tokens] = await Promise.all([
      await databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      ),
      this.signAccessAndRefreshToken({
        user_id,
        verify: UserVerifyStatus.Verified
      })
    ])
    const [access_token, refresh_token] = tokens
    return { access_token, refresh_token }
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      forgot_password_token
    }
  }

  async resetPassword(payload: ResetPasswordReqBody) {
    const { password, user_id } = payload
    return databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  async getMe(user_id: string) {
    return databaseService.users.findOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    return databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
  }
}

const userServices = new UserServices()

export default userServices
