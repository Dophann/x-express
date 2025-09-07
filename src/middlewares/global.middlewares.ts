import { NextFunction, Request, Response } from 'express'

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.status || 500).json(err)
}
