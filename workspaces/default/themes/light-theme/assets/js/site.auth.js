Kong = Kong || {}
Kong.Auth = Kong.Auth || {}


Kong.Auth.REDIRECT_ALIASES = {
  'index': '',
  'homepage': '',
  'home': ''
}


Kong.Auth.LOGIN_ENDPOINT = 'auth'
Kong.Auth.REGISTER_ENDPOINT = 'register'


Kong.Auth.BASIC_AUTH = {
  NAME: "basic-auth",
  FIELDS: ['email', 'password'],
  getHeaders: function(fields) {
    return {
      "Authorization": "Basic " + btoa(fields.email + ":" + fields.password)
    }
  }
}

Kong.Auth.KEY_AUTH = {
  NAME: "key-auth",
  FIELDS: ['email', 'key'],
  getHeaders: function(fields) {
    return {
      "apikey": fields.key
    }
  }
}

Kong.Auth.OIDC = {
  NAME: "openid-connect",
  FIELDS: ['email'],
  getHeaders: function() {
    return {};
  }
}

Kong.Auth.getRedirectTo = function (redirectTo) {
  var queryValue = Kong.Utils.getParameterByName('redirectTo')

  // Query value or default value
  redirectTo = queryValue != null ? queryValue : redirectTo

  // Is it a redirect alias?
  redirectTo = Kong.Auth.REDIRECT_ALIASES[redirectTo] || redirectTo

  return redirectTo
}


Kong.Auth.loginWithOpenIdConnect = function(options) {
  document.cookie = 'redirect=' + options.redirectTo + ';path=/;max-age=' + (5 * 60);
  window.location.href = [options.baseUrl, Kong.Auth.LOGIN_ENDPOINT].join('/');
  return;
}


Kong.Auth.login = function(options) {
  var type = options.type
  var fields = Kong.Utils.serializeFieldsArrayToObject(options.fields)

  return new Promise((res, rej) => {
    $.ajax({
      type: 'GET',
      dataType: 'text',
      url: [options.baseUrl, Kong.Auth.LOGIN_ENDPOINT].join('/'),
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


Kong.Auth.logout = function(options) {
  var baseUrl = [options.baseUrl, Kong.Auth.LOGIN_ENDPOINT].join('/')

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


Kong.Auth.register = function(options) {
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
      url: [options.baseUrl, Kong.Auth.REGISTER_ENDPOINT].join('/'),
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
