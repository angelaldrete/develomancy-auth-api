const redis = require('redis')
const PORT = process.env.REDIS_PORT || 6379
const REDIS_PW = process.env.REDIS_PW
const REDIS_HOST = process.env.REDIS_HOST

const client = redis.createClient({
    port: PORT,
    host: REDIS_HOST,
    password: REDIS_PW,
    tls: {}
  })

client.on('error', err => {
  console.log(err)
})

module.exports = client