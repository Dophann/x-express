import { ObjectId } from 'mongodb'

interface FollowerType {
  _id?: ObjectId
  user_id: ObjectId
  created_at?: Date
  followed_user_id: ObjectId
}

export default class Follower {
  _id?: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
  user_id: ObjectId
  constructor({ created_at, followed_user_id, user_id, _id }: FollowerType) {
    this._id = _id
    this.followed_user_id = followed_user_id
    this.created_at = created_at ?? new Date()
    this.user_id = user_id
  }
}
