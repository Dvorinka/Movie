    // Wait for the DOM to fully load before executing the script
document.addEventListener('DOMContentLoaded', () => {

  // Initialize Supabase client
  const supabase = window.supabase.createClient(
      'https://cbnwekzbcxbmeevdjgoq.supabase.co',  // Replace with your Supabase URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase public API key
  );

  // Update loading progress - only if elements exist
  const updateLoadingProgress = (current, total) => {
    try {
      const progressElement = document.getElementById('loading-progress');
      const countElement = document.getElementById('loading-count');
      if (progressElement && countElement) {
        progressElement.textContent = `Loading ${Math.round((current / total) * 100)}%`;
        countElement.textContent = `${current}/${total} movies loaded`;
      }
    } catch (e) {
      console.log('Loading indicators not available in this context');
    }
  };

  // Function to apply styles to the discover page
  const applyWatchedStylesToDiscoverPage = async () => {
    if (!supabase || !supabase.auth) {
      console.error('Supabase client is not initialized.');
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error('Error getting session:', error);
        return;
      }

      const movieBanners = document.querySelectorAll('.media-item');
      
      // Only try to update loading indicators if we're on watched page
      if (document.getElementById('movies-container')) {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingCount = document.getElementById('loading-count');
        if (loadingProgress && loadingCount) {
          loadingProgress.textContent = 'Checking watched status...';
          loadingCount.textContent = `0/${movieBanners.length} movies checked`;
        }
      }

      // Loop through all the movie banners on the discover page
      for (let i = 0; i < movieBanners.length; i++) {
        const banner = movieBanners[i];
        const movieId = banner.getAttribute('data-movie-id'); // Assuming you have a data-movie-id attribute on each banner

        if (!movieId) {
          console.warn('Movie ID not found in banner.');
          continue;
        }

        // Check if this movie is already marked as watched
        const { data: existing, error: fetchError } = await supabase
          .from('watched_movies')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('movie_id', movieId);

        if (fetchError) {
          console.error('Error checking watched status:', fetchError);
          return;
        }

        if (existing.length > 0) {
          // Apply the grayscale effect and add the "Watched" label
          const movieImage = banner.querySelector('img'); // Assuming there's an <img> inside the banner
          if (movieImage) {
            movieImage.style.filter = 'grayscale(1)';
          }

          // Add the "Watched" label if it doesn't already exist
          let watchedLabel = banner.querySelector('.watched-label');
          if (!watchedLabel) {
            watchedLabel = document.createElement('div');
            watchedLabel.textContent = 'Watched';
            watchedLabel.classList.add('watched-label');
            banner.appendChild(watchedLabel);
          }
        }

        // Update loading progress
        updateLoadingProgress(i + 1, movieBanners.length);
      }
    } catch (err) {
      console.error('Error in applyWatchedStylesToDiscoverPage:', err);
    }
  };

  // Call the function to apply the watched styles
  applyWatchedStylesToDiscoverPage();
});