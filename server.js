// require('dotenv').config()
require('./config/db')
const express = require('express')
const session = require('express-session')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI

// Middleware
app.use(cors({ origin: UI_URI, credentials: true }))
app.set('trust proxy', 1)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
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