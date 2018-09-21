#!/usr/bin/env node

const {lstatSync, readdirSync, readFileSync, writeFileSync} = require('fs')
const {join, parse} = require('path')
const https = require('https')
const http = require('http')
const url = require('url')
const {exec} = require('child_process')
const apiURL = process.env.KA_API_URL || 'http://0.0.0.0:8001'

// Help Output
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log()
  console.log('  Usage: [ENV] (node) sync [option]')
  console.log()
  console.log('  Options:')
  console.log()
  console.log('     -h, --help', '\t\t', 'output usage information')
  console.log('     -c, --curl', '\t\t', 'output raw curl commands')
  console.log()
  console.log('  ENV Variables:')
  console.log()
  console.log('     PULL=true', '\t\t\t', 'pull files from Files API (compare to `git pull`)')
  console.log('     PUSH=true', '\t\t\t', 'push files to Files API (compare to `git push`)')
  console.log('     DELETE_ALL=true', '\t\t', 'remove all files from Files API. USE WITH CAUTION!!!')
  console.log('     DIRECTORY=<dir>', '\t\t', 'custom folder to be scanned for files (default: src/templates)')
  console.log('     TYPE=<type>', '\t\t', 'type of files in scanned directories, otherwise use directory structure')
  console.log('     INTERVAL=<seconds>', '\t', 'duration of time in-between scans')
  console.log('     EMOJI=true', '\t\t', 'enable emoji symbols')
  console.log('     WATCH=false', '\t\t', 'disable file watch')
  console.log()
  console.log('  Examples:')
  console.log()
  console.log('     node sync --help', '\t\t', 'outputs this text')
  console.log('     node sync', '\t\t\t', 'watches </pages>, </partials>, and </specs> every <5> seconds with <text> symbol output')
  console.log('     PULL=true node sync', '\t', 'pull files from Files API (compare to `git pull`)')
  console.log('     TYPE=page node sync', '\t', 'watches <templates> and sets every file type to <page>')
  console.log('     EMOJI=true node sync', '\t', 'outputs <emoji> symbols')
  console.log()

  return
}

// Tables
const LDTIMES = {}
const LFTIMES = {}

// Arguments
let {DIRECTORY, TYPE, INTERVAL, EMOJI, WATCH, DELETE_ALL, PULL, PUSH} = process.env
DIRECTORY = DIRECTORY || '/'
INTERVAL = parseInt(INTERVAL, 10) || 5
DELETE_ALL = DELETE_ALL === 'true'
PUSH = PUSH === 'true'
PULL = PULL === 'true'

var WATCH_DIR = !(WATCH === 'false')
var CURL_OUTPUT = false
if (process.argv[2] === '--curl' || process.argv[2] === '-c') {
  CURL_OUTPUT = true
  WATCH_DIR = false
}

const PROTOCOLS = {
  'http:': {
    adapter: http,
    agent: new http.Agent({ keepAlive: true })
  },
  'https:': {
    adapter: https,
    agent: new https.Agent({ keepAlive: true })
  }
}

// Status Symbols
const SYMBOL = {
  watch: '[~]',
  create: '[+]',
  update: '[↻]',
  delete: '[-]',
  error: '[!]'
}

if (EMOJI) {
  SYMBOL.watch = '⌚ '
  SYMBOL.create = '✅ '
  SYMBOL.update = '🔄 '
  SYMBOL.delete = '❌ '
  SYMBOL.error = '⚠️ '
}

// Filesystem reader
async function read (directory, type) {
  const files = readdirSync(directory)

  if (!LFTIMES[directory]) {
    LFTIMES[directory] = {}
  }

  // Delete remote files that no longer exist locally
  if (type) {
    await Promise.all(Object.keys(LFTIMES[directory]).map((filename) => {
      return Promise.resolve()
        .then(() => {
          if (files.indexOf(filename) === -1) {
            return handle(type, filename, join(directory, filename), deleteFile)
              .then(res => {
                const path = join(directory, filename)
                handleResponse(res, 'delete', isDeleted, type, path)
                delete LFTIMES[directory][filename]
              })
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }))
  }

  return Promise.all(files.map((filename, index) => {
    const path = join(directory, filename)
    const stat = lstatSync(path)

    if (stat.isDirectory()) {
      let ltime = LDTIMES[path]
      let time = stat.mtime.toString()

      if (!ltime && WATCH_DIR) {
        console.log(`${getSymbol('watch', true)} watch: ${path}`)
      }

      LDTIMES[path] = time
      return read(path, type || filename.slice(0, -1))
    }

    // No content, return
    if (!type || !stat.size) {
      return Promise.resolve()
    }

    let ltime = LFTIMES[directory][filename]
    let time = stat.mtime.toString()

    // File has not changed, return
    if (ltime && ltime === time) {
      return Promise.resolve()
    }

    LFTIMES[directory][filename] = time

    // File needs updating
    if (ltime && ltime !== time) {
      return handle(type, filename, path, updateFile)
        .then((res) => handleResponse(res, 'update', isUpdated, type, path))
        .catch((err) => {
          console.log(err)
        })
    }

    // Delete remote file if it exists, recreate it from local file
    return handle(type, filename, path, getFile)
      .then(res => {
        // if file exists in remote, delete it
        if (res && res.total > 0) {
          return deleteFile(null, res.data[0].id, null)
            .then(res => handleResponse(res, 'delete', isDeleted, type, path))
        }
      })
      .then(() => handle(type, filename, path, createFile))
      .then(res => handleResponse(res, 'create', isCreated, type, path))
      .catch((err) => {
        console.log(err)
      })
  }))
}

async function write () {
  getFiles().then((files) => {
    files.data.forEach(file => {

      let fileName = file.name
      let contents = file.contents + '\n'
      let extension = file.type === 'spec'
        ? getSpecExtension(contents)
        : '.hbs'
      let pageType = file.type + 's'
      let filePath = (DIRECTORY + pageType + '/' + fileName + extension)
      
      if (extension === '' || !extension) {
        console.log(`Error: Not able to determine extension of ${fileName}`)
      }

      try {
        writeFileSync(filePath, contents, {flag: 'w'})
      } catch (e) {
        console.log(`Pull Failed: unable to write: ${filePath}`)
      }
    })
  })
}

// Helpers
function handleResponse (res, op, successCb, type, path) {
  const success = successCb(res)
  const symbol = getSymbol(op, success)
  console.log(`${symbol} ${op} [${type}] ${path}`)

  if (!success) {
    res = res.replace(/\n|\r\n/g, '')

    if (res.length <= 1000) {
      console.log(' ', res)
    } else {
      console.log(' ', res.substring(0, 1000))
    }
  }
}

function isCreated (res) {
  const body = JSON.parse(res.body)
  return !!body.created_at && res.statusCode === 201
}

function isDeleted (res) {
  return res.body === '' && res.statusCode === 204
}

function isUpdated (res) {
  return res.statusCode === 200
}

function getSymbol (type, status) {
  return status ? SYMBOL[type] : SYMBOL.error
}

// File handler
function handle (type, name, path, action) {
  let pathName = path.replace(DIRECTORY, '').split('/')
  let auth

  pathName.shift()
  pathName.pop()
  auth = !(pathName.length > 0 && pathName[0] === 'unauthenticated')
  pathName = pathName.join('/')

  return action(path, join(pathName, parse(name).name), type, auth)
}

// File API
function getFile (path, nameOrId, type, auth) {
  const reqUrl = `${apiURL}/files?name=${nameOrId}`

  if (CURL_OUTPUT) {
    console.log(`curl -X "${reqUrl}"`)
    return Promise.resolve()
  }

  return httpRequest(reqUrl)
    .then((res) => JSON.parse(res.body))
}

function createFile (path, name, type, auth) {
  const reqUrl = `${apiURL}/files`

  if (CURL_OUTPUT) {
    const args = `-F "name=${name}" -F "contents=@${path}" -F "type=${type}" -F "auth=${auth}"`
    console.log(`curl -X POST "${reqUrl}" ${args}`)
    return Promise.resolve()
  }

  const contents = readFileSync(path, 'utf8')
  return httpRequest(reqUrl, 'POST', JSON.stringify({name, contents, type, auth}))
}

function updateFile (path, name, type, auth) {
  const reqUrl = `${apiURL}/files/${name}`

  if (CURL_OUTPUT) {
    var args = `-F "contents=@${path}" -F "type=${type}" -F "auth=${auth}"`
    console.log(`curl -X PATCH "${reqUrl}" ${args}`)
    return Promise.resolve()
  }

  const contents = readFileSync(path, 'utf8')
  return httpRequest(reqUrl, 'PATCH', JSON.stringify({contents, type, auth}))
}

function deleteFile (path, nameOrId, type) {
  let reqUrl = `${apiURL}/files/${nameOrId}`

  if (CURL_OUTPUT) {
    console.log(`curl -X DELETE "${reqUrl}"`)
    return Promise.resolve()
  }

  return httpRequest(reqUrl, 'DELETE')
}

function httpRequest (reqUrl, method = 'GET', data = '') {
  const options = url.parse(reqUrl)
  options.method = method
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }

  options.agent = PROTOCOLS[options.protocol].agent
  const adapter = PROTOCOLS[options.protocol].adapter

  return new Promise((resolve, reject) => {
    const req = adapter.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk.toString('utf8')))
      res.on('error', reject)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode <= 299) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body })
        } else {
          reject(`Request failed. status: ${res.statusCode}, body: ${body}`)
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function getFiles (type) {
  let reqUrl = `${apiURL}/files`
  if (type) {
    reqUrl += `?type=${type}`
  }

  return httpRequest(reqUrl)
    .then((res) => JSON.parse(res.body))
}

function deleteAllFiles (files) {
  return Promise.all(files.map(file => {
    return deleteFile(null, file.id, null)
      .then(res => handleResponse(res, 'delete', isDeleted, file.type, file.name))
  }))
}

function getSpecExtension (content) {

  const fileTypes = {
    YAML: '.yaml',
    JSON: '.json'
  }

  content = typeof content !== 'string'
    ? JSON.stringify(content)
    : content

  try {
    content = JSON.parse(content)
  } catch (e) {
    return fileTypes.YAML
  }

  if (typeof content === 'object' && content !== null) {
    return fileTypes.JSON
  }

  return ''
}

async function init () {
  // Delete all files at start if env flag DELETE_ALL is 'true' (converted to boolean locally)
  if (DELETE_ALL) {
    try {
      const {data: files} = await getFiles(TYPE)
      await deleteAllFiles(files)
      return
    } catch (err) {
      console.log(`Error deleting files: ${err}`)
    }
  }

  if (PULL) {
    await write()
    return
  }

  if (PUSH) {
    await read(DIRECTORY)
    return
  }

  // When a type is set already for us, assume the directory is that type.
  if (TYPE) {
    await read(DIRECTORY, TYPE)
    WATCH_DIR && setInterval(() => read(DIRECTORY, TYPE), INTERVAL * 1000)
  } else {
    await read(DIRECTORY)
    WATCH_DIR && setInterval(() => read(DIRECTORY), INTERVAL * 1000)
  }
}

init()
