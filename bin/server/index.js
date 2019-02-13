#!/usr/bin/env node
const Handlebars = require('handlebars')
const dispatch = require('micro-route/dispatch')
const micro = require('micro')
const path = require('path')
const dir = require('node-dir')
const fs = require('fs-extra')

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
  
  for (let index in files) {
    results.push({
      contents: await fs.readFile(files[index], 'utf8'),
      path: files[index],
      filename: path.basename(files[index]),
      name: path.basename(files[index]).split('.')[0],
      
      /**
       * Here we get the filename path for router matching by removing the directive,
       * removing the relative prefix first, then we take care of the file extension,
       * finally we want to remove the forward slash at the beginning.
       * 
       * [./]theme/default/partials
       *  ^                                         login(0)[.]hbs(1)
       *                  .substr(1)                      ^
       *                          ^
       * [theme/default/partials][/]unauthenticated/[login.hbs] -> unauthenticated/login
       */
      path: files[index].replace(dirname.replace('./', ''), '').split('.')[0].substr(1)
    })
  }

  return results
}

let auth = false

// Renderer
module.exports = dispatch()
  .dispatch('/favicon.ico', 'GET', async (req, res) => {
    res.end()
  })
  .dispatch('/do_authorize', 'GET', async (req, res) => {
    auth = true
    res.end()
  })
  .dispatch('/do_unauthorize', 'GET', async (req, res) => {
    auth = false
    res.end()
  })
  .dispatch('/*', 'GET', async (req, res, { params, query }) => {
    let partials = await read(PARTIALS_DIR)
    let pages = await read(PAGES_DIR)
    let specs = await read(SPECS_DIR)
    let options = {
      config: {
        PORTAL_GUI_URL: 'http://localhost:3000',
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
    
    // Pagename helper
    function getPageName (authorized) {
      if (!params._) {
        return authorized ? 'index' : 'unauthenticated/index'
      }

      return authorized ? params._ : 'unauthenticated/' + (params._ || '')
    }

    // Root
    let pagename = getPageName(auth) || 'index'
    let page = pages.find((page) => page.path === pagename)
    if (page) {
      res.end(Handlebars.compile(page.contents)(options))
      return
    }
    
    // Indexes
    pagename = getPageName(auth) + '/index'
    page = pages.find((page) => page.path === pagename)
    if (page) {
      res.end(Handlebars.compile(page.contents)(options))
      return
    }

    // Loaders
    pagename = getPageName(auth) + '/loader'
    page = pages.find((page) => page.path === pagename)
    if (page) {
      res.end(Handlebars.compile(page.contents)(options))
      return
    }
    
    // Unauthenticated, but authenticated exists
    if (!auth) {
      let loginPage = pages.find((page) => page.path === 'unauthenticated/login')

      // Page or Authorized Homepage
      pagename = getPageName(true) || 'index'
      let page = pages.find((page) => page.path === pagename)
      if (page) {
        res.end(Handlebars.compile(loginPage.contents)(options))
        return
      }

      // Authenticated Indexes
      pagename = getPageName(true) + '/index'
      page = pages.find((page) => page.path === pagename)
      if (page) {
        res.end(Handlebars.compile(loginPage.contents)(options))
        return
      }
 
      // Authenticated Loaders
      pagename = getPageName(true) + '/loader'
      page = pages.find((page) => page.path === pagename)
      if (page) {
        res.end(Handlebars.compile(loginPage.contents)(options))
        return
      }
    }

    let notFoundPage = pages.find((page) => page.path === '404')
    res.end(Handlebars.compile(notFoundPage.contents)(options))
    return
  })