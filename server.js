// require('dotenv').config()/
const express = require('express')
const app = express()
const session = require('express-session')
const cors = require('cors')
const MongoStore = require('connect-mongo')
const db = require('./config/db')

const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI
const STORE_SECRET = process.env.STORE_SECRET

// Middleware
app.use(cors({ origin: UI_URI, credentials: true }))
app.set('trust proxy', 1)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: true,
    httpOnly: false,
  },
  store: MongoStore.create({
    client: db.connect(),
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