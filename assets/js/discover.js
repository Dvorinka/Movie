document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        'https://cbnwekzbcxbmeevdjgoq.supabase.co', // Replace with your Supabase URL
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase public API key
    );

    const apiKey = '054582e9ee66adcbe911e0008aa482a8';
    const omdbApiKey = '20e349a6'; // Replace with your OMDB API key
    const baseApiUrl = 'https://api.themoviedb.org/3';
    const getYtsListMoviesUrl = () => `${(window.getYtsBaseUrlSync ? window.getYtsBaseUrlSync() : 'https://yts.lt/api/v2')}/list_movies.json`;
    const omdbApiUrl = 'https://www.omdbapi.com/';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const mediaTypeSelect = document.getElementById('media-type');
    const mediaFilterSelect = document.getElementById('media-filter');
    const genreSpans = document.querySelectorAll('.genres span');
    const fetchedSorted = document.querySelector('.fetched-sorted');
    const releaseYearFromInput = document.getElementById('release-year-from');
    const releaseYearToInput = document.getElementById('release-year-to');
    const nativeSearchInput = document.getElementById('native-search-input');
    const nativeSearchBtn = document.getElementById('native-search-btn');
    let selectedGenre = '';
    let selectedFilter = 'popular';

    const genreMap = {
        '28': 'action',
        '12': 'adventure',
        '16': 'animation',
        '35': 'comedy',
        '80': 'crime',
        '99': 'documentary',
        '18': 'drama',
        '10751': 'family',
        '14': 'fantasy',
        '36': 'history',
        '27': 'horror',
        '10402': 'music',
        '9648': 'mystery',
        '10749': 'romance',
        '878': 'sci-fi',
        '53': 'thriller',
        '10752': 'war',
        '37': 'western'
    };

     // Function to fetch watched movies for the current user
    const fetchWatchedMovies = async () => {
        console.log('Fetching watched movies...');
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Error getting session:', error);
                return [];
            }

            console.log('Session found, fetching watched movies for user:', session.user.id);

            const { data: watchedMovies, error: fetchError } = await supabase
                .from('watched_movies')
                .select('movie_id')
                .eq('user_id', session.user.id);

            if (fetchError) {
                console.error('Error fetching watched movies:', fetchError);
                return [];
            }

            console.log('Watched movies fetched:', watchedMovies);
            return watchedMovies.map(movie => movie.movie_id);
        } catch (err) {
            console.error('Error in fetchWatchedMovies:', err);
            return [];
        }
    };

    // Function to fetch watched TV shows for the current user
    const fetchWatchedTvShows = async () => {
        console.log('Fetching watched TV shows...');
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Error getting session:', error);
                return [];
            }

            console.log('Session found, fetching watched TV shows for user:', session.user.id);

            const { data: watchedShows, error: fetchError } = await supabase
                .from('watched_tv')
                .select('tv_id')
                .eq('user_id', session.user.id);

            if (fetchError) {
                console.error('Error fetching watched TV shows:', fetchError);
                return [];
            }

            console.log('Watched TV shows fetched:', watchedShows);
            return watchedShows.map(show => show.tv_id);
        } catch (err) {
            console.error('Error in fetchWatchedTvShows:', err);
            return [];
        }
    };

    // Function to apply watched style to a media item (movie or TV show)
    const applyWatchedStyle = (mediaItem) => {
        console.log('Applying watched style to media item:', mediaItem.id);
        const image = mediaItem.querySelector('img');
        if (image) {
            image.style.filter = 'grayscale(1)';
            const watchedLabel = document.createElement('div');
            watchedLabel.textContent = 'Watched';
            watchedLabel.classList.add('watched-label');
            mediaItem.appendChild(watchedLabel);
        }
    };

     // Function to fetch watch later movies for the current user
     const fetchWatchLaterMovies = async () => {
        console.log('Fetching watch later movies...');
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Error getting session:', error);
                return [];
            }

            console.log('Session found, fetching watch later movies for user:', session.user.id);

            const { data: watchLaterMovies, error: fetchError } = await supabase
                .from('watch_later_movies')
                .select('movie_id')
                .eq('user_id', session.user.id);

            if (fetchError) {
                console.error('Error fetching watched movies:', fetchError);
                return [];
            }

            console.log('Watched movies fetched:', watchLaterMovies);
            return watchLaterMovies.map(movie => movie.movie_id);
        } catch (err) {
            console.error('Error in fetchwatchLaterMovies:', err);
            return [];
        }
    };

    // Function to apply watched style to a movie card
    const applyWatchLaterMovie = (mediaItem) => {
        console.log('Applying watched style to media item:', mediaItem.id);
        const image = mediaItem.querySelector('img');
        if (image) {
            const watchLaterMovies = document.createElement('div');
            watchLaterMovies.textContent = 'Planned';
            watchLaterMovies.classList.add('watch-later-label');
            mediaItem.appendChild(watchLaterMovies);
        }
    };

    // Function to apply watch later style to a media item (movie or TV show)
    const applyWatchLaterStyle = (mediaItem) => {
        console.log('Applying watch later style to media item:', mediaItem.id);
        const watchLaterIcon = mediaItem.querySelector('.watch-later-icon');
        if (watchLaterIcon) {
            const icon = watchLaterIcon.querySelector('ion-icon');
            if (icon) {
                icon.name = 'time';
                icon.style.color = '#00b7ff';
            }
        }
    };

    // Function to fetch watch later TV shows for the current user
    const fetchWatchLaterTvShows = async () => {
        console.log('Fetching watch later TV shows...');
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Error getting session:', error);
                return [];
            }

            console.log('Session found, fetching watch later TV shows for user:', session.user.id);

            const { data: watchLaterShows, error: fetchError } = await supabase
                .from('watch_later_tv')
                .select('tv_id')
                .eq('user_id', session.user.id);

            if (fetchError) {
                console.error('Error fetching watch later TV shows:', fetchError);
                return [];
            }

            console.log('Watch later TV shows fetched:', watchLaterShows);
            return watchLaterShows.map(show => show.tv_id);
        } catch (err) {
            console.error('Error in fetchWatchLaterTvShows:', err);
            return [];
        }
    };

    const fetchTrendingMovies = async () => {
        const url = `${baseApiUrl}/trending/movie/week?api_key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'movie');
        } catch (error) {
            console.error('Error fetching trending movies:', error);
        }
    };

    const fetchPopularTvShows = async () => {
        const url = `${baseApiUrl}/tv/popular?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'tv');
        } catch (error) {
            console.error('Error fetching popular TV shows:', error);
        }
    };

    const fetchRedactionPicks = async (genre) => {
        let url = `${getYtsListMoviesUrl()}?limit=20&sort_by=like_count&order_by=desc&language=english`;
        if (genre) {
            url += `&genre=${genre}`;
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            const movies = data.data.movies;
            const enrichedMovies = await Promise.all(movies.map(async (movie) => {
                const tmdbData = await fetchTmdbData(movie.title, movie.year);
                return {
                    ...movie,
                    id: tmdbData.id,
                    poster_path: tmdbData.poster_path,
                    vote_average: tmdbData.vote_average,
                    release_date: tmdbData.release_date
                };
            }));
            displayMedia(enrichedMovies, 'movie');
        } catch (error) {
            console.error('Error fetching redaction picks:', error);
        }
    };

    const fetchTmdbData = async (title, year) => {
        const url = `${baseApiUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.results[0] || {};
        } catch (error) {
            console.error('Error fetching TMDB data:', error);
            return {};
        }
    };

    const fetchTopRatedMovies = async () => {
        const url = `${baseApiUrl}/movie/top_rated?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'movie');
        } catch (error) {
            console.error('Error fetching top rated movies:', error);
        }
    };

    const fetchTopRatedTvShows = async () => {
        const url = `${baseApiUrl}/tv/top_rated?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'tv');
        } catch (error) {
            console.error('Error fetching top rated TV shows:', error);
        }
    };

    const fetchNowPlayingMovies = async () => {
        const url = `${baseApiUrl}/movie/now_playing?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'movie');
        } catch (error) {
            console.error('Error fetching now playing movies:', error);
        }
    };

    const fetchUpcomingMovies = async () => {
        const url = `${baseApiUrl}/movie/upcoming?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'movie');
        } catch (error) {
            console.error('Error fetching upcoming movies:', error);
        }
    };

    const fetchAiringTodayTvShows = async () => {
        const url = `${baseApiUrl}/tv/airing_today?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'tv');
        } catch (error) {
            console.error('Error fetching airing today TV shows:', error);
        }
    };

    const fetchOnTvShows = async () => {
        const url = `${baseApiUrl}/tv/on_the_air?api_key=${apiKey}&language=en-US&region=US`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'tv');
        } catch (error) {
            console.error('Error fetching on the air TV shows:', error);
        }
    };

    const fetchMoviesByGenre = async (genreId) => {
        const releaseYearFrom = releaseYearFromInput ? releaseYearFromInput.value : '';
        const releaseYearTo = releaseYearToInput ? releaseYearToInput.value : '';
        let url = `${baseApiUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${selectedFilter === 'top-rated' ? 'vote_average.desc' : 'popularity.desc'}&with_genres=${genreId}&region=US&with_original_language=en&vote_count.gte=300`;
        if (releaseYearFrom) {
            url += `&primary_release_date.gte=${releaseYearFrom}`;
        }
        if (releaseYearTo) {
            url += `&primary_release_date.lte=${releaseYearTo}`;
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'movie');
        } catch (error) {
            console.error('Error fetching movies by genre:', error);
        }
    };

    const fetchTvShowsByGenre = async (genreId) => {
        const releaseYearFrom = releaseYearFromInput ? releaseYearFromInput.value : '';
        const releaseYearTo = releaseYearToInput ? releaseYearToInput.value : '';
        let url = `${baseApiUrl}/discover/tv?api_key=${apiKey}&language=en-US&sort_by=${selectedFilter === 'top-rated' ? 'vote_average.desc' : 'popularity.desc'}&with_genres=${genreId}&with_watch_providers=8|9|337|10|15|384&watch_region=US&with_original_language=en&with_origin_country=US&vote_count.gte=300`;
        if (releaseYearFrom) {
            url += `&first_air_date.gte=${releaseYearFrom}`;
        }
        if (releaseYearTo) {
            url += `&first_air_date.lte=${releaseYearTo}`;
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMedia(data.results, 'tv');
        } catch (error) {
            console.error('Error fetching TV shows by genre:', error);
        }
    };

    const getRatingImage = (ratingPercentage) => {
        if (ratingPercentage === 'N/A' || ratingPercentage === null || ratingPercentage === undefined) {
            return 'assets/images/unknown-audience.svg';
        } else if (ratingPercentage >= 84) {
            return 'assets/images/fresh-audience.svg';
        } else if (ratingPercentage > 50) {
            return 'assets/images/mid-audience.svg';
        } else {
            return 'assets/images/rotten-audience.svg';
        }
    };

    // Function to update watched and watch later status for media items
    const updateMediaStatus = async (mediaItems, mediaType) => {
        if (!mediaItems || mediaItems.length === 0) return;

        try {
            let watchedIds = [];
            let watchLaterIds = [];

            if (mediaType === 'movie') {
                watchedIds = await fetchWatchedMovies();
                watchLaterIds = await fetchWatchLaterMovies();
            } else if (mediaType === 'tv') {
                watchedIds = await fetchWatchedTvShows();
                watchLaterIds = await fetchWatchLaterTvShows();
            }

            mediaItems.forEach(mediaItem => {
                const mediaId = mediaItem.id.toString();
                
                // Apply watched style if media is watched
                if (watchedIds.includes(mediaId)) {
                    applyWatchedStyle(mediaItem);
                }
                
                // Apply watch later style if media is in watch later list
                if (watchLaterIds.includes(mediaId)) {
                    applyWatchLaterMovie(mediaItem);
                }
            });
        } catch (error) {
            console.error('Error updating media status:', error);
        }
    };

    // Function to fetch detailed TV show information
    const fetchTvShowDetails = async (showId) => {
        try {
            const url = `${baseApiUrl}/tv/${showId}?api_key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error fetching TV show details');
            return await response.json();
        } catch (error) {
            console.error('Error fetching TV show details:', error);
            return null;
        }
    };

    // Function to display media with watched status
    const displayMedia = async (media, mediaType) => {
        console.log('Displaying media...');
        const mediaContainer = document.createElement('div');
        mediaContainer.classList.add('media-container');
        mediaContainer.innerHTML = '';
        
        // If we're displaying TV shows, fetch additional details for each show
        let enhancedMedia = media;
        if (mediaType === 'tv') {
            enhancedMedia = await Promise.all(media.map(async (item) => {
                // Fetch detailed information for each TV show
                const details = await fetchTvShowDetails(item.id);
                if (details) {
                    return {
                        ...item,
                        status: details.status,
                        last_air_date: details.last_air_date,
                        number_of_seasons: details.number_of_seasons,
                        number_of_episodes: details.number_of_episodes
                    };
                }
                return item;
            }));
        }
        
        enhancedMedia.forEach(item => {
            console.log('Processing media item:', item.id, item.title || item.name);
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item');
            mediaItem.id = item.id; // Set the movie ID as the ID of the media item
            
            // Handle different date formats for movies vs TV shows
            let yearDisplay = 'N/A';
            if (mediaType === 'movie') {
                yearDisplay = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
            } else if (mediaType === 'tv') {
                // For TV shows, show the time period (first_air_date to last_air_date or 'Present')
                const firstAirYear = item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A';
                
                // Check if the show is still running based on status
                const isRunning = item.status === 'Returning Series' || item.status === 'In Production';
                
                // If we have last_air_date and the show is not running, show the end year
                // Otherwise, show 'Present' or 'Ongoing'
                if (item.last_air_date && !isRunning) {
                    const lastAirYear = new Date(item.last_air_date).getFullYear();
                    yearDisplay = `${firstAirYear} - ${lastAirYear}`;
                } else if (firstAirYear !== 'N/A') {
                    yearDisplay = `${firstAirYear} - ${isRunning ? 'Present' : firstAirYear}`;
                }
            }
            
            const ratingPercentage = Math.round(item.vote_average * 10);
            const ratingImage = getRatingImage(ratingPercentage);
            mediaItem.innerHTML = `
                <img src="${imageBaseUrl}${item.poster_path}" alt="${item.title || item.name}">
                <h3>${item.title || item.name}</h3>
                <div class="year-rating">
                    <p class="rating"><img src="${ratingImage}" alt="Rating"> ${ratingPercentage}%</p>
                    <p class="year">${yearDisplay}</p>
                </div>
            `;

            mediaItem.addEventListener('click', (event) => {
                const id = item.id;
                const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
                
                // Middle mouse button (button 1) opens in new tab
                if (event.button === 1) {
                    window.open(url, '_blank');
                    event.preventDefault();
                } else {
                    window.location.href = url; // Open the URL in the same tab
                }
            });
            
            // Add mousedown event listener to handle middle-click
            mediaItem.addEventListener('mousedown', (event) => {
                if (event.button === 1) { // Middle mouse button
                    const id = item.id;
                    const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
                    window.open(url, '_blank');
                    event.preventDefault();
                }
            });
            
            mediaContainer.appendChild(mediaItem);
        });

        // Clear previous content and append new media
        const existingContainer = document.querySelector('.fetched-sorted .media-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        document.querySelector('.fetched-sorted').appendChild(mediaContainer);
        
        // Update media status (watched and watch later) for all items
        await updateMediaStatus(mediaContainer.querySelectorAll('.media-item'), mediaType);
    };

    const updateMediaFilterOptions = () => {
        const selectedMediaType = mediaTypeSelect.value;
        mediaFilterSelect.innerHTML = ''; // Clear existing options

        if (selectedMediaType === 'movie') {
            mediaFilterSelect.innerHTML = `
                <option value="redaction-picks">Cracked Only</option>
                <option value="popular">Popular Movies</option>
                <option value="now-playing">Now Playing Movies</option>
                <option value="upcoming">Upcoming Movies</option>
                <option value="top-rated">Top Rated Movies</option>
            `;
        } else if (selectedMediaType === 'tv') {
            mediaFilterSelect.innerHTML = `
                <option value="top-rated">Top Rated TV Shows</option>
                <option value="popular">Popular TV Shows</option>
                <option value="airing-today">Airing Today</option>
                <option value="on-tv">On TV</option>
            `;
        }
    };

    // Add a button to load more movies
const loadMoreButton = document.getElementById('load-more');
let currentPage = 1;

const loadMoreMovies = async () => {
    currentPage++;
    const releaseYearFrom = releaseYearFromInput ? releaseYearFromInput.value : '';
    const releaseYearTo = releaseYearToInput ? releaseYearToInput.value : '';
    let url;
    const selectedMediaType = mediaTypeSelect.value;

    if (selectedFilter === 'redaction-picks' && selectedMediaType === 'movie') {
        url = `${getYtsListMoviesUrl()}?limit=20&page=${currentPage}&sort_by=like_count&order_by=desc&language=english`;
        if (selectedGenre) {
            url += `&genre=${genreMap[selectedGenre]}`;
        }
    } else if (selectedMediaType === 'movie') {
        url = `${baseApiUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${selectedFilter === 'top-rated' ? 'vote_average.desc' : 'popularity.desc'}&with_genres=${selectedGenre}&region=US&with_original_language=en&vote_count.gte=300&page=${currentPage}`;
        if (releaseYearFrom) {
            url += `&primary_release_date.gte=${releaseYearFrom}`;
        }
        if (releaseYearTo) {
            url += `&primary_release_date.lte=${releaseYearTo}`;
        }
    } else if (selectedMediaType === 'tv') {
        url = `${baseApiUrl}/discover/tv?api_key=${apiKey}&language=en-US&sort_by=${selectedFilter === 'top-rated' ? 'vote_average.desc' : 'popularity.desc'}&with_genres=${selectedGenre}&with_watch_providers=8|9|337|10|15|384&watch_region=US&with_original_language=en&with_origin_country=US&vote_count.gte=300&page=${currentPage}`;
        if (releaseYearFrom) {
            url += `&first_air_date.gte=${releaseYearFrom}`;
        }
        if (releaseYearTo) {
            url += `&first_air_date.lte=${releaseYearTo}`;
        }
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (selectedFilter === 'redaction-picks' && selectedMediaType === 'movie') {
            const movies = data.data.movies;
            const enrichedMovies = await Promise.all(movies.map(async (movie) => {
                const tmdbData = await fetchTmdbData(movie.title, movie.year);
                return {
                    ...movie,
                    id: tmdbData.id,
                    poster_path: tmdbData.poster_path,
                    vote_average: tmdbData.vote_average,
                    release_date: tmdbData.release_date
                };
            }));
            displayMoreMedia(enrichedMovies, 'movie');
        } else {
            displayMoreMedia(data.results, selectedMediaType);
        }
    } catch (error) {
        console.error(`Error fetching more ${selectedMediaType === 'movie' ? 'movies' : 'TV shows'}:`, error);
    }
};

const displayMoreMedia = async (media, mediaType) => {
    console.log('Displaying more media...');
    
    // Fetch appropriate lists based on media type
    let watchedItems = [];
    let watchLaterItems = [];
    
    try {
        if (mediaType === 'movie') {
            watchedItems = await fetchWatchedMovies();
            watchLaterItems = await fetchWatchLaterMovies();
        } else if (mediaType === 'tv') {
            watchedItems = await fetchWatchedTvShows();
            watchLaterItems = await fetchWatchLaterTvShows();
        }
        console.log('Watched items list:', watchedItems);
        console.log('Watch later items list:', watchLaterItems);
    } catch (error) {
        console.error('Error fetching status data:', error);
    }

    const mediaContainer = document.querySelector('.media-container');
    media.forEach(item => {
        console.log('Processing media item:', item.id, item.title || item.name);

        const mediaItem = document.createElement('div');
        mediaItem.classList.add('media-item');
        mediaItem.id = item.id; // Set the movie ID as the ID of the media item
        const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
        const ratingPercentage = Math.round(item.vote_average * 10);
        const ratingImage = getRatingImage(ratingPercentage);
        mediaItem.innerHTML = `
            <img src="${imageBaseUrl}${item.poster_path}" alt="${item.title || item.name}">
            <h3>${item.title || item.name}</h3>
            <div class="year-rating">
                <p class="rating"><img src="${ratingImage}" alt="Rating"> ${ratingPercentage}%</p>
                <p class="year">${releaseYear}</p>
            </div>
        `;

        // Check if the item is watched and apply the style
        if (watchedItems.includes(item.id.toString())) {
            console.log('Item is watched:', item.id);
            applyWatchedStyle(mediaItem);
        } else {
            console.log('Item is not watched:', item.id);
        }

        // Check if the item is in watch later and apply the style
        if (watchLaterItems.includes(item.id.toString())) {
            console.log('Item is in watch later:', item.id);
            applyWatchLaterMovie(mediaItem);
        } else {
            console.log('Item is not in watch later:', item.id);
        }

        mediaItem.addEventListener('click', (event) => {
            const id = item.id;
            const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
            
            // Middle mouse button (button 1) opens in new tab
            if (event.button === 1) {
                window.open(url, '_blank');
                event.preventDefault();
            } else {
                window.location.href = url; // Open the URL in the same tab
            }
        });
        
        // Add mousedown event listener to handle middle-click
        mediaItem.addEventListener('mousedown', (event) => {
            if (event.button === 1) { // Middle mouse button
                const id = item.id;
                const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
                window.open(url, '_blank');
                event.preventDefault();
            }
        });

        mediaContainer.appendChild(mediaItem);
    });
};

loadMoreButton.addEventListener('click', loadMoreMovies);


    // Function to update genre visibility based on selected media type
    const updateGenreVisibility = () => {
        const selectedMediaType = mediaTypeSelect.value;
        genreSpans.forEach(span => {
            if (span.classList.contains('movie-only')) {
                span.style.display = selectedMediaType === 'movie' ? 'inline-block' : 'none';
            } else if (span.classList.contains('tv-only')) {
                span.style.display = selectedMediaType === 'tv' ? 'inline-block' : 'none';
            } else {
                span.style.display = 'inline-block';
            }
        });
    };

    // Fetch and display popular movies by default
    fetchTrendingMovies();
    updateGenreVisibility();
    updateMediaFilterOptions();
    
    // Set the media filter select to 'popular' by default
    setTimeout(() => {
        mediaFilterSelect.value = 'popular';
    }, 100);

    // Event listener for media type selection
    mediaTypeSelect.addEventListener('change', (event) => {
        updateGenreVisibility();
        updateMediaFilterOptions();
        const selectedMediaType = event.target.value;
        if (selectedMediaType === 'movie') {
            fetchRedactionPicks();
        } else if (selectedMediaType === 'tv') {
            fetchTopRatedTvShows();
        }
    });

    // Event listener for media filter selection
    mediaFilterSelect.addEventListener('change', (event) => {
        selectedFilter = event.target.value;
        const selectedMediaType = mediaTypeSelect.value;

        if (selectedMediaType === 'movie') {
            if (selectedFilter === 'popular') {
                fetchTrendingMovies();
            } else if (selectedFilter === 'now-playing') {
                fetchNowPlayingMovies();
            } else if (selectedFilter === 'upcoming') {
                fetchUpcomingMovies();
            } else if (selectedFilter === 'top-rated') {
                fetchTopRatedMovies();
            } else if (selectedFilter === 'redaction-picks') {
                fetchRedactionPicks(genreMap[selectedGenre]);
            }
        } else if (selectedMediaType === 'tv') {
            if (selectedFilter === 'popular') {
                fetchPopularTvShows();
            } else if (selectedFilter === 'airing-today') {
                fetchAiringTodayTvShows();
            } else if (selectedFilter === 'on-tv') {
                fetchOnTvShows();
            } else if (selectedFilter === 'top-rated') {
                fetchTopRatedTvShows();
            }
        }
    });

    // Event listener for genre selection
    genreSpans.forEach(span => {
        span.addEventListener('click', (event) => {
            selectedGenre = event.target.getAttribute('value');
            const selectedMediaType = mediaTypeSelect.value;
            if (selectedMediaType === 'movie') {
                if (selectedFilter === 'redaction-picks') {
                    fetchRedactionPicks(genreMap[selectedGenre]);
                } else {
                    fetchMoviesByGenre(selectedGenre);
                }
            } else if (selectedMediaType === 'tv') {
                fetchTvShowsByGenre(selectedGenre);
            }
        });
    });

    // Event listeners for date inputs
    if (releaseYearFromInput) {
        releaseYearFromInput.addEventListener('change', () => {
            const selectedMediaType = mediaTypeSelect.value;
            if (selectedMediaType === 'movie') {
                fetchMoviesByGenre(selectedGenre);
            } else if (selectedMediaType === 'tv') {
                fetchTvShowsByGenre(selectedGenre);
            }
        });
    }

    if (releaseYearToInput) {
        releaseYearToInput.addEventListener('change', () => {
            const selectedMediaType = mediaTypeSelect.value;
            if (selectedMediaType === 'movie') {
                fetchMoviesByGenre(selectedGenre);
            } else if (selectedMediaType === 'tv') {
                fetchTvShowsByGenre(selectedGenre);
            }
        });
    }

    // Function to search movies or TV shows
    // Function to search movies or TV shows with a filter for minimum votes
    const searchMedia = async (query) => {
        const selectedMediaType = mediaTypeSelect.value; // 'movie' or 'tv'
        const url = `${baseApiUrl}/search/${selectedMediaType}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        const minVotes = 10; // Minimum number of votes to filter results

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Filter results based on minimum vote count
            const filteredResults = data.results.filter(item => item.vote_count >= minVotes);

            displayMedia(filteredResults, selectedMediaType);
        } catch (error) {
            console.error('Error searching media:', error);
        }
    };

    // Function to debounce the search input
    let debounceTimeout;
    const debounceSearch = (callback, delay) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(callback, delay);
    };

    // Event listener for the native search input (automatic search)
    nativeSearchInput.addEventListener('input', () => {
        const query = nativeSearchInput.value.trim();
        if (query) {
            debounceSearch(() => searchMedia(query), 500); // Trigger search after 500ms of inactivity
        }
    });
});

