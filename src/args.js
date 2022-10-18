require('dotenv').config()
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const optionDefinitions = [
  {
    name: 'user',
    alias: 'u',
    type: String,
    description:
      'The login user name for password grant authentication. ' +
      'This option is ignored if client credential grant authentication is enabled. ' +
      'Application will prompt for user if required and not supplied on the command line.'
  },
  {
    name: 'password',
    alias: 'p',
    type: String,
    description:
      'The login password for password grant authentication. ' +
      'This option is ignored if client credential grant authentication is enabled. ' +
      'Application will prompt for password if required and not supplied on the command line.'
  },
  {
    name: 'filenamehint',
    alias: 'm',
    type: String,
    description:
      'The file name along with the extension of the document. ' +
      'This can be used only along with http file url input option.'
  },
  {
    name: 'usepjs',
    alias: 'r',
    type: Boolean,
    description:
      'Run the sample application to use publications from the publication.js file. ' +
      'Copy paste the publication response into publication.js file to the publications array and run ivsa -r '
  },
  {
    name: 'input',
    defaultOption: true,
    alias: 'i',
    typeLabel: '{underline filepath}',
    multiple: true,
    description:
      'The file to publish and view. The filepath can be 1) a single file to publish, 2) a single directory with multiple files to publish, and 3) a single directory with a single file and a single XRLMarkups directory with multiple XRL Markup files to publish (convert from XRL to JSON and store in the markup-service).\nSample 1) .../ivsa-1.9>npm run start:windows -- -C -i C:/W4.pdf\nSample 2) .../ivsa-1.9>npm run start:windows -- -C -i C:/documents\nSample 3) .../ivsa-1.9>npm run start:windows -- -C -i C:/documentWithXRLsNeedingConversion\nwhere the included files in the directory are:\nC:/documentWithXRLsNeedingConversion/file1.pdf\nC:/documentWithXRLsNeedingConversion/XRLMarkups/markup1.xrl\nC:/documentWithXRLsNeedingConversion/XRLMarkups/markup2.xrl'
  },
  {
    name: 'forcepub',
    type: Boolean,
    alias: 'F',
    description:
      'Force creation of a new publication. Ignore a cached publication but still save the new publication to cache.'
  },
  {
    name: 'cleanpub',
    type: Boolean,
    alias: 'C',
    description: 'Clean the cached publications.db datastore at the time of startup.'
  },
  {
    name: 'noui',
    type: Boolean,
    alias: 'N',
    description:
      'Immediately exit the application CLI after opening the viewer. NOTE: Viewer UI refresh will fail if this option is used.'
  },
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.' }
]
const sections = [
  {
    header: 'ivsa',
    content:
      'Provides sample integration implementations for Intelligent Viewing and Core Viewing and Transformation.'
  },
  {
    header: 'Synopsis',
    content: '$ ivsa [--user {underline type}] [--password {underline type}] {underline filepath}'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
]

const options = commandLineArgs(optionDefinitions)
const usage = commandLineUsage(sections)

/* istanbul ignore next */
options.input && options.input[0].startsWith('http') && (process.env.FILESTORE_PLUGIN = 'httpurl')

module.exports = {
  options,
  usage
}
