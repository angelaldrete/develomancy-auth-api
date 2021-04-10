require('../config/passport-fb')
require('../config/passport-google')

const router = require('express').Router()
const User = require('../models/user')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

/**
 * Local Auth
 */

passport.use('login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email })
    if (!user) { return done(null, false) }
    const validate = await user.isValidPassword(password, user.password)
    if (!validate) { return done(null, false) }
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

passport.serializeUser((user, done) => done(null, user._id))

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user)
  })
})

router.get('/', (req, res) => {
  if (req.user) {
    return res.send(req.user)
  } else {
    req.logout()
  }
})

router.post('/register', async (req, res) => {

  // Check if user already exists
  const userExists = await User.findOne({ email: req.body.email })

  if (userExists) {
    return res.send({
      success: false,
      message: 'User already exists'
    })
  }

  // Password hashing
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(req.body.password, salt)

  // Geberating the user
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashPassword
  })

  try {

    // Creating the user
    const savedUser = await User.create(user)
    res.send(savedUser)
  } catch (err) {

    console.log(err)
    // Error creating the user
    res.status(400).send(err)
  }
})

router.post('/login', passport.authenticate('login'), (req, res) => {
  if (req.user) {
    res.send(req.user)
  } else {
    req.logout()
    res.sendStatus(200)
  }
})

router.get('/logout', (req, res) => {
  if (req.user) {
    req.logout()
    res.sendStatus(200)
  }
})

module.exports = router