const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  birthday: {
    type: String,
    required: false,
  },
  role: {
    type: [String],
    values: ['user', 'admin'],
    default: 'user',
    required: false,
  },
  email: String,
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  facebookId: {
    type: String
  },
  googleId: {
    type: String
  },
  image: String
})

module.exports = mongoose.model('User', userSchema)