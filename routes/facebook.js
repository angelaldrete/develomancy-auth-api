require('../utils/dev_env')
const passport = require('../config/passport-fb')
const router = require('express').Router()

const UI_URI = process.env.UI_URI

router.get('/auth', passport.authenticate('facebook'))

router.get('/callback', passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(UI_URI)
})

module.exports = router