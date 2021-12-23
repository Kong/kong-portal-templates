window.Kong = window.Kong || {}
window.Kong.Utils = window.Kong.Utils || {}

const fallbackErrorMessage = "An unexpected error occurred. Please try again.";

// Taken from underscore.js | MIT
// Used for input keydown events
window.Kong.Utils.debounce = function (func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// Taken from StackOverflow | MIT
// Used for QueryString parsing (ES3+ supported)
// See login/register forms for usage
window.Kong.Utils.getParameterByName = function (name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

window.Kong.Utils.serializeFieldsArrayToObject = function (fieldsArray) {
  var output = {};

  for (var i = 0; i < fieldsArray.length; i++) {
    var field = fieldsArray[i];
    output[field.name] = field.value;
  }

  return output;
};

window.Kong.Utils.getErrorMessage = function (response) {

  if (typeof response.message === "string") {
    return response.message;
  }

  try {
    // we want errors to be unique
    let foundErrors = new Set();
    // Handle SMTP sending errors:
    for (const email in response.message.error.emails) {
      const errorMessage = response.message.error.emails[email];
      foundErrors.add(errorMessage);
    }
    return Array.from(foundErrors).join("\n");
  } catch (error) {
    return fallbackErrorMessage;
  }
};
