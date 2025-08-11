// Initialize Supabase client
const supabase = window.supabase.createClient(
  'https://cbnwekzbcxbmeevdjgoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
);

// DOM Elements
const profileForm = document.getElementById('profileForm');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const userProfilePicture = document.getElementById('userProfilePicture');
const profilePicture = document.getElementById('profilePicture');
const userDisplayName = document.getElementById('userDisplayName');
const userEmail = document.getElementById('userEmail');
const memberSince = document.getElementById('memberSince');
const logoutBtn = document.getElementById('logoutBtn');
const cancelChangesBtn = document.getElementById('cancelChanges');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const twoFactorBtn = document.getElementById('twoFactorBtn');
const connectedAccountsBtn = document.getElementById('connectedAccountsBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordChange = document.getElementById('cancelPasswordChange');
const changePasswordForm = document.getElementById('changePasswordForm');
const twoFactorModal = document.getElementById('twoFactorModal');
const close2FAModal = document.getElementById('close2FAModal');
const enable2FABtn = document.getElementById('enable2FABtn');
const disable2FABtn = document.getElementById('disable2FABtn');
const verify2FABtn = document.getElementById('verify2FABtn');
const cancel2FAVerification = document.getElementById('cancel2FAVerification');
const twoFactorSetup = document.getElementById('2faSetup');
const twoFactorVerification = document.getElementById('2faVerification');
const twoFactorInputs = document.querySelectorAll('.two-factor-input');
const twoFactorStatus = document.getElementById('2faStatus');
const twoFactorStatusMessage = document.getElementById('2faStatusMessage');

// User profile data
let userProfile = null;

// Track 2FA state
let twoFactorVerificationData = null;

// Load user statistics
async function loadUserStatistics() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return;

    // Fetch counts from all tables in parallel
    const [
      { count: moviesWatched },
      { count: tvWatched },
      { count: watchLaterMovies },
      { count: watchLaterTv },
      { count: userLists }
    ] = await Promise.all([
      supabase
        .from('watched_movies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      supabase
        .from('watched_tv')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      supabase
        .from('watch_later_movies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      supabase
        .from('watch_later_tv')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      supabase
        .from('user_lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ]);

    // Update the UI with the fetched counts
    const watchedMoviesEl = document.getElementById('watchedMoviesCount');
    const watchedTvEl = document.getElementById('watchedTvCount');
    const watchLaterEl = document.getElementById('watchLaterCount');
    const listCountEl = document.getElementById('listCount');
    
    if (watchedMoviesEl) watchedMoviesEl.textContent = moviesWatched || 0;
    if (watchedTvEl) watchedTvEl.textContent = tvWatched || 0;
    if (watchLaterEl) watchLaterEl.textContent = (watchLaterMovies || 0) + (watchLaterTv || 0);
    if (listCountEl) listCountEl.textContent = userLists || 0;

  } catch (error) {
    console.error('Error loading user statistics:', error);
    showNotification('Failed to load statistics. Please try again later.', 'error');
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadUserProfile();
  await loadUserStatistics();
  setupEventListeners();
  setupDarkModeToggle();
  setupModals();
});

// Check if user is authenticated
async function checkAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    window.location.href = '/login.html';
    return;
  }
  
  return user;
}

// Load user profile data
async function loadUserProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    // Set user basic info
    userEmail.textContent = user.email;
    userDisplayName.textContent = user.user_metadata?.full_name || 'User';
    
    // Format and set member since date
    if (user.created_at) {
      const joinDate = new Date(user.created_at);
      memberSince.textContent = joinDate.getFullYear();
    }
    
    // Load user profile from database first
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading profile:', profileError);
      return;
    }
    
    userProfile = profile || { user_id: user.id };
    
    // Generate or load profile picture
    const defaultAvatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}&radius=50&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d5d4dc`;
    let profilePicUrl = user.user_metadata?.avatar_url || 
                       (profile?.profile_picture || defaultAvatarUrl);
    
    // Update both profile pictures
    userProfilePicture.src = profilePicUrl;
    profilePicture.src = profilePicUrl;
    
    // If we don't have a profile picture in the user_profiles table, save it
    if (userProfile && !userProfile.profile_picture) {
      try {
        await saveProfile({
          profile_picture: profilePicUrl,
          nickname: user.user_metadata?.full_name || 'User',
          favourite_media_type: 'movie',
          language: 'en',
          country: 'US'
        });
        
        // Reload the profile after saving
        const { data: updatedProfile, error: reloadError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (!reloadError && updatedProfile) {
          userProfile = updatedProfile;
        }
      } catch (error) {
        console.error('Error saving profile picture:', error);
      }
    }
    
    // Populate form fields
    if (userProfile) {
      document.getElementById('nickname').value = userProfile.nickname || '';
      document.getElementById('favoriteGenre').value = userProfile.favourite_genre || '';
      document.getElementById('favoriteMediaType').value = userProfile.favourite_media_type || 'movie';
      document.getElementById('language').value = userProfile.language || 'en';
      document.getElementById('country').value = userProfile.country || 'US';
    }
    
    // Check 2FA status
    check2FAStatus();
    
  } catch (error) {
    console.error('Error loading user profile:', error);
    showNotification('Failed to load profile. Please try again.', 'error');
  }
}

// Save profile data
async function saveProfile(profileData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profileData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
    
    showNotification('Profile updated successfully!', 'success');
    return data;
    
  } catch (error) {
    console.error('Error saving profile:', error);
    showNotification('Failed to save profile. Please try again.', 'error');
    throw error;
  }
}

// Handle profile form submission
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const formData = {
    nickname: document.getElementById('nickname').value.trim(),
    favourite_genre: document.getElementById('favoriteGenre').value,
    favourite_media_type: document.getElementById('favoriteMediaType').value,
    language: document.getElementById('language').value,
    country: document.getElementById('country').value,
  };
  
  try {
    await saveProfile(formData);
    // Update displayed name if nickname was changed
    if (formData.nickname) {
      userDisplayName.textContent = formData.nickname;
    }
  } catch (error) {
    // Error is already handled in saveProfile
  }
}

// Change profile picture
async function handleChangeAvatar() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    // Generate a new identicon using DiceBear API v7
    const seed = `${user.id}-${Date.now()}`;
    const newAvatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d5d4dc&backgroundRotation=0,360`;
    
    // Update the avatar in the UI immediately
    userProfilePicture.src = newAvatarUrl;
    profilePicture.src = newAvatarUrl;
    
    // Save the avatar URL to the user's metadata and profile
    const updates = {
      data: { avatar_url: newAvatarUrl }
    };
    
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser(updates);
    if (authError) throw authError;
    
    // Also save to user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        profile_picture: newAvatarUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (profileError) throw profileError;
    
    showNotification('Profile picture updated!', 'success');
    
  } catch (error) {
    console.error('Error updating profile picture:', error);
    showNotification('Failed to update profile picture. ' + (error.message || ''), 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Profile form submission
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }
  
  // Change avatar button
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', handleChangeAvatar);
  }
  
  // Cancel changes button
  if (cancelChangesBtn) {
    cancelChangesBtn.addEventListener('click', () => {
      // Reload the form to discard changes
      loadUserProfile();
    });
  }
  
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/login.html';
    });
  }
  
  // Change password button
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      toggleModal(changePasswordModal, true);
    });
  }
  
  // Two-factor authentication button
  if (twoFactorBtn) {
    twoFactorBtn.addEventListener('click', () => {
      toggleModal(twoFactorModal, true);
    });
  }
  
  // Connected accounts button
  if (connectedAccountsBtn) {
    connectedAccountsBtn.addEventListener('click', () => {
      alert('Connected accounts management would be implemented here.');
    });
  }
}

