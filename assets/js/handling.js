document.addEventListener('DOMContentLoaded', () => {
  // Initialize Supabase client
  const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
  );

  const moviesList = document.querySelector('.movies-list');
  
  // Function to fetch watched movies for the current user
  const fetchWatchedMovies = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return [];

      const { data: watchedMovies, error: fetchError } = await supabase
        .from('watched_movies')
        .select('movie_id')
        .eq('user_id', session.user.id);

      if (fetchError) {
        console.error('Error fetching watched movies:', fetchError);
        return [];
      }

      return watchedMovies.map(movie => movie.movie_id.toString());
    } catch (err) {
      console.error('Error in fetchWatchedMovies:', err);
      return [];
    }
  };

  // Function to fetch watch later movies for the current user
  const fetchWatchLaterMovies = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return [];

      const { data: watchLaterMovies, error: fetchError } = await supabase
        .from('watch_later_movies')
        .select('movie_id')
        .eq('user_id', session.user.id);

      if (fetchError) {
        console.error('Error fetching watch later movies:', fetchError);
        return [];
      }

      return watchLaterMovies.map(movie => movie.movie_id.toString());
    } catch (err) {
      console.error('Error in fetchWatchLaterMovies:', err);
      return [];
    }
  };

  // Function to apply watched style to a media item
  const applyWatchedStyle = (mediaItem) => {
    const image = mediaItem.querySelector('img');
    if (image) {
      image.style.filter = 'grayscale(1)';
      let watchedLabel = mediaItem.querySelector('.watched-label');
      if (!watchedLabel) {
        watchedLabel = document.createElement('div');
        watchedLabel.textContent = 'Watched';
        watchedLabel.classList.add('watched-label');
        mediaItem.appendChild(watchedLabel);
      }
    }
  };

  // Function to apply watch later style to a media item
  const applyWatchLaterStyle = (mediaItem) => {
    let watchLaterLabel = mediaItem.querySelector('.watch-later-label');
    if (!watchLaterLabel) {
      watchLaterLabel = document.createElement('div');
      watchLaterLabel.textContent = 'Planned';
      watchLaterLabel.classList.add('watch-later-label');
      mediaItem.appendChild(watchLaterLabel);
    }
  };

  // Function to update media status for all items
  const updateMediaStatus = async () => {
    const movieCards = document.querySelectorAll('.movie-card');
    if (movieCards.length === 0) return;

    try {
      const [watchedIds, watchLaterIds] = await Promise.all([
        fetchWatchedMovies(),
        fetchWatchLaterMovies()
      ]);

      movieCards.forEach(card => {
        const movieId = card.getAttribute('data-id');
        if (watchedIds.includes(movieId)) {
          applyWatchedStyle(card);
        }
        if (watchLaterIds.includes(movieId)) {
          applyWatchLaterStyle(card);
        }
      });
    } catch (err) {
      console.error('Error updating media status:', err);
    }
  };

  const fetchUpcoming = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();

      // Get the current year and the next year dynamically
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      // Filter movies based on the release date for this year and next year
      const filteredMovies = data.results.filter(movie => {
        const releaseDate = new Date(movie.release_date);
        return releaseDate >= new Date(`${currentYear}-01-01`) && releaseDate <= new Date(`${nextYear}-12-31`);
      });

      // Slice to get the first 8 movies after filtering
      const items = filteredMovies.slice(0, 8);

      // Fetch additional details for the filtered movies
      const detailedMovies = await fetchMovieDetails(items);
      displayItems(detailedMovies);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchMovieDetails = async (movies) => {
    const detailedMovies = await Promise.all(movies.map(async movie => {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=release_dates`);
      const detailedMovie = await response.json();
      
      // Get the upcoming release date for the specific country (e.g., US)
      detailedMovie.usReleaseDate = getUpcomingReleaseDate(detailedMovie, 'US');
      
      detailedMovie.certification = getCertification(detailedMovie);
      return detailedMovie;
    }));
    return detailedMovies;
  };

  const getUpcomingReleaseDate = (movie, countryCode) => {
    const countryRelease = movie.release_dates.results.find(country => country.iso_3166_1 === countryCode);
    if (countryRelease && countryRelease.release_dates.length > 0) {
      // Get the latest upcoming date for this country
      const futureDates = countryRelease.release_dates
        .map(date => new Date(date.release_date))
        .filter(date => date >= new Date());  // Filter only future dates

      if (futureDates.length > 0) {
        // Return the nearest upcoming date
        return futureDates.sort((a, b) => a - b)[0];
      }
    }
    return null;
  };

  const getCertification = (movie) => {
    const userLanguage = navigator.language.split('-')[0]; // Get the language code (e.g., 'en' or 'cs')

    if (movie.release_dates && movie.release_dates.results) {
      let certification = 'NR'; // Default to 'NR' if no certification is found

      // Determine which certification to use based on the user's preferred language
      let releaseInfo;
      if (userLanguage === 'cs') {
        // Czech language, use certification data for Czech Republic ('CZ')
        releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'CZ');
      } else {
        // Default to English language, use certification data for United States ('US')
        releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'US');
      }

      if (releaseInfo && releaseInfo.release_dates && releaseInfo.release_dates.length > 0) {
        certification = releaseInfo.release_dates[0].certification;
      }

      if (certification) {
        // Map the certification codes to their respective ratings
        switch (certification) {
          case 'NR':
            return { rating: 'NR', hint: 'Not Rated' };
          case 'G':
            return { rating: 'G', hint: 'General Audiences. All ages admitted.' };
          case 'PG':
            return { rating: 'PG', hint: 'Parental Guidance Suggested. Some material may not be suitable for children.' };
          case 'PG-13':
            return { rating: 'PG-13', hint: 'Parents Strongly Cautioned. Some material may be inappropriate for children under 13.' };
          case 'R':
            return { rating: 'R', hint: 'Restricted. Under 17 requires accompanying parent or adult guardian.' };
          case 'NC-17':
            return { rating: 'NC-17', hint: 'No One 17 and Under Admitted.' };
          case 'U':
            return { rating: 'U', hint: 'Universal. Suitable for all ages.' }; // Map 'U' to 'G'
          default:
            return { rating: certification, hint: 'Rating Description Unavailable' };
        }
      }
    }
    return { rating: 'NR', hint: 'Not Rated' }; // Default to 'NR' if no certification is found
  };

  const displayItems = (items) => {
    moviesList.innerHTML = '';
    items.forEach(item => {
      // Use the US release date if available, otherwise fall back to the general release date
      const releaseDate = item.usReleaseDate ? formatDate(item.usReleaseDate) : formatDate(item.release_date);
      const title = item.title;
      const posterPath = item.poster_path ? `${imageBannerUrl}${item.poster_path}` : '../assets/images/placeholder_media.png';
      const runtime = formatRuntime(item.runtime);
      const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
      const certification = item.certification.rating;
      const certificationHint = item.certification.hint;

      const cardHTML = `
        <li>
          <div class="movie-card" data-id="${item.id}">
            <figure class="card-banner">
              <img src="${posterPath}" alt="${title}">
            </figure>
            <div class="title-wrapper">
              <h3 class="card-title">${title}</h3>
              <time datetime="${releaseDate}">${releaseDate}</time>
            </div>
            <div class="card-meta">
              <div class="badge badge-outline" title="${certificationHint}">${certification}</div>
              <div class="duration">
                <ion-icon name="time-outline"></ion-icon>
                <time>${runtime}</time>
              </div>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <data>${rating}</data>
              </div>
            </div>
          </div>
        </li>
      `;
      moviesList.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Add event listeners to movie cards
    const movieCards = document.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking on a status label
        if (e.target.classList.contains('watched-label') || e.target.classList.contains('watch-later-label')) {
          e.stopPropagation();
          return;
        }
        const movieId = card.getAttribute('data-id');
        window.location.href = `./movie-details.html?id=${movieId}`;
      });
    });
    
    // Update media status after loading movies
    updateMediaStatus();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A mins';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Load upcoming movies by default
  fetchUpcoming(upcomingMoviesUrl);
});
