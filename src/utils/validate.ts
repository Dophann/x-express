import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import { EntityError as EntityErrorClass, ErrorWithStatus } from './error'
import HTTP_STATUS from '~/constants/httpStatus'

const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)

    if (errors.isEmpty()) {
      return next()
    }

    const errorObject = errors.mapped()
    const errorEntity = new EntityErrorClass({ errors: {} })
    for (const key in errorObject) {
      const { msg } = errorObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      errorEntity.errors[key] = msg
    }

    next(errorEntity)
  }
}

export default validate
