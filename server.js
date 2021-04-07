// require('dotenv').config()
require('./config/db')
const client = require('./config/cache')

const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const RedisStore = require('connect-redis')(session)
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI
const COOKIE_SECRET = process.env.COOKIE_SECRET

// Middleware
app.use(cors({ origin: UI_URI, credentials: true }))
app.enable('trust proxy')
app.use(cookieParser(COOKIE_SECRET))
app.use(session({
  store: new RedisStore({ client: client }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 360000,
    sameSite: 'lax'
  }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const authRoutes = require('./routes/auth')
app.use('/api/user', authRoutes)

app.get('/', (req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})