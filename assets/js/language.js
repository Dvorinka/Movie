
  // Function to get the value of a cookie by name
  function getCookie(name) {
    const matches = document.cookie.match(new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()[]+\^])/g, '\\$1') + '=([^;]*)'
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  // Function to set a cookie
  function setCookie(name, value, options = {}) {
    options = {
      path: '/',
      'max-age': 60 * 60 * 24 * 365, // 1 year
      ...options
    };

    if (options.expires instanceof Date) {
      options['max-age'] = (options.expires - new Date()) / 1000;
    }

    let updatedCookie = name + '=' + encodeURIComponent(value);

    for (const optionKey in options) {
      updatedCookie += '; ' + optionKey;
      const optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += '=' + optionValue;
      }
    }

    document.cookie = updatedCookie;
  }

  // Detect user's default browser language
  const userLanguage = navigator.language || navigator.userLanguage;

  // Check if the language cookie is set
  const languagePreference = getCookie('language');

  // If the cookie is set, use it, otherwise check browser language
  if (!languagePreference) {
    // Check if the language is Czech (cs)
    if (userLanguage.startsWith('cs')) {
      // Set cookie for Czech language preference
      setCookie('language', 'cs', { 'max-age': 60 * 60 * 24 * 365 });
      // Redirect to the Czech version of the website
      window.location.href = 'https://spark.tdvorak.dev/cs/';
    } else {
      // Set cookie for default language preference
      setCookie('language', 'en', { 'max-age': 60 * 60 * 24 * 365 });
      // Redirect to the default version of the website
      window.location.href = 'https://spark.tdvorak.dev/';
    }
  } else {
    // If the cookie is already set, check for language preference and redirect
    if (languagePreference === 'cs') {
      window.location.href = 'https://spark.tdvorak.dev/cs/';
    } else {
      window.location.href = 'https://spark.tdvorak.dev/';
    }
  }