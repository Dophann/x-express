import express from 'express'
import databaseService from '~/services/database.services'
import userRouter from '~/routes/user.routes'
import { globalErrorHandler } from '~/middlewares/global.middlewares'
import envConfig from './constants/env'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

const app = express()
const port = envConfig.PORT

databaseService.connect().catch(console.log)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(
  cors({
    origin: envConfig.DOMAIN_CLIENT
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56
})

app.use(limiter)

app.use('/user', userRouter)

app.use(globalErrorHandler)

app.listen(port, () => {
  console.log(`Express is running on port ${port}`)
})
