require('../utils/dev_env')

const passport = require('passport')
const FacebookStrategy = require('passport-facebook')
const User = require('../models/user')

// Fb Auth
const FB_APP_ID = process.env.FB_APP_ID
const FB_SECRET_ID = process.env.FB_SECRET_ID
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI

passport.use(new FacebookStrategy({
  clientID: FB_APP_ID,
  clientSecret: FB_SECRET_ID,
  callbackURL: process.env.NODE_ENV !== 'production' ? 'http://localhost:4000/api/facebook/callback' : FB_REDIRECT_URI,
  profileFields: ['id', 'displayName', 'photos', 'email'],
  enableProof: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ facebookId: profile._json.id })
    if (!user) {
      const newUser = new User({
        facebookId: profile._json.id,
        displayName: profile._json.name,
        email: profile._json.email,
        image: profile._json.picture.data.url
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