// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
  );
  
  // Function for resetting password
  async function resetPassword() {
    const email = document.getElementById('loginInput').value;
  
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: '/reset-success.html' // Adjust the redirect URL
    });
  
    if (error) {
      console.error('Password Reset Error:', error.message);
      alert('Password reset failed. Please try again.');
    } else {
      alert('Password reset link has been sent to your email.');
    }
  }
  
  // Function for login using magic link
  async function loginWithMagicLink() {
    const email = document.getElementById('loginInput').value;
  
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
  
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: '/magic-login-success.html' } // Adjust the redirect URL
    });
  
    if (error) {
      console.error('Magic Link Login Error:', error.message);
      alert('Magic link login failed. Please try again.');
    } else {
      alert('Magic login link has been sent to your email.');
    }
  }
  
  // Event listeners for buttons
  document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('loginButton');
    const magicLinkButton = document.querySelectorAll('#loginButton')[1];
  
    resetButton.addEventListener('click', resetPassword);
    magicLinkButton.addEventListener('click', loginWithMagicLink);
  });
  