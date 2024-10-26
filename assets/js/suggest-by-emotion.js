// Elements
const form = document.getElementById('emotion-form');
const movieResults = document.getElementById('movie-results');

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emotion = document.getElementById('emotion').value;
    getMoviesByEmotion(emotion);
});

// Fetch popular movies from TMDB
async function getPopularMovies() {
    const url = `${baseApiUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
}

// Function to fetch movies based on user's emotion
async function getMoviesByEmotion(emotion) {
    const movies = await getPopularMovies();
    const filteredMovies = movies.filter(movie => {
        const lowerEmotion = emotion.toLowerCase();
        return movie.overview.toLowerCase().includes(lowerEmotion) || movie.title.toLowerCase().includes(lowerEmotion);
    });
    displayMovies(filteredMovies);
}

// Display the matching movies
function displayMovies(movies) {
    movieResults.innerHTML = '';

    if (movies.length === 0) {
        movieResults.innerHTML = '<p>No movies found for this emotion.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.innerHTML = `
            <h3>${movie.title}</h3>
            <p>${movie.overview}</p>
        `;
        movieResults.appendChild(movieEl);
    });
}