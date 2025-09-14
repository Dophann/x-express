import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import User from '~/models/users.model'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface ResetPasswordReqBody {
  user_id: string
  password: string
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface ResetPasswordReqBody {
  password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export type UpdateMeReqBody = Partial<
  Omit<
    User,
    | 'email'
    | 'created_at'
    | 'updated_at'
    | 'email_verify_token'
    | 'forgot_password_token'
    | 'verify'
    | 'password'
    | '_id'
  >
>

export type VerifyEmailBody = Pick<TokenPayload, 'user_id'>
