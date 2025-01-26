  // Detect the user's default browser language
  const userLanguage = navigator.language || navigator.userLanguage;

  // Check if the language is Czech (cs)
  if (userLanguage.startsWith('cs')) {
    // Redirect to the Czech version of the website
    window.location.href = 'https://spark.tdvorak.dev/cs/';
  } else {
    // Redirect to the default version of the website
    window.location.href = 'https://spark.tdvorak.dev/';
  }