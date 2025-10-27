require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const routers = require('./routes')

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static('src/public'))

app.use(routers)

module.exports = app
