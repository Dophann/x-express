import { Request } from 'express'
import User from '~/models/users.model'
import { TokenPayload } from '~/types/user.type'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
  }
}