// Toggle modal visibility
function toggleModal(modal, show = null) {
  if (show === null) {
    modal.classList.toggle('active');
  } else if (show) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
  
  // Reset form when closing password modal
  if (modal === changePasswordModal && !modal.classList.contains('active')) {
    if (changePasswordForm) changePasswordForm.reset();
  }
}

// Setup modals
function setupModals() {
  // Close password modal
  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', () => {
      toggleModal(changePasswordModal, false);
    });
  }
  
  // Cancel password change
  if (cancelPasswordChange) {
    cancelPasswordChange.addEventListener('click', () => {
      toggleModal(changePasswordModal, false);
    });
  }
  
  // Change password form submission
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handlePasswordChange);
  }
  
  // Close 2FA modal
  if (close2FAModal) {
    close2FAModal.addEventListener('click', () => {
      toggleModal(twoFactorModal, false);
    });
  }
  
  // Enable 2FA button
  if (enable2FABtn) {
    enable2FABtn.addEventListener('click', start2FASetup);
  }
  
  // Disable 2FA button
  if (disable2FABtn) {
    disable2FABtn.addEventListener('click', disable2FA);
  }
  
  // Verify 2FA code button
  if (verify2FABtn) {
    verify2FABtn.addEventListener('click', verify2FACode);
  }
  
  // Cancel 2FA verification
  if (cancel2FAVerification) {
    cancel2FAVerification.addEventListener('click', () => {
      reset2FAVerification();
      toggleModal(twoFactorModal, false);
    });
  }
  
  // 2FA input handling
  twoFactorInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => handle2FAInput(e, index));
    input.addEventListener('keydown', (e) => handle2FAKeyDown(e, index));
  });
  
  // 2FA paste handling
  twoFactorInputs.forEach((input) => {
    input.addEventListener('paste', handle2FAPaste);
  });
}

