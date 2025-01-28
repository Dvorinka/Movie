// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
  );
  
  // Display user account or login button based on auth state
  const displayAuthSection = async () => {
    console.log('Checking user session...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error.message);
        return;
      }
  
      console.log('Session data:', session);
  
      const loginButton = document.getElementById('loginButton');
      const userAccount = document.getElementById('userAccount');
  
      if (session?.user) {
        console.log('User is logged in. User data:', session.user);
        loginButton.style.display = 'none';
        userAccount.style.display = 'block';
      } else {
        console.warn('No active user session found.');
        loginButton.style.display = 'block';
        userAccount.style.display = 'none';
      }
    } catch (err) {
      console.error('Error in displayAuthSection:', err);
    }
  };
  
  // Logout functionality
  const setupLogout = () => {
    console.log('Setting up logout functionality...');
    const logoutButton = document.getElementById('logoutButton');
  
    if (!logoutButton) {
      console.error('Logout button not found.');
      return;
    }
  
    logoutButton.addEventListener('click', async () => {
      console.log('Logout button clicked.');
      try {
        const { error } = await supabase.auth.signOut();
  
        if (error) {
          console.error('Logout error:', error.message);
          alert('Logout failed. Please try again.');
        } else {
          console.log('User logged out successfully.');
          alert('Logged out successfully!');
          window.location.reload();
        }
      } catch (err) {
        console.error('Error during logout:', err);
      }
    });
  };
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded. Initializing authentication logic...');
    displayAuthSection();
    setupLogout();
  });
  