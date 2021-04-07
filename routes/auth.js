const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const client = require('../config/cache')
const axios = require('axios')
const {google} = require('googleapis');
const qs = require('qs')

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

// Facebook Auth
const FB_APP_ID = process.env.FB_APP_ID
const FB_SECRET_ID = process.env.FB_SECRET_ID
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI

// Google Auth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_SECRET_ID = process.env.GOOGLE_SECRET_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_SECRET_ID,
  GOOGLE_REDIRECT_URI
);

const UI_URI = process.env.UI_URI

const fbGraphUrl = "https://graph.facebook.com/v10.0/oauth/access_token"
const fbGraphMe = "https://graph.facebook.com/me"

const googleApiUrl = "https://oauth2.googleapis.com/token"
const googleOpenIdConfig = "https://accounts.google.com/.well-known/openid-configuration"

/**
 * Local Auth
 */

router.post('/register', async (req, res) => {

  // Check if user already exists
  const userExists = await User.findOne({ email: req.body.email })

  if (userExists) {
    return res.send({
      success: false,
      message: 'User already exists'
    })
  }

  // Password hashing
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(req.body.password, salt)

  // Geberating the user
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashPassword
  })

  try {

    // Creating the user
    const savedUser = await User.create(user)
    res.send(savedUser)
  } catch (err) {

    // Error creating the user
    res.status(400).send(err)
  }
})

router.post('/login', async (req, res) => {

  // Check if email exists
  try {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      return res.status(400).send({
        message: 'Email or password incorrect'
      })
    }

    // Password validation
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) return res.status(400).send({
      message: 'Invalid Password'
    })

    // Logged in
    const accessToken = generateAccessToken({ _id: user._id })
    const refreshToken = jwt.sign({ _id: user._id }, REFRESH_TOKEN_SECRET)

    // Push refresh token to Redis
    client.setex(user._id.toString(), 17280000, refreshToken)


    res.send({
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    })
  } catch (err) {
    res.sendStatus(400)
  }

})

router.post('/token', async (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.send(401)

  try {

    const user = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
    client.get(user._id.toString(), (err, reply) => {
      if (err) throw err
      if (reply === null) return res.sendStatus(403)

      const accessToken = generateAccessToken({_id: user._id})
      res.send({
        accessToken: accessToken
      })
    })

  } catch (err) {
    res.sendStatus(403)
  }
})

router.post('/logout', (req, res) => {

  const refreshToken = req.body.token
  try {
    const user = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
    client.del(user._id.toString())
    res.sendStatus(204)
  } catch (err) {
    res.sendStatus(403)
  }
})

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, {
    expiresIn: '10m'
  })
}

/**
 * Facebook Auth
 */

router.get('/auth/facebook', async (req, res) => {
  try {

    // Get state
    const state = req.query.state
    req.session.stateValue = state

    console.log(req.session)

    // Ask for consent
    return res.send({
      url: `https://www.facebook.com/v10.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${FB_REDIRECT_URI}&auth_type=rerequest&scope=email&state=${state}`
    })

  } catch (err) {
    // Handle errors
    console.log(err)
    return res.status(403).send({
      message: `Error: ${err}`
    })
  }
})

router.get('/facebook/callback', async (req, res) => {
  // Check for state value
  if (req.query.state === req.session.stateValue) {
    try {

      // Access granted
      const FB_CODE = req.query.code
      const response = await axios.get(fbGraphUrl, { params: {
        client_id: FB_APP_ID,
        redirect_uri: FB_REDIRECT_URI,
        client_secret: FB_SECRET_ID,
        code: FB_CODE,
      }}, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        }
      })

      // Got Token
      req.session.access_token = response.data.access_token

      // Get User
      const accessToken = req.session.access_token
      const profile = await axios.get(`${fbGraphMe}?fields=email,name,id`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (profile) {

        // Check if user exists in DB or Create
        const user = await User.findOne({ facebookId: profile.data.id })
        if (!user) {
          const firstName = profile.data.name.split(' ')[0]
          const lastName = profile.data.name.split(' ')[1]
          const facebookId = profile.data.id
          const email = profile.data.email
          await User.create({
            firstName: firstName,
            lastName: lastName,
            facebookId: facebookId,
            email: email
          })
        }

      }

      // Redirect to UI
      return res.redirect(UI_URI)

    } catch (err) {
      console.log(err)
      return res.redirect(UI_URI)
    }
  } else {
    res.send({
      message: 'Not same state'
    })
  }
})

router.get('/facebook/profile', async (req, res) => {
  if (req.session.access_token) {
    try {
      const accessToken = req.session.access_token
      const response = await axios.get(fbGraphMe, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response) {
        const user = await User.findOne({ facebookId: response.data.id })
        if (user) {
          res.send({
            data: {
              user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              },
            }
          })
        } else {
          res.send({})
        }
      } else {
        req.session.destroy()
        res.send({})
      }
    } catch (err) {
      res.send({
        message: err
      })
    }

  } else {
    res.send({})
  }
})

router.get('/facebook/logout', (req, res) => {
  if(req.session.access_token) {
    req.session.destroy()
    return res.send({})
  }
})

/**
 * Google Auth
 */

router.get('/auth/google', async (req, res) => {

  try {

    const state = req.query.state
    req.session.googleState = state

    const scopes = [
      'email',
      'openid',
      'profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state
    });

    return res.send({
      url: url
    })

  } catch (err) {
    console.log(err)
  }
})

router.get('/google/callback', async (req, res) => {

  if(req.query.state === req.session.googleState) {
    try {

      const GOOGLE_CODE = req.query.code
      const data = qs.stringify({
        code: GOOGLE_CODE,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_SECRET_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })

      const response = await axios.post(googleApiUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const ticket = await oauth2Client.verifyIdToken({
        idToken: response.data.id_token,
        audience: GOOGLE_CLIENT_ID
      })

      const userId = ticket.getUserId()
      const payload = ticket.getPayload()

      const user = await User.findOne({ googleId: userId })
      if (!user) {
        const newUser = {
          firstName: payload['name'].split(' ')[0],
          lastName: payload['name'].split(' ')[1],
          email: payload['email'],
          image: payload['picture'],
          googleId: userId
        }
        await User.create(newUser)
      }

      req.session.google_access_token = response.data.access_token
      req.session.id_token = response.data.id_token
      return res.redirect(UI_URI)

      // if ((payload.iss === "https://accounts.google.com" ||
      // payload.iss === "accounts.google.com") &&
      // (payload.aud === GOOGLE_CLIENT_ID) &&
      // (payload.exp < Date.now())) {

    } catch (err) {
      console.log(err)
    }
  } else {
    res.send({
      message: 'Not same state',
      states: [
        req.query.state,
        req.session.googleState
      ]
    })
  }

})

router.get('/google/profile', async (req, res) => {
  if (req.session.google_access_token && req.session.id_token) {
    try {
      const accessToken = req.session.google_access_token
      const userInfoEndpoint = await axios.get(googleOpenIdConfig)
      const response = await axios.get(userInfoEndpoint.data.userinfo_endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response) {
        const user = await User.findOne({ googleId: response.data.sub })
        if (user) {
          const firstName = response.data.name.split(' ')[0]
          const lastName = response.data.name.split(' ')[1]
          res.send({
            data: {
              user: {
                _id: user._id,
                firstName: firstName,
                lastName: lastName,
                email: user.email
              },
            }
          })
        } else {
          res.send({})
        }
      } else {
        req.session.destroy()
        res.send({})
      }

    } catch (err) {
      console.log(err)
    }
  } else {
    res.send({})
  }

  //     if (response) {
  //       const user = await User.findOne({ facebookId: response.data.id })
  //       if (user) {
  //         res.send({
  //           data: {
  //             user: {
  //               _id: user._id,
  //               firstName: user.firstName,
  //               lastName: user.lastName,
  //               email: user.email
  //             },
  //           }
  //         })
  //       } else {
  //         res.send({})
  //       }
  //     } else {
  //       req.session.destroy()
  //       res.send({})
  //     }
  //   } catch (err) {
  //     res.send({
  //       message: err
  //     })
  //   }

  // } else {
  //   res.send({})
  // }
})

router.get('/google/logout', (req, res) => {
  if(req.session.google_access_token && req.session.id_token) {
    req.session.destroy()
    return res.send({})
  }
})




module.exports = router