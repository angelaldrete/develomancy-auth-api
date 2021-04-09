require('./utils/dev_env')
require('./config/db')

const express = require('express')
const app = express()
const session = require('express-session')
const cors = require('cors')
const passport = require('passport')

const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: UI_URI, credentials: true }))
app.set('trust proxy', 1)
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    sameSite: 'none',
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}))
app.use(passport.initialize())
app.use(passport.session())

// Routes
const authRoutes = require('./routes/auth')
const googleOauth = require('./routes/google')
const fbOauth = require('./routes/facebook')

app.use('/api/user', authRoutes)
app.use('/api/google', googleOauth)
app.use('/api/facebook', fbOauth)

app.get('/', (req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})