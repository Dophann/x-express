import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/user.controllers'
import {
  accessTokenValidator,
  loginValidators,
  refreshTokenValidator,
  registerValidators
} from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handlers'

const userRouter = Router()

userRouter.post('/register', registerValidators, wrapAsync(registerController))
userRouter.post('/login', loginValidators, wrapAsync(loginController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

export default userRouter
