// require('dotenv').config()
require('./config/db')
const client = require('./config/cache')

const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
// const RedisStore = require('connect-redis')(session)
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 4000
const SESSION_SECRET = process.env.SESSION_SECRET
const UI_URI = process.env.UI_URI

// Middleware
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.enable('trust proxy')
// app.use(cors({ origin: UI_URI, credentials: true }))
// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.CA_PORT || 8080;

var cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});

var sess = {
  // store: new RedisStore({ client: client }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // proxy: true,
  cookie: {
    secure: true,
    // path: '/',
    httpOnly: true,
    maxAge: 360000,
    sameSite: 'lax'
  }
}

app.use(session(sess))

// Routes
const authRoutes = require('./routes/auth')
app.use('/api/user', authRoutes)

app.get('/', (req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})