import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  verifyEmailController
} from '~/controllers/user.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidators,
  refreshTokenValidator,
  registerValidators,
  resendVerifyEmailTokenValidator
} from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handlers'

const userRouter = Router()

userRouter.post('/register', registerValidators, wrapAsync(registerController))
userRouter.post('/login', loginValidators, wrapAsync(loginController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
userRouter.get('/verify-email', accessTokenValidator, emailVerifyTokenValidator, wrapAsync(verifyEmailController))
userRouter.post(
  '/resend-verify-email',
  accessTokenValidator,
  refreshTokenValidator,
  resendVerifyEmailTokenValidator,
  wrapAsync(resendVerifyEmailController)
)
userRouter.post('/forgot-password', forgotPasswordValidator, forgotPasswordController)

export default userRouter
