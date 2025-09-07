import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import databaseService from '~/services/database.services'
import userRouter from '~/routes/user.routes'
import { globalErrorHandler } from '~/middlewares/global.middlewares'

const app = express()
const port = 3000

databaseService.connect().catch(console.log)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/user', userRouter)

app.use(globalErrorHandler)

app.listen(port, () => {
  console.log(`Express is running on port ${port}`)
})
