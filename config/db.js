const mongoose = require('mongoose')

const uri = process.env.DB_CONNECT
const client = mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

module.exports = client