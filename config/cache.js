const redis = require('redis')
const PORT = process.env.REDIS_PORT || 6379
const REDIS_PW = process.env.REDIS_PW

const client = redis.createClient(PORT)
client.auth(REDIS_PW)

module.exports = client