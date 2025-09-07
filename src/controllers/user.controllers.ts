import { NextFunction, Request, Response } from 'express'
import userServices from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/types/user.type'
import { USER_MESSAGES } from '~/constants/messages'
import User from '~/models/users.model'

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id!
  const result = await userServices.login({ user_id: user_id.toString(), verify: user.verify! })
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const refresh_token = req.body.refresh_token
  await userServices.logout(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS
  })
}
