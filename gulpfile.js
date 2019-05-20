const fs      = require('fs')
const gulp    = require('gulp')
const jsdom   = require("jsdom")
const pretty  = require('pretty')
const through = require('through2')
const Babel   = require('@babel/core')

let { JSDOM } = jsdom
let { SRC_DIR, DEST_DIR } = process.env

let src = SRC_DIR || './themes/default'
let dest = DEST_DIR || `${src}-ie11`

function htmlDecode (html) {
  let domEl = new JSDOM().window.document
  let txt = domEl.createElement('textarea')
  txt.innerHTML = html

  return txt.value
}

function transform () {
  return through.obj(function (file, _, callback) {
    if (file.isDirectory()) {
      this.push(file)
      return callback()
    }

    const domDocument = new JSDOM(fs.readFileSync(file.path, "utf8")).window.document
    const scripts = domDocument.querySelectorAll("script")

    if (!scripts.length) {
      this.push(file)
      return callback()
    }

    scripts.forEach(content => {
      if (content.innerHTML) {
        content.innerHTML = Babel.transform(content.innerHTML, { presets: ['@babel/preset-env'] }).code
      }
    })
  
    let encodedHTML = domDocument.querySelector("body").innerHTML || domDocument.querySelector("head").innerHTML
    let decodedHTML = htmlDecode(encodedHTML)
    let prettyHTML = pretty(decodedHTML)

    file.contents = new Buffer(prettyHTML)
    this.push(file)

    return callback()
  })
}

gulp.task('default', () =>
  gulp.src(`${src}/**`, '{hbs}')
  .pipe(transform())
  .pipe(gulp.dest(dest))
)
