const multer = require('multer')
const fs = require('fs')
const path = require('path')
const hashIt = (s) =>
  s.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

/* istanbul ignore file */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${process.cwd()}/src/public`)
  },
  filename: function (req, file, cb) {
    const parsedPath = path.parse(file.originalname)
    const filename = `file_${hashIt(file.originalname)}_${parsedPath.base}`
    cb(null, filename)
  }
})

const uploadm = multer({ storage: storage, preservePath: true }).single('file')

const uploadp = (req, res) => {
  return new Promise((resolve, reject) => {
    const dir = `${process.cwd()}/src/public`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    uploadm(req, res, function (err) {
      if (err) {
        console.log('upload failed error', err)
        return reject({ status: 500, message: err.message })
      }
      console.log(`upload complete for ${req.file.originalname} as ${req.file.filename}`)
      return resolve({ filename: req.file.filename })
    })
  })
}

const upload = async (req, res) => {
  return uploadp(req, res)
    .then((resp) => {
      return res.status(200).json(resp)
    })
    .catch((err) => {
      return res.status(err.status).send(err.message)
    })
}

const download = async (req, res) => {
  const fileName = normalizeName(req.params.fileName, res)
  if (fileName) {
    console.log('download requested for', fileName)
    const file = `${process.cwd()}/src/public/${fileName}`
    res.download(file)
  }
}

const normalizeName = (name, res) => {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
    console.log('Access denied', name)
    res.status(403).send('Access denied')
    return
  }
  return name
}

const access = async (req, res) => {
  const fileName = req.params.fileName
  console.log('access requested for', fileName)
  return res.status(200).end()
}

module.exports = {
  upload,
  download,
  access
}
