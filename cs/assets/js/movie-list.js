function searchMovie() {
    const movieInput = document.getElementById('movieInput').value.trim();
    if (movieInput !== "") {
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieInput)}`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const movie = data.results[0];  // Get the first result
                    addMovie(movie);
                } else {
                    alert('Movie not found!');
                }
            })
            .catch(error => console.error('Error fetching movie:', error));
    }
}

function addMovie(movie) {
    const movieList = document.getElementById('movieList');

    const li = document.createElement('li');
    li.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}">
        <span>${movie.title} (${movie.release_date.split('-')[0]})</span>
    `;

    movieList.appendChild(li);
    saveMovieToLocal(movie.id);
    document.getElementById('movieInput').value = '';
}

function saveMovieToLocal(movieId) {
    let movies = JSON.parse(localStorage.getItem('movies')) || [];
    movies.push(movieId);
    localStorage.setItem('movies', JSON.stringify(movies));
}

function generateShareableLink() {
    let movies = JSON.parse(localStorage.getItem('movies')) || [];
    if (movies.length > 0) {
        const encodedMovies = encodeURIComponent(JSON.stringify(movies));
        const shareLink = `${window.location.origin}${window.location.pathname}?movies=${encodedMovies}`;
        document.getElementById('shareLink').textContent = `Share this link: ${shareLink}`;
    } else {
        document.getElementById('shareLink').textContent = 'No movies to share!';
    }
}

function loadSharedMovies() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieIds = urlParams.get('movies');

    if (movieIds) {
        const ids = JSON.parse(decodeURIComponent(movieIds));
        ids.forEach(id => {
            fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`)
                .then(response => response.json())
                .then(movie => {
                    addMovie(movie);
                })
                .catch(error => console.error('Error fetching movie:', error));
        });
    }
}

window.onload = loadSharedMovies;