document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        'https://cbnwekzbcxbmeevdjgoq.supabase.co', // Replace with your Supabase URL
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase public API key
    );

    const apiKey = '054582e9ee66adcbe911e0008aa482a8';
    const omdbApiKey = '20e349a6'; // Replace with your OMDB API key
    const baseApiUrl = 'https://api.themoviedb.org/3';
    const ytsApiUrl = 'https://yts.mx/api/v2/list_movies.json';
    const omdbApiUrl = 'https://www.omdbapi.com/';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const mediaTypeSelect = document.getElementById('media-type');
    const mediaFilterSelect = document.getElementById('media-filter');
    const genreSpans = document.querySelectorAll('.genres span');
    const fetchedSorted = document.querySelector('.fetched-sorted');
    const releaseYearFromInput = document.getElementById('release-year-from');
    const releaseYearToInput = document.getElementById('release-year-to');
    let selectedGenre = '';
    let selectedFilter = 'redaction-picks';

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

    // Function to apply watched style to a movie card
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
        let url = `${ytsApiUrl}?limit=20&sort_by=like_count&order_by=desc&language=english`;
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

    // Function to display media with watched status
const displayMedia = async (media, mediaType) => {
    console.log('Displaying media...');
    const watchedMovies = await fetchWatchedMovies();
    console.log('Watched movies list:', watchedMovies);

    const mediaContainer = document.createElement('div');
    mediaContainer.classList.add('media-container');
    mediaContainer.innerHTML = '';

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

        // Convert item.id to a string before checking if it's in watchedMovies
        if (watchedMovies.includes(item.id.toString())) {
            console.log('Movie is watched:', item.id);
            applyWatchedStyle(mediaItem);
        } else {
            console.log('Movie is not watched:', item.id);
        }

        mediaItem.addEventListener('click', () => {
            const id = item.id;
            const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
            window.open(url, '_blank'); // Open the URL in a new tab
        });
        
        mediaContainer.appendChild(mediaItem);
    });

    // Clear previous content and append new media items
    fetchedSorted.innerHTML = '';
    fetchedSorted.appendChild(mediaContainer);
};


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

    const updateMediaFilterOptions = () => {
        const selectedMediaType = mediaTypeSelect.value;
        mediaFilterSelect.innerHTML = ''; // Clear existing options

        if (selectedMediaType === 'movie') {
            mediaFilterSelect.innerHTML = `
                <option value="redaction-picks">Redaction Picks</option>
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
        url = `${ytsApiUrl}?limit=20&page=${currentPage}&sort_by=like_count&order_by=desc&language=english`;
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
    const watchedMovies = await fetchWatchedMovies(); // Fetch watched movies
    console.log('Watched movies list:', watchedMovies);

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

        // Check if the movie is watched and apply the style
        if (watchedMovies.includes(item.id.toString())) {
            console.log('Movie is watched:', item.id);
            applyWatchedStyle(mediaItem);
        } else {
            console.log('Movie is not watched:', item.id);
        }

        mediaItem.addEventListener('click', () => {
            const id = item.id;
            const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
            window.open(url, '_blank'); // Open the URL in a new tab
        });

        mediaContainer.appendChild(mediaItem);
    });
};

loadMoreButton.addEventListener('click', loadMoreMovies);


    // Fetch and display trending movies by default
    fetchRedactionPicks();
    updateGenreVisibility();
    updateMediaFilterOptions();

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
});

