// env.ts
import dotenv from 'dotenv'
import { z } from 'zod'

const envPath = process.env.NODE_ENV

dotenv.config({
  path: envPath === 'development' ? '.env' : `.env.${envPath}`
})

const EnvSchema = z.object({
  PORT: z.string().min(1, 'PORT is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, 'ACCESS_TOKEN_EXPIRES_IN is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, 'REFRESH_TOKEN_EXPIRES_IN is required'),
  EMAIL_VERIFY_TOKEN: z.string().min(1, 'EMAIL_VERIFY_TOKEN is required'),
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: z.string().min(1, 'EMAIL_VERIFY_TOKEN_EXPIRES_IN is required'),
  FORGOT_PASSWORD_TOKEN: z.string().min(1, 'FORGOT_PASSWORD_TOKEN is required'),
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: z.string().min(1, 'FORGOT_PASSWORD_TOKEN_EXPIRES_IN is required'),
  PASSWORD_SECRET: z.string().min(1, 'PASSWORD_SECRET is required')
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.format())
  throw new Error('Invalid environment variables')
}

const envConfig = Object.freeze(parsed.data)

export default envConfig
