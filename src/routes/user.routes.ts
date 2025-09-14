import { Router } from 'express'
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/user.controllers'
import { FilterBodyMiddleware } from '~/middlewares/global.middlewares'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidators,
  refreshTokenValidator,
  registerValidators,
  resendVerifyEmailTokenValidator,
  resetPasswordValidator,
  UpdateMeValidator,
  userVerifiedValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/user.middlewares'
import { UpdateMeReqBody } from '~/types/user.type'
import { wrapAsync } from '~/utils/handlers'

const userRouter = Router()

userRouter.post('/register', registerValidators, wrapAsync(registerController))
userRouter.post('/login', loginValidators, wrapAsync(loginController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
userRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(verifyEmailController))
userRouter.post(
  '/resend-verify-email',
  accessTokenValidator,
  resendVerifyEmailTokenValidator,
  wrapAsync(resendVerifyEmailController)
)
userRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

userRouter.get('/verify-forgot-password', verifyForgotPasswordValidator, wrapAsync(verifyForgotPasswordController))

userRouter.post('/reset-password', resetPasswordValidator, wrapAsync(resetPasswordController))

userRouter.get('/me', accessTokenValidator, userVerifiedValidator, wrapAsync(getMeController))

userRouter.patch(
  '/me',
  accessTokenValidator,
  userVerifiedValidator,
  FilterBodyMiddleware<UpdateMeReqBody>([
    'name',
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'username',
    'website'
  ]),
  UpdateMeValidator,
  wrapAsync(updateMeController)
)

export default userRouter