// Setup dark mode toggle
function setupDarkModeToggle() {
  const darkModeToggle = document.getElementById('darkMode');
  
  // Check for saved user preference, if any
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (darkModeToggle) darkModeToggle.checked = true;
  }
  
  // Listen for toggle changes
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });
  }
}

// Handle password change
async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords
  if (newPassword !== confirmPassword) {
    showNotification('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('Password must be at least 6 characters long', 'error');
    return;
  }
  
  try {
    // Update password using Supabase
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    showNotification('Password updated successfully!', 'success');
    toggleModal(changePasswordModal, false);
    changePasswordForm.reset();
    
  } catch (error) {
    console.error('Error updating password:', error);
    showNotification(error.message || 'Failed to update password', 'error');
  }
}

// 2FA Functions
async function check2FAStatus() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    
    const totpFactor = factors.totp[0];
    const is2FAEnabled = totpFactor?.status === 'verified';
    
    // Update UI
    if (is2FAEnabled) {
      twoFactorStatus.textContent = 'Enabled';
      twoFactorStatus.classList.add('enabled');
      if (enable2FABtn) enable2FABtn.style.display = 'none';
      if (disable2FABtn) disable2FABtn.style.display = 'block';
    } else {
      twoFactorStatus.textContent = 'Disabled';
      twoFactorStatus.classList.remove('enabled');
      if (enable2FABtn) enable2FABtn.style.display = 'block';
      if (disable2FABtn) disable2FABtn.style.display = 'none';
    }
    
    return is2FAEnabled;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    showNotification('Failed to check 2FA status', 'error');
    return false;
  }
}

async function start2FASetup() {
  try {
    show2FAStatusMessage('Setting up 2FA...', 'info');
    
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'SparkScreen',
      friendlyName: 'SparkScreen Account'
    });
    
    if (error) throw error;
    
    // Store the factor ID for verification
    twoFactorVerificationData = {
      factorId: data.id,
      secret: data.secret,
      qrCode: data.totp.qr_code
    };
    
    // Show the verification step
    twoFactorSetup.style.display = 'none';
    twoFactorVerification.style.display = 'block';
    
    // Focus the first input
    twoFactorInputs[0]?.focus();
    
  } catch (error) {
    console.error('Error starting 2FA setup:', error);
    show2FAStatusMessage(error.message || 'Failed to start 2FA setup', 'error');
  }
}

