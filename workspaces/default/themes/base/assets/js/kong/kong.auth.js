window.Kong = window.Kong || {}
window.Kong.Auth = window.Kong.Auth || {}


window.Kong.Auth.REDIRECT_ALIASES = {
  'index': '',
  'homepage': '',
  'home': ''
}


window.Kong.Auth.LOGIN_ENDPOINT = 'auth'
window.Kong.Auth.REGISTER_ENDPOINT = 'register'


window.Kong.Auth.BASIC_AUTH = {
  NAME: "basic-auth",
  FIELDS: ['email', 'password'],
  getHeaders: function(fields) {
    return {
      "Authorization": "Basic " + btoa(fields.email + ":" + fields.password)
    }
  }
}

window.Kong.Auth.KEY_AUTH = {
  NAME: "key-auth",
  FIELDS: ['email', 'key'],
  getHeaders: function(fields) {
    return {
      "apikey": fields.key
    }
  }
}

window.Kong.Auth.OIDC = {
  NAME: "openid-connect",
  FIELDS: ['email'],
  getHeaders: function() {
    return {};
  }
}

window.Kong.Auth.getRedirectTo = function (redirectTo) {
  return window.Kong.Auth.REDIRECT_ALIASES[redirectTo] || redirectTo || ''
}


window.Kong.Auth.loginWithOpenIdConnect = function(options) {
  document.cookie = 'redirect=' + options.redirectTo + ';path=/;max-age=' + (5 * 60);
  window.location.href = [options.baseUrl, window.Kong.Auth.LOGIN_ENDPOINT].join('/');
  return;
}


window.Kong.Auth.login = function(options) {
  var type = options.type
  var fields = window.Kong.Utils.serializeFieldsArrayToObject(options.fields)

  return new Promise((res, rej) => {
    $.ajax({
      type: 'GET',
      dataType: 'text',
      url: [options.baseUrl, window.Kong.Auth.LOGIN_ENDPOINT].join('/'),
      headers: type.getHeaders(fields),
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },

      success: function(data) {
        return res(data);
      },

      error: function(xhr, ajaxOptions, throwError) {
        if (xhr.responseText && xhr.responseText != "OK") {
          try {
            xhr.responseJSON = JSON.parse(xhr.responseText)
          } catch (e) {}
        }

        rej({
          message: xhr.responseJSON ? xhr.responseJSON.message : null,
          xhr: xhr,
          ajaxOptions: ajaxOptions,
          throwError: throwError
        });
      }
    });
  })
}


window.Kong.Auth.logout = function(options) {
  var baseUrl = [options.baseUrl, window.Kong.Auth.LOGIN_ENDPOINT].join('/')

  if (options.type === 'openid-connect') {
    window.location = baseUrl + '?logout=true'
    return
  }

  return new Promise((res, rej) => {
    $.ajax({
      type: 'DELETE',
      url: baseUrl + '?session_logout=true',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },

      success: function(data) {
        return res(data);
      },

      error: function(xhr, ajaxOptions, throwError) {
        // when response is empty, Jquery throws error
        if (xhr.responseText === "") {
          return res({});
        }

        rej({
          message: xhr.responseJSON ? xhr.responseJSON.message : null,
          xhr: xhr,
          ajaxOptions: ajaxOptions,
          throwError: throwError
        });
      }
    });
  })
}


window.Kong.Auth.register = function(options) {
  var type = options.type
  var fields = { meta: {} }

  for (var i = 0; i < options.fields.length; i++) {
    var field = options.fields[i];

    if (type.FIELDS.indexOf(field.name) < 0) {
      fields.meta[field.name] = field.value;
    } else {
      fields[field.name] = field.value
    }
  }

  fields.meta = JSON.stringify(fields.meta)

  return new Promise((res, rej) => {
    $.ajax({
      type: 'POST',
      url: [options.baseUrl, window.Kong.Auth.REGISTER_ENDPOINT].join('/'),
      data: fields,

      success: function(data) {
        return res(data);
      },

      error: function(xhr, ajaxOptions, throwError) {
        rej({
          message: xhr.responseJSON ? xhr.responseJSON.message : null,
          xhr: xhr,
          ajaxOptions: ajaxOptions,
          throwError: throwError
        });
      }
    });
  })
}
