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

// Logout function
async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout Error:', error.message);
  } else {
    console.log('User logged out');
  }
}

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('githubLoginBtn').addEventListener('click', () => loginWithProvider('github'));
  document.getElementById('discordLoginBtn').addEventListener('click', () => loginWithProvider('discord'));
  document.getElementById('twitchLoginBtn').addEventListener('click', () => loginWithProvider('twitch'));
});
