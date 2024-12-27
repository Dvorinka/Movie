document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '054582e9ee66adcbe911e0008aa482a8';
    const omdbApiKey = '20e349a6'; // Replace with your OMDB API key
    const baseApiUrl = 'https://api.themoviedb.org/3';
    const omdbApiUrl = 'https://www.omdbapi.com/';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const mediaTypeSelect = document.getElementById('media-type');
    const mediaFilterSelect = document.getElementById('media-filter');
    const genreSpans = document.querySelectorAll('.genres span');
    const fetchedSorted = document.querySelector('.fetched-sorted');
    const releaseYearFromInput = document.getElementById('release-year-from');
    const releaseYearToInput = document.getElementById('release-year-to');
    let selectedGenre = '';
    let selectedFilter = 'popular';

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

    const displayMedia = (media, mediaType) => {
        const mediaContainer = document.createElement('div');
        mediaContainer.classList.add('media-container');
        mediaContainer.innerHTML = '';
    
        media.forEach(item => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item');
            const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
            const ratingPercentage = Math.round(item.vote_average * 10);
            mediaItem.innerHTML = `
                <img src="${imageBaseUrl}${item.poster_path}" alt="${item.title || item.name}">
                <h3>${item.title || item.name}</h3>
                <p class="rating"><ion-icon name="star"></ion-icon> ${ratingPercentage}%</p>
                <p class="year">Year: ${releaseYear}</p>
            `;
            mediaItem.addEventListener('click', () => {
                const id = item.id;
                const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
                window.location.href = url;
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
                <option value="popular">Popular Movies</option>
                <option value="now-playing">Now Playing Movies</option>
                <option value="upcoming">Upcoming Movies</option>
                <option value="top-rated">Top Rated Movies</option>
            `;
        } else if (selectedMediaType === 'tv') {
            mediaFilterSelect.innerHTML = `
                <option value="popular">Popular TV Shows</option>
                <option value="airing-today">Airing Today</option>
                <option value="on-tv">On TV</option>
                <option value="top-rated">Top Rated TV Shows</option>
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
    let url = `${baseApiUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${selectedFilter === 'top-rated' ? 'vote_average.desc' : 'popularity.desc'}&with_genres=${selectedGenre}&region=US&with_original_language=en&vote_count.gte=300&page=${currentPage}`;
    if (releaseYearFrom) {
        url += `&primary_release_date.gte=${releaseYearFrom}`;
    }
    if (releaseYearTo) {
        url += `&primary_release_date.lte=${releaseYearTo}`;
    }
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayMoreMedia(data.results, 'movie');
    } catch (error) {
        console.error('Error fetching more movies:', error);
    }
};

const displayMoreMedia = (media, mediaType) => {
    const mediaContainer = document.querySelector('.media-container');
    media.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.classList.add('media-item');
        const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
        const ratingPercentage = Math.round(item.vote_average * 10);
        mediaItem.innerHTML = `
            <img src="${imageBaseUrl}${item.poster_path}" alt="${item.title || item.name}">
            <h3>${item.title || item.name}</h3>
            <p class="rating"><ion-icon name="star"></ion-icon> ${ratingPercentage}%</p>
            <p class="year">Year: ${releaseYear}</p>
        `;
        mediaItem.addEventListener('click', () => {
            const id = item.id;
            const url = mediaType === 'movie' ? `movie-details.html?id=${id}` : `tv-details.html?id=${id}`;
            window.location.href = url;
        });
        mediaContainer.appendChild(mediaItem);
    });
};

loadMoreButton.addEventListener('click', loadMoreMovies);

    // Fetch and display trending movies by default
    fetchTrendingMovies();
    updateGenreVisibility();
    updateMediaFilterOptions();

    // Event listener for media type selection
    mediaTypeSelect.addEventListener('change', (event) => {
        updateGenreVisibility();
        updateMediaFilterOptions();
        const selectedMediaType = event.target.value;
        if (selectedMediaType === 'movie') {
            fetchTrendingMovies();
        } else if (selectedMediaType === 'tv') {
            fetchPopularTvShows();
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
            console.log(`Genre selected: ${selectedGenre}`);
            const selectedMediaType = mediaTypeSelect.value;
            if (selectedMediaType === 'movie') {
                fetchMoviesByGenre(selectedGenre);
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