async function verify2FACode() {
  try {
    if (!twoFactorVerificationData) {
      throw new Error('2FA setup not started');
    }
    
    // Get the 6-digit code from inputs
    let code = '';
    twoFactorInputs.forEach(input => {
      code += input.value.trim();
    });
    
    if (code.length !== 6) {
      show2FAStatusMessage('Please enter a valid 6-digit code', 'error');
      return;
    }
    
    // Verify the code
    const { error } = await supabase.auth.mfa.verify({
      factorId: twoFactorVerificationData.factorId,
      code,
      challengeId: twoFactorVerificationData.challengeId
    });
    
    if (error) throw error;
    
    // 2FA enabled successfully
    show2FAStatusMessage('Two-factor authentication has been enabled successfully!', 'success');
    
    // Update UI
    twoFactorStatus.textContent = 'Enabled';
    twoFactorStatus.classList.add('enabled');
    enable2FABtn.style.display = 'none';
    disable2FABtn.style.display = 'block';
    
    // Reset and close after a delay
    setTimeout(() => {
      reset2FAVerification();
      toggleModal(twoFactorModal, false);
    }, 2000);
    
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    show2FAStatusMessage(error.message || 'Invalid verification code', 'error');
  }
}

async function disable2FA() {
  if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
    return;
  }
  
  try {
    show2FAStatusMessage('Disabling 2FA...', 'info');
    
    // Get all factors and unenroll them
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    
    // Unenroll all TOTP factors
    for (const factor of factors.totp) {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });
      
      if (error) throw error;
    }
    
    // Update UI
    twoFactorStatus.textContent = 'Disabled';
    twoFactorStatus.classList.remove('enabled');
    enable2FABtn.style.display = 'block';
    disable2FABtn.style.display = 'none';
    
    show2FAStatusMessage('Two-factor authentication has been disabled.', 'success');
    
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    show2FAStatusMessage(error.message || 'Failed to disable 2FA', 'error');
  }
}

function reset2FAVerification() {
  // Clear inputs
  twoFactorInputs.forEach(input => {
    input.value = '';
  });
  
  // Reset state
  twoFactorVerificationData = null;
  
  // Reset UI
  twoFactorSetup.style.display = 'block';
  twoFactorVerification.style.display = 'none';
  twoFactorStatusMessage.textContent = '';
  twoFactorStatusMessage.className = 'alert';
}

function show2FAStatusMessage(message, type = 'info') {
  twoFactorStatusMessage.textContent = message;
  twoFactorStatusMessage.className = `alert ${type}`;
}

// 2FA Input Handling
function handle2FAInput(e, index) {
  const input = e.target;
  const value = input.value;
  
  // Move to next input if a digit was entered
  if (value && index < twoFactorInputs.length - 1) {
    twoFactorInputs[index + 1].focus();
  }
  
  // Auto-submit if all digits are filled
  if (index === twoFactorInputs.length - 1 && value) {
    verify2FACode();
  }
}

function handle2FAKeyDown(e, index) {
  // Handle backspace to move to previous input
  if (e.key === 'Backspace' && !e.target.value && index > 0) {
    twoFactorInputs[index - 1].focus();
  }
}

function handle2FAPaste(e) {
  e.preventDefault();
  const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
  
  // Fill inputs with pasted data
  for (let i = 0; i < Math.min(pasteData.length, twoFactorInputs.length); i++) {
    twoFactorInputs[i].value = pasteData[i];
  }
  
  // Focus the last input with data
  const lastFilledIndex = Math.min(pasteData.length - 1, twoFactorInputs.length - 1);
  twoFactorInputs[lastFilledIndex].focus();
  
  // Auto-submit if we have enough digits
  if (pasteData.length >= 6) {
    verify2FACode();
  }
}

// Show notification to user
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  const notificationsContainer = document.getElementById('notifications') || document.body;
  notificationsContainer.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
      
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }, 100);
}

// Add some basic styles for notifications
const style = document.createElement('style');
style.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .notification.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .notification.success {
    background-color: #4caf50;
  }
  
  .notification.error {
    background-color: #f44336;
  }
  
  .notification.info {
    background-color: #2196f3;
  }
`;

document.head.appendChild(style);