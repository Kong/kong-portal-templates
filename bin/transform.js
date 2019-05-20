const {lstatSync, existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync} = require('fs')
const {join, dirname} = require('path').posix
const Babel = require('@babel/core')
const pretty  = require('pretty')
const jsdom = require("jsdom")

let { JSDOM } = jsdom
let { SRC_DIR, DEST_DIR } = process.env

SRC_DIR = SRC_DIR || 'themes/default'
DEST_DIR = DEST_DIR || `${SRC_DIR}-ie11`

function iterateOverPathsInDir (directory, cb) {
  const files = readdirSync(directory)

  Promise.all(files.map((filename) => {
    const path = join(directory, filename)
    const stat = lstatSync(path)

    if (stat.isDirectory()) {
      return iterateOverPathsInDir(path, cb)
    }

    cb(path)
    Promise.resolve()
  }))
}

function htmlDecode (html) {
  let domEl = new JSDOM().window.document
  let txt = domEl.createElement('textarea')
  txt.innerHTML = html

  return txt.value
}

function ensureDirectoryExistence(filePath) {
  let directory = dirname(filePath)
  if (existsSync(directory)) {
    return true
  }
  ensureDirectoryExistence(directory)
  mkdirSync(directory)
}

function transformAndWriteFile(path) {
  let splitPath = path.replace(SRC_DIR.replace('./', ''), '').split('/')
  let newPath = DEST_DIR + splitPath.join('/')
  let rawContents = readFileSync(path, "utf8")
  contents = transform(rawContents)

  ensureDirectoryExistence(newPath)
  writeFileSync(newPath, contents, {flag: 'w'})
}

function transform (rawContents) {
  const domDocument = new JSDOM(rawContents).window.document
  const scripts = domDocument.querySelectorAll("script")

  if (!scripts.length) {
    return rawContents
  }

  scripts.forEach(content => {
    if (content.innerHTML) {
      content.innerHTML = Babel.transform(
        content.innerHTML,
        { presets: ['@babel/preset-env'] }
      ).code
    }
  })

  let encodedHTML =
    domDocument.querySelector("body").innerHTML ||
    domDocument.querySelector("head").innerHTML

  let decodedHTML = htmlDecode(encodedHTML)
  return pretty(decodedHTML)
}

iterateOverPathsInDir(SRC_DIR, transformAndWriteFile)

