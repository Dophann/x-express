const MESSAGES = {
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_MUST_BE_FROM_1_TO_100_CHARACTERS: 'Name must be from 1 to 100 characters',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_MUST_BE_A_STRING: 'Email must be a string',
  EMAIL_MUST_BE_AN_EMAIL: 'Email must be an email',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_MUST_BE_AT_LEAST_8_AND_MAX_50_CHARACTERS: 'Password must be at least 8 and max 50 characters',
  PASSWORD_MUST_BE_STRONG:
    'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_IS_NOT_CORRECT: 'Confirm password is not correct',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601'
} as const

export const USER_MESSAGES = {
  REGISTER_SUCCESS: 'Register successfully',
  LOGIN_SUCCESS: 'Login successfully',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_NOT_EXIST_OR_NOT_VALID: 'Refresh token not exist or not valid',
  LOGOUT_SUCCESS: 'Logout successfully'
} as const

export default MESSAGES
