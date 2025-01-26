// Detect the user's default browser language
const userLanguage = navigator.language || navigator.userLanguage;

// Get the current URL path
const currentPath = window.location.pathname;

// Check if the language is Czech (cs) and if the user is not already on the Czech version
if (userLanguage.startsWith('cs') && !currentPath.includes('/cs/')) {
  // Redirect to the Czech version of the website
  window.location.href = '/cs/index.html';
} else if (!userLanguage.startsWith('cs') && !currentPath.includes('index.html')) {
  // Redirect to the default version of the website
  window.location.href = 'index.html';
}
