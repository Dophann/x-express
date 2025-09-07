import User from '~/models/users.model'
import databaseService from './database.services'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { hashPassword } from '~/utils/crypto'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/refresh_tokens.model'
import { LoginReqBody, RegisterReqBody } from '~/types/user.type'

class UserServices {
  private async signAccessToken({ user_id, verify }: { user_id: string; verify?: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: process.env.ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signRefreshToken({ user_id, verify }: { user_id: string; verify?: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      privateKey: process.env.REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private async signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify?: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
    const resss = await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        created_at: new Date()
      })
    )
    console.log('resss',resss)
    return {
      access_token,
      refresh_token
    }
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
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
}

const userServices = new UserServices()

export default userServices
