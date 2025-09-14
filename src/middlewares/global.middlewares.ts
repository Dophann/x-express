import { NextFunction, Request, Response } from 'express'
import { omit, pick } from 'lodash'

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.status || 500).json(err)
}

export const FilterBodyMiddleware = <K = any>(filterKeys: Array<keyof K>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)

    next()
  }
}
