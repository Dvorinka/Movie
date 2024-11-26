// Initialize Supabase client
const supabase = window.supabase.createClient(
  'https://cbnwekzbcxbmeevdjgoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
);

// Login with OAuth provider
async function loginWithProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) {
    console.error(`${provider} Login Error:`, error.message);
  } else {
    console.log(`${provider} Login initiated.`);
  }
}

// Function to handle redirect after login
const handleRedirectAfterLogin = () => {
  // Get the URL hash fragment
  const hash = window.location.hash;

  if (hash) {
    const params = new URLSearchParams(hash.substring(1)); // Remove '#' and parse
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    // Store tokens for future use
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    // Optionally, clear the hash from the URL to remove sensitive data
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Redirect the user to a different page (for example, dashboard or home)
  window.location.href = '/index.html'; // Adjust this to your desired page after login
};

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log('User logged in:', session.user);
    handleRedirectAfterLogin(); // Handle redirect after login
  } else {
    console.log('User logged out.');
  }
});

// Handle login button clicks for GitHub, Discord, and Twitch
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('githubLoginBtn').addEventListener('click', () => loginWithProvider('github'));
  document.getElementById('discordLoginBtn').addEventListener('click', () => loginWithProvider('discord'));
  document.getElementById('twitchLoginBtn').addEventListener('click', () => loginWithProvider('twitch'));
});
