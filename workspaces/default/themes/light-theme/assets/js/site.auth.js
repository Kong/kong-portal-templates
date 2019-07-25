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
  FIELDS: ['email', 'password'],
  getHeaders: function(fields) {
    return {
      "Authorization": "Basic " + btoa(fields.email + ":" + fields.password)
    }
  }
}

Kong.Auth.KEY_AUTH = {
  FIELDS: ['email', 'key'],
  getHeaders: function(fields) {
    return {
      "apikey": fields.key
    }
  }
}

Kong.Auth.OIDC = {
  FIELDS: ['email'],
  getHeaders: function() {
    return {};
  }
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
        if (xhr.responseText != "OK") {
          xhr.responseJSON = JSON.parse(xhr.responseText)
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


Kong.Auth.getRedirectTo = function (redirectTo) {
  var queryValue = Kong.Utils.getParameterByName('redirectTo')

  // Query value or default value
  redirectTo = queryValue != null ? queryValue : redirectTo

  // Is it a redirect alias?
  redirectTo = Kong.Auth.REDIRECT_ALIASES[redirectTo] || redirectTo

  return redirectTo
}
