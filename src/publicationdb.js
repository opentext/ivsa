const nedbp = require('nedb-promises')

const publicationDB = nedbp.create({ filename: `${process.cwd()}/src/datastore/publications.db` })
// publicationDB.load();

module.exports = {
  publicationDB
}
