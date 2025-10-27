require('dotenv').config()
const args = require('./args')
const auth = require('./auth')
const publisher = require('./publisher')

const dumpOptions = () => {
  Object.keys(args.options).forEach(key => {
    if (key !== 'password') {
      console.log(`${key}: ${args.options[key]}`)
    }
  })
}

const validateOptions = () => {
  if (args.options.help) {
    console.log(args.usage)
    process.exit(0)
  }

  if (!args.options.input && !args.options.usepjs) {
    console.log(args.usage)
    process.exit(1)
  }
}

const usePublicationJS = () => {
  return args.options.usepjs
}

const useQuickView = () => {
  return args.options.quickview
}

const login = async () => {
  return await auth.login(args.options.user, args.options.password)
}

const publish = async token => {
  return args.options.usepjs
    ? undefined
    : args.options.quickview
    ? await publisher.uploadOnly(token, args.options.input)
    : await publisher.publish(token, args.options.input)
}

module.exports = {
  options: args.options,
  validateOptions,
  usePublicationJS,
  login,
  publish,
  dumpOptions,
  useQuickView
}
