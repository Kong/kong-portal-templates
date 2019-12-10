window.Kong = window.Kong || {}
window.Kong.SpecRenderer = window.Kong.SpecRenderer || {}

window.Kong.SpecRenderer.getSpec = function(url) {
  return new Promise((res, rej) => {
    $.ajax({
      type: 'GET',
      dataType: 'text',
      url: url,
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
