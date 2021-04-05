const mongoose = require('mongoose')

const uri = process.env.DB_CONNECT
mongoose.connect(uri)

module.exports = mongoose