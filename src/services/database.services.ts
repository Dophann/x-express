import { Collection, Db, MongoClient, MongoServerError } from 'mongodb'
import envConfig from '~/constants/env'
import Follower from '~/models/followers.model'
import RefreshToken from '~/models/refresh_tokens.model'
import User from '~/models/users.model'

const uri = `mongodb://localhost:27017/${envConfig.DB_NAME}`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db()
  }
  async connect() {
    try {
      await this.client.connect()
      await this.db.command({ ping: 1 })
      console.log('Connect to MongoDB success!')
    } catch (error) {
      if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`)
      }
      throw error // still want to crash
    }
  }
  get users(): Collection<User> {
    return this.db.collection('users')
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('refresh_tokens')
  }
  get followers(): Collection<Follower> {
    return this.db.collection('followers')
  }
}

const databaseService = new DatabaseService()
export default databaseService
