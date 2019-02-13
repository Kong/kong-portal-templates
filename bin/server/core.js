// Add event listener to a parent element for a child target
// @example addEvent(document, 'click', '.selector', () => {})
function addEvent (parent, evt, selector, handler) {
  parent.addEventListener(evt, function (event) {
    if (event.target.matches(selector + ', ' + selector + ' *')) {
      handler.apply(event.target.closest(selector), arguments)
    }
  }, false)
}

if (window.location.pathname === '/' && false) {
  window.location.pathname = 'default'
}

// Check if page was navigated to via browser history (back/forward)
// if so reload browser to ensure proper instantiation of JS.
if (window.performance.navigation.type === 2) {
  location.reload(true)
}

// Initialize Root Datastore
window._kong = {
  apps: [],
  api: {
    get: () => {
      return Promise.resolve({ data: { data: [] }})
    }
  }
}

// Handle registered applications
window.registerApp = function (fn) {
  window._kong.apps.push(fn)
}

// Events

// Dropdown List Toggle
addEvent(document, 'click', 'li.dropdownWrapper', function (event) {
  this.classList.toggle('open')
})

// Mobile Menu Trigger
addEvent(document, 'click', '.menu-trigger', function (event) {
  this.classList.toggle('open')

  const menu = document.querySelector('.header-nav-container')
  if (menu) menu.classList.toggle('open')

  const overlay = document.querySelector('.overlay')
  if (overlay) overlay.classList.toggle('on')
})

addEvent(document, 'click', '#logout', function (event) {
  event.stopImmediatePropagation()
  event.preventDefault()
  window.location = '/_logout'
})

addEvent(document, 'submit', '#login', function (event) {
  event.preventDefault()
  window.location = '/_login?redirect=' + window.location.pathname
})

addEvent(document, 'submit', '#register', function (event) {
  event.preventDefault()
  window.location = '/_login?redirect=' + window.location.pathname
})

// On Load

window.onload = () => {
  window.React = React
  window.YAML = jsyaml
  window.Vue = Vue

  let interval = setInterval(() => {
    if (window._kong.loaded) {
      console.log('loading apps', window._kong.apps)
      window._kong.apps.forEach(app => app(window._kong))
      clearInterval(interval)
    }
  }, 80)
}