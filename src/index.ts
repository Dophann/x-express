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
    origin: 'http://localhost:5173'
  })
)

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
//   ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
//   // store: ... , // Redis, Memcached, etc. See below.
// })

// app.use(limiter)

app.use('/user', userRouter)

app.use(globalErrorHandler)

app.listen(port, () => {
  console.log(`Express is running on port ${port}`)
})
