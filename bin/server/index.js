#!/usr/bin/env node
const Handlebars = require('handlebars')
const dispatch = require('micro-route/dispatch')
const micro = require('micro')
const path = require('path')
const dir = require('node-dir')
const fs = require('fs-extra')
const qs = require('querystring')
const url = require('url')

// Helpers
const markdown = require('helper-markdown')

Handlebars.registerHelper('json', (context) => JSON.stringify(context))
Handlebars.registerHelper('raw', (options) => options.fn(this))
Handlebars.registerHelper('eq', (val1, val2) => val1 === val2)
Handlebars.registerHelper('currentYear', () => new Date().getFullYear())
Handlebars.registerHelper('setToWindow', (name, item) => { window[name] = item })
Handlebars.registerHelper('markdown', markdown())

// Environment Variables
let DIRECTORY = process.env.DIRECTORY || './themes/default/'

// Theme Types
let PARTIALS_DIR = path.join(DIRECTORY, 'partials')
let PAGES_DIR = path.join(DIRECTORY, 'pages')
let SPECS_DIR = path.join(DIRECTORY, 'specs')

// Helpers
const read = async (dirname) => {
  let files = await dir.promiseFiles(dirname)
  let results = []
  let dirparts = dirname.split('/')
  let hasType = dirparts.length > 3
  let type = dirparts.pop()
  
  hasType = type === '' ? false : true

  for (let index in files) {
    let filepath = files[index].replace(dirname.replace('./', ''), '').split('.')[0]

    results.push({
      auth: files[index].indexOf('unauthenticated') > -1 ? false : true,
      type: hasType ? type : filepath.split('/')[0].slice(0, -1),
      contents: await fs.readFile(files[index], 'utf8'),
      path: files[index],
      filename: path.basename(files[index]),
      name: path.basename(files[index]).split('.')[0],
      path: hasType ? filepath.substr(1) : filepath.split('/').slice(1).join('/'),
      title: hasType ? filepath.substr(1) : filepath.split('/').slice(1).join('/'),
    })
  }

  return results
}

const query = req => {
	return qs.parse((url.parse(req.url).search || '').substr(1))
}

// Renderer
module.exports = dispatch()
  .dispatch('/favicon.ico', 'GET', async (req, res) => {
    res.end()
  })
  .dispatch('/_portal_api/files', 'GET', async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      data: await read(DIRECTORY)
    }))
  })
  .dispatch('/_logout', 'GET', async (req, res) => {
    res.statusCode = 302;
    res.setHeader('Set-Cookie', 'auth=false;')
    res.setHeader('Location', '/')
    res.end()
  })
  .dispatch('/_login', 'GET', async (req, res) => {
    let location = query(req).redirect || '/'

    location = location === '/login' ? '/' : location
    location = location === '/register' ? '/' : location

    res.statusCode = 302;
    res.setHeader('Set-Cookie', 'auth=true;')
    res.setHeader('Location', location)
    res.end()
  })
  .dispatch('/*', 'GET', async (req, res, { params, query }) => {
    let partials = await read(PARTIALS_DIR)
    let pages = await read(PAGES_DIR)
    let specs = await read(SPECS_DIR)
    let auth = (req.headers.cookie || '').indexOf('auth=true') > -1
    let options = {
      config: {
        PORTAL_GUI_URL: 'http://localhost:3000',
        WORKSPACE: null
      },
      authData: {
        authType: 'basic-auth'
      },
      isAuthenticated: auth
    }

    partials.forEach(partial => {
      Handlebars.registerPartial(partial.path, partial.contents)
    })
    
    res.setHeader('Content-Type', 'text/html')
    
    // Helpers
    function getPageName (authorized) {
      if (!params._) {
        return authorized ? 'index' : 'unauthenticated/index'
      }

      return authorized ? params._ : 'unauthenticated/' + (params._ || '')
    }
    
    async function render (page, contents = '') {
      contents += `
        <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/3.12.1/js-yaml.min.js"></script>
        <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/vue@2.5.22/dist/vue.js"></script>
      `
      contents += '<script>'
      contents += await fs.readFile('./bin/server/core.js', 'utf8')
      contents += '</script>'
      contents += Handlebars.compile(page.contents)(options)
      contents += '<script>window._kong.loaded = true</script>'
      contents += `<script>window.K_CONFIG = ${JSON.stringify(options.config)}</script>`

      res.end(contents)
    }

    // Root
    let pagename = getPageName(auth) || 'index'
    let page = pages.find((page) => page.path === pagename)
    if (page) {
      render(page)
      return
    }
    
    // Indexes
    pagename = getPageName(auth) + '/index'
    page = pages.find((page) => page.path === pagename)
    if (page) {
      render(page)
      return
    }

    // Loaders
    pagename = getPageName(auth) + '/loader'
    page = pages.find((page) => page.path === pagename)
    if (page) {
      render(page)
      return
    }
    
    // Unauthenticated, but authenticated exists
    if (!auth) {
      let loginPage = pages.find((page) => page.path === 'unauthenticated/login')

      // Page or Authorized Homepage
      pagename = getPageName(true) || 'index'
      let page = pages.find((page) => page.path === pagename)
      if (page) {
        render(loginPage)
        return
      }

      // Authenticated Indexes
      pagename = getPageName(true) + '/index'
      page = pages.find((page) => page.path === pagename)
      if (page) {
        render(loginPage)
        return
      }
 
      // Authenticated Loaders
      pagename = getPageName(true) + '/loader'
      page = pages.find((page) => page.path === pagename)
      if (page) {
        render(loginPage)
        return
      }
    }

    let notFoundPage = pages.find((page) => page.path === '404')
    render(notFoundPage)
    return
  })