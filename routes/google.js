require('../utils/dev_env')
const passport = require('../config/passport-google')
const router = require('express').Router()

const UI_URI = process.env.UI_URI

router.get('/auth', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(UI_URI)
})

module.exports = router