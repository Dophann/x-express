import { NextFunction, Request, Response } from 'express'
import userServices from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailBody
} from '~/types/user.type'
import { USER_MESSAGES } from '~/constants/messages'
import User from '~/models/users.model'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const data = await userServices.register(req.body)
  return res.json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    data
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id!
  const data = await userServices.login({ user_id: user_id.toString(), verify: user.verify! })
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    data
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const refresh_token = req.body.refresh_token
  await userServices.logout(refresh_token)
  return res.json({
    message: USER_MESSAGES.LOGOUT_SUCCESS
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id, email } = req?.decoded_authorization as TokenPayload
  await userServices.resendVerifyEmail({ user_id, email: email! })
  return res.json({ message: USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS })
}

export const verifyEmailController = async (req: Request, res: Response) => {
  const payload = req.email_verify_token_decoded as VerifyEmailBody
  const data = await userServices.verifyEmail(payload)
  return res.json({
    message: USER_MESSAGES.VERIFY_EMAIL_SUCCESS,
    data
  })
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  const user = req.user as User
  await userServices.forgotPassword(new ObjectId(user._id).toString())
  return res.json({
    message: USER_MESSAGES.FORGOT_PASSWORD_REQUEST
  })
}

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  return res.json({
    message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_VALID
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.forgot_password_token_decoded!
  const { password } = req.body
  await userServices.resetPassword({
    password,
    user_id
  })
  return res.json({ message: USER_MESSAGES.RESET_PASSWORD_SUCCESS })
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const data = await userServices.getMe(user_id)
  return res.json({
    message: USER_MESSAGES.USER_FOUND,
    data
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const payload = req.body
  const data = await userServices.updateMe(user_id, payload)
  return res.json({
    message: USER_MESSAGES.USER_UPDATE_SUCCESS,
    data
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, { followed_user_id: string }>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const { alreadyFollowed } = await userServices.follow(user_id, followed_user_id)

  return res.json({
    message: alreadyFollowed ? USER_MESSAGES.ALREADY_FOLLOWED : USER_MESSAGES.FOLLOW_SUCCESS
  })
}

export const unFollowController = async (
  req: Request<ParamsDictionary, any, { followed_user_id: string }>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.params
  const { unfollowed } = await userServices.unFollow(user_id, followed_user_id)

  if (unfollowed === false) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: USER_MESSAGES.UNFOLLOW_FAILED
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    message: USER_MESSAGES.FOLLOW_SUCCESS
  })
}
