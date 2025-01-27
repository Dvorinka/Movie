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
  });

  if (error) {
    console.error('Login Error:', error.message);
    alert('Login failed. Please check your credentials.');
  } else if (data.user) {
    console.log('User logged in:', data.user);
    alert('Login successful!');
    
    // Fetch user profile after login
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError.message);
    } else {
      console.log('User profile fetched:', profileData);
    }

    window.location.href = '/index.html'; // Redirect to another page
  }
}

// Login with an OAuth provider
async function loginWithProvider(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + '/auth/callback', // Ensure this matches your redirect URL
    },
  });

  if (error) {
    console.error(`${provider} Login Error:`, error.message);
  } else {
    console.log(`${provider} Login initiated. Redirecting...`);
  }
}

// Function to handle redirect after login (for OAuth)
const handleRedirectAfterLogin = async () => {
  const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

  if (error) {
    console.error('Error handling redirect:', error.message);
    alert('There was an issue logging you in. Please try again.');
    return;
  }

  if (data.session) {
    console.log('OAuth Login Successful:', data.session.user);
    alert('Login successful!');

    // Fetch user profile after login
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError.message);
    } else {
      console.log('User profile fetched:', profileData);
    }

    window.location.href = '/index.html'; // Redirect to the desired page after login
  } else {
    console.warn('No session found after redirect. Ensure the provider setup is correct.');
  }
};

// Register with email, username, and password
// Register with email, username, and password
async function registerWithEmail() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!email || !password || !username) {
    alert('Please fill in all required fields.');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Registration Error:', error.message);
    alert('Registration failed. Please try again.');
  } else if (data.user) {
    console.log('User registered:', data.user);

    // Insert into user_profiles table, using the logged-in user's ID
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id, // Make sure user_id is the logged-in user's ID
        nickname: username, // Storing the username as nickname in user_profiles
        favourite_media_type: 'movie', // Default value, can be updated later
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      alert('Profile creation failed. Please contact support.');
    } else {
      console.log('User profile created successfully');
      alert('Registration successful! Check your email for confirmation.');
      window.location.href = '/index.html'; // Redirect after registration
    }
  }
}


// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log('User logged in:', session.user);
  } else {
    console.log('User logged out.');
  }
});

// Event listeners for login and register buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginButton').addEventListener('click', loginWithEmailOrUsername);

  document.getElementById('githubLoginBtn').addEventListener('click', () => loginWithProvider('github'));
  document.getElementById('discordLoginBtn').addEventListener('click', () => loginWithProvider('discord'));
  document.getElementById('twitchLoginBtn').addEventListener('click', () => loginWithProvider('twitch'));

  document.getElementById('registerButton').addEventListener('click', registerWithEmail);
});
