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

/**
 * Get value of specified nested property of an object or object array.
 *
 * The `key` argument accepts dot characters (`.`) to deeply traverse input objects
 * and asterisk characters (`*`) to select all properties of currently selected object.
 * You can use the asterisk character at any point of the object tree.
 *
 * Example:
 *
 *   For given input object:
 *   ```
 *   {
 *     info: {
 *       title: "Hello, World!",
 *     },
 *     tags: {
 *       first: {
 *         name: "First tag",
 *       },
 *       second: {
 *         name: "Second tag",
 *       },
 *     },
 *   }
 *   ```
 *   `info.title` key will get the value of the `title` property in the `info` object, and
 *
 *   `tags.*.name` key will get the values of the `name` property in all object properties inside the `tags` object.
 *
 * @param {Object|Object[]} data - An object or array of objects to extract the values from
 * @param {string} key - Key to get the properties from given object(s)
 * @returns {string[]} Values of requested properties
 */
window.Kong.Utils.getNestedProperties = function (data, key) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  var tree = key.split(".");
  var currentKey = tree.shift();
  var newObjs;

  if (currentKey === "*") {
    // Find all keys of given object if current key is *
    newObjs = data.reduce(function (acc, obj) {
      Object.keys(obj).forEach(function (key) {
        acc.push(obj[key]);
      })
      return acc;
    }, []);
  } else {
    // Select the requested key from all input objects
    newObjs = data.map(function (obj) {
      return obj[currentKey];
    });
  }

  if (tree.length > 0) {
    // Recursively process nested objects
    return window.Kong.Utils.getNestedProperties(
      newObjs,
      tree.join("."),
    );
  }

  return newObjs;
}

/**
 * Get a numeric score of string similarity using n-grams
 * @param {string} a - first string to compare
 * @param {string} b - second string to compare
 * @param {number} [nGram = 3] - integer gram size (defaults to 3)
 * @returns {number} String similarity score from 0.0 to 1.0
 */
window.Kong.Utils.getStringSimilarity = function (a, b, nGram) {
  if (!nGram) {
    nGram = 3;
  }

  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  if (b.length > a.length) {
    var temp = a
    a = b
    b = temp
  }

  function getNGramPairs (str) {
    var padding = '';
    for (var i = 0; i < nGram - 1; i++) {
      padding += ' ';
    }

    str = padding + str.toLowerCase() + padding;

    var res = [];
    for (var i = 0; i < str.length - nGram + 1; i++) {
      var s = str.substring(i, i + nGram)
      if (res.indexOf(s) === -1) {
        res.push(s);
      }
    }

    return res;
  }

  var aPairs = getNGramPairs(a);
  var bPairs = getNGramPairs(b);

  var matches = bPairs.filter(function (pair) {
    return aPairs.indexOf(pair) !== -1;
  });

  return matches.length / bPairs.length;
}

/**
 * Search items within the input array similar to the given phrase.
 * Compare one or many item property values by specifying the `options.keys` property.
 *
 * @param {Object[]} items - array of input objects to search in
 * @param {string} phrase - phrase to search by
 * @param {Object} options - options object
 * @returns {Object[]} - filtered items array containing items matching given search criteria
 */
window.Kong.Utils.searchSimilar = function(items, phrase, options) {
  if (phrase.length === 0) {
    return items;
  }

  var threshold = options.threshold || 0.5;
  var keys = options.keys || [];

  // There's nothing to search by
  if (keys.length === 0) {
    return [];
  }

  // Get a score for given item.
  // The higher the return number the more relevant the item is
  function getItemSimilarity(item) {
    var score = 0;

    keys.forEach(function (keyConfig) {
      var key = keyConfig.key;
      if (!key) {
        throw new Error("'key' property is required in search keys config");
      }

      var weight = keyConfig.weight || 1;

      window.Kong.Utils.getNestedProperties(item, key).forEach(function (data) {
        // The final selected property value can either have a string-like type or array of string-like types
        if (!Array.isArray(data)) {
          data = [data];
        }

        // Calculate score for all array items and get *only* the highest one.
        // This is a "one of" search
        score += data
          .map(function (value) {
            return window.Kong.Utils.getStringSimilarity((value || "").toString(), phrase, options.nGram) * weight;
          })
          .sort(function(a, b) {
            if (a < b) return 1;
            if (b > a) return -1;
            return 0;
          })
          [0] || 0;
      });
    });

    return score;
  }

  return items
    .map(function (item) {
      item.score = getItemSimilarity(item);
      return item;
    })
    .filter(function (item) {
      return item.score >= threshold;
    })
    .sort(function (a, b) {
      if (a.score < b.score) return 1;
      if (a.score > b.score) return -1;
      return 0;
    });
}
