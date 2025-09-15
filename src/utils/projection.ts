import User from '~/models/users.model'

export const userProjection: Partial<Record<keyof User, 0 | 1>> = {
  password: 0,
  forgot_password_token: 0,
  email_verify_token: 0,
  verify: 0,
  created_at: 0,
  updated_at: 0
}
