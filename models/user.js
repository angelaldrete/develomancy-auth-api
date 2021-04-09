const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

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
  displayName: {
    type: String,
    required: false
  },
  image: String
})

userSchema.methods.isValidPassword = async(password, userPassword) => {
  return await bcrypt.compare(password, userPassword)

}

module.exports = mongoose.model('User', userSchema)