require('../utils/dev_env')

const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const User = require('../models/user')

// Google Auth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_SECRET_ID = process.env.GOOGLE_SECRET_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_SECRET_ID,
  callbackURL: process.env.NODE_ENV !== 'production' ? 'http://localhost:4000/api/google/callback' : GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ googleId: profile.id })
    if (!user) {
      const newUser = new User({
        googleId: profile.id,
        displayName: profile.name.givenName,
        email: profile._json.email,
        image: profile._json.picture
      })

      console.log('New user created')
      await newUser.save()
      done(null, newUser)
    }

    done(null, user)

  } catch (err) {
    return done(err, null)
  }
}))

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user)
  })
})

module.exports = passport