// require('dotenv').config()/
const express = require('express')
const app = express()
const session = require('express-session')
const cors = require('cors')
const MemcachedStore = require('connect-memjs')(session)
const db = require('./config/db')

const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI

// Middleware
app.use(cors({ origin: UI_URI, credentials: true }))
app.set('trust proxy', 1)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    maxAge: 14 * 60 * 60 * 24,
    httpOnly: false,
  },
  store: new MemcachedStore({
    servers: [process.env.MEMCACHIER_SERVERS],
    username: process.env.MEMCACHIER_USER,
    password: process.env.MEMCACHIER_PASSWORD,
    prefix: '_session_',
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