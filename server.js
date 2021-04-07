// require('dotenv').config()
require('./config/db')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI
const STORE_SECRET = process.env.STORE_SECRET
const DB_CONNECT = process.env.DB_CONNECT

// Middleware
app.use(cors({ origin: UI_URI, credentials: true }))
app.set('trust proxy', true)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: true,
    httpOnly: true,
  },
  store: new MongoStore({
    mongoUrl: DB_CONNECT,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native',
    crypto: {
      secret: STORE_SECRET
    }
  })
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