// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
  );
  
  // GitHub login function
  async function loginWithGitHub() {
    const { user, session, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
  
    if (error) {
      console.error('GitHub Login Error:', error.message);
    } else {
      console.log('GitHub Login Success:', user);
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
  
  // Event listener for GitHub login button
  document.getElementById('githubLoginBtn').addEventListener('click', function(e) {
    e.preventDefault();
    loginWithGitHub();
  });
  
  // Check session status
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      console.log('User session:', session);
    } else {
      console.log('User logged out');
    }
  });
  