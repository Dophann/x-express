// env.ts
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const EnvSchema = z.object({
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, 'ACCESS_TOKEN_EXPIRES_IN is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, 'REFRESH_TOKEN_EXPIRES_IN is required'),
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
