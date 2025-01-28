document.addEventListener('DOMContentLoaded', () => {
  // Language selector functionality
  const languageSelector = document.getElementById('language');

  if (languageSelector) {
    // Detect the user's default language preference
    const savedLanguage = localStorage.getItem('language');
    const browserLanguage = navigator.language || navigator.userLanguage;
    const defaultLanguage = savedLanguage || (browserLanguage.startsWith('cs') ? 'cs' : 'en');

    // Set the selector to the current language
    languageSelector.value = defaultLanguage;

    // Handle user language change
    languageSelector.addEventListener('change', (event) => {
      const selectedLanguage = event.target.value;

      // Save the new preference
      localStorage.setItem('language', selectedLanguage);

      // Redirect to the selected language page
      if (selectedLanguage === 'cs') {
        window.location.href = '/cs/index.html';
      } else {
        window.location.href = '/index.html';
      }
    });
  } else {
    console.error('Language selector not found.');
  }
});
