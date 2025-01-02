// Initialize Supabase client
const supabase = window.supabase.createClient(
  'https://cbnwekzbcxbmeevdjgoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
);

// Login with email or username and password
async function loginWithEmailOrUsername() {
  const emailOrUsername = document.getElementById('loginInput').value;
  const password = document.getElementById('passwordInput').value;

  if (!emailOrUsername || !password) {
    alert('Please enter both email/username and password.');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailOrUsername.includes('@') ? emailOrUsername : null,
    password: password,
    options: emailOrUsername.includes('@') ? {} : { username: emailOrUsername },
  });

  if (error) {
    console.error('Login Error:', error.message);
    alert('Login failed. Please check your credentials.');
  } else if (data.user) {
    console.log('User logged in:', data.user);
    alert('Login successful!');
    window.location.href = '/index.html'; // Redirect to another page
  }
}

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
  const hash = window.location.hash;

  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }

  window.location.href = '/index.html'; // Adjust this to your desired page
};

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log('User logged in:', session.user);
    handleRedirectAfterLogin();
  } else {
    console.log('User logged out.');
  }
});

// Event listeners for login buttons
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('githubLoginBtn').addEventListener('click', () => loginWithProvider('github'));
  document.getElementById('discordLoginBtn').addEventListener('click', () => loginWithProvider('discord'));
  document.getElementById('twitchLoginBtn').addEventListener('click', () => loginWithProvider('twitch'));
});
