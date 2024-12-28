let inputCount = 1;
let selectedMovies = [];
let overlayCounter = 0; // Counter to switch between overlay images

function addInputField() {
    if (inputCount >= 6) return;

    inputCount++;
    const inputWrapper = document.getElementById('input-wrapper');
    const newInputContainer = document.createElement('div');
    newInputContainer.className = 'input-container';
    newInputContainer.style.marginTop = '10px'; // Adjusted margin between input containers
    newInputContainer.innerHTML = `
        <div class="movie-box" onclick="activateSearch(${inputCount})">
            <div class="plus-button">+</div>
        </div>
        <input type="text" id="movie${inputCount}" placeholder="Enter Movie Name" oninput="searchMovie(${inputCount})" style="display:none; autocorrect="off" autofill="off" autocomplete="off" spellcheck="false">
        ${inputCount < 6 ? '<div class="add-button" onclick="addInputField()">&#43;</div>' : ''}
    `;
    inputWrapper.appendChild(newInputContainer);

    // Update previous add button to move to the new input container
    const prevInputContainer = document.querySelector('.input-container:nth-last-child(2)');
    if (prevInputContainer) {
        prevInputContainer.querySelector('.add-button').style.display = 'none';
    }
}

function activateSearch(index) {
    const inputField = document.getElementById(`movie${index}`);
    inputField.style.display = 'block';
    inputField.focus();
}

async function searchMovie(index) {
    const movieName = document.getElementById(`movie${index}`).value.trim();
    if (!movieName) {
        clearSearchResults();
        return;
    }

    const url = `${baseApiUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieName)}`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        displaySearchResults(data.results, index);
    } else {
        console.error(`Error searching for movies with name ${movieName}`);
    }
}

function displaySearchResults(results, index) {
    const moviesList = document.getElementById('movies-list');
    moviesList.innerHTML = '';
    results.forEach(movie => {
        const listItem = document.createElement('li');
        listItem.textContent = `${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : '-'})`;
        listItem.className = 'search-result';
        listItem.onclick = () => selectMovie(movie, index);
        moviesList.appendChild(listItem);
    });
}

function selectMovie(movie, index) {
    selectedMovies[index - 1] = movie;
    const inputField = document.getElementById(`movie${index}`);
    inputField.value = `${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : '-'})`;
    inputField.style.display = 'none'; // Hide the input field after selection
    clearSearchResults();
    updateMovieBox(index, movie);

    // Hide add button from current input container
    const currentInputContainer = document.getElementById(`input-wrapper`).querySelector(`.input-container:nth-child(${index})`);
    if (currentInputContainer) {
        const addButton = currentInputContainer.querySelector('.add-button');
        if (addButton) {
            addButton.style.display = 'block';
        }
    }

    // Show add button in the next input container
    const nextInputContainer = document.getElementById(`input-wrapper`).querySelector(`.input-container:nth-child(${index + 1})`);
    if (nextInputContainer) {
        const addButton = nextInputContainer.querySelector('.add-button');
        if (addButton) {
            addButton.style.display = 'block';
        }
    }
}

function clearSearchResults() {
    const moviesList = document.getElementById('movies-list');
    moviesList.innerHTML = '';
}

function updateMovieBox(index, movie) {
    const movieBox = document.querySelector(`#input-wrapper .input-container:nth-child(${index}) .movie-box`);
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';

    // Define the overlay images
    const overlayImages = [
        'assets/images/banner-overlay-first.png',
        'assets/images/banner-overlay-second.png',
        'assets/images/banner-overlay-third.png',
        'assets/images/banner-overlay-fourth.png',
        'assets/images/banner-overlay-fifth.png',
        'assets/images/banner-overlay-sixth.png'
    ];

    // Select the overlay image based on the counter
    const overlayUrl = overlayImages[overlayCounter % overlayImages.length];
    movieBox.innerHTML = `
        <div style="
            background: 
                url('${overlayUrl}'), /* overlay image */
                url('${posterUrl}') no-repeat center top; /* movie poster */
            background-size: cover;
            width: 100%;
            height: 100%;
            border-radius: 0px;"></div>
            <div style="background: #ffffff00; padding: 10px; width: 100%; height: 100%;">
                ${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : '-'})
            </div>
    `;
    overlayCounter++; // Increment counter to alternate overlays
}



async function fetchRecommendations() {
    const movieIds = selectedMovies.map(movie => movie.id);

    let recommendations = [];
    let inputMovies = [];

    for (let movieId of movieIds) {
        const movieDetails = await fetchMovieDetails(movieId);
        if (movieDetails) inputMovies.push(movieDetails);

        const url = `${baseApiUrl}/movie/${movieId}/recommendations?api_key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            recommendations = recommendations.concat(data.results);
        } else {
            console.error(`Error fetching recommendations for movie ID ${movieId}`);
        }
    }

    const uniqueRecommendations = Array.from(new Set(recommendations.map(a => a.id)))
        .map(id => recommendations.find(a => a.id === id));

    const detailedRecommendations = await Promise.all(uniqueRecommendations.map(movie => fetchMovieDetails(movie.id)));
    const recommendationsWithScores = detailedRecommendations.map(movie => ({
        ...movie,
        similarityScore: calculateSimilarityScore(movie, inputMovies)
    })).filter(movie => movie.similarityScore > 0 && !movieIds.includes(movie.id));

    const sortedRecommendations = recommendationsWithScores.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 15);

    const recommendationsList = document.getElementById('recommendations');
recommendationsList.innerHTML = '';
sortedRecommendations.forEach(movie => {
    const listItem = document.createElement('li');
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
    listItem.innerHTML = `
        <a href="movie-details.html?id=${movie.id}">
            <img src="${posterUrl}" alt="${movie.title}" width="100">
            <div>
                <strong>${movie.title}</strong> (${movie.release_date ? movie.release_date.substring(0, 4) : '-'})<br>
                Similarity Score: ${Math.round(movie.similarityScore)}%
            </div>
        </a>
    `;
    recommendationsList.appendChild(listItem);
});
}

async function fetchMovieDetails(movieId) {
    const url = `${baseApiUrl}/movie/${movieId}?api_key=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
        return await response.json();
    } else {
        console.error(`Error fetching details for movie ID ${movieId}`);
        return null;
    }
}

function calculateSimilarityScore(movie, inputMovies) {
    let score = 0;
    const maxScore = inputMovies.length * 6; // Maximum possible score based on 6 criteria (genres, keywords, ratings, cast, crew, production companies)

    // Example criteria: common genres
    const inputGenres = inputMovies.flatMap(m => m.genres.map(g => g.id));
    const movieGenres = movie.genres.map(g => g.id);
    const commonGenres = movieGenres.filter(genre => inputGenres.includes(genre));
    score += commonGenres.length;

    // Additional criteria: keywords
    const inputKeywords = inputMovies.flatMap(m => (m.keywords || []).map(k => k.id));
    const movieKeywords = (movie.keywords || []).map(k => k.id);
    const commonKeywords = movieKeywords.filter(keyword => inputKeywords.includes(keyword));
    score += commonKeywords.length;

    // Ratings comparison
    const averageInputRating = inputMovies.reduce((acc, m) => acc + m.vote_average, 0) / inputMovies.length;
    if (movie.vote_average && movie.vote_average >= averageInputRating) {
        score++;
    }

    // Cast comparison (checking common actors)
    const inputCast = inputMovies.flatMap(m => (m.credits && m.credits.cast ? m.credits.cast.map(actor => actor.id) : []));
    const movieCast = movie.credits && movie.credits.cast ? movie.credits.cast.map(actor => actor.id) : [];
    const commonCast = movieCast.filter(actor => inputCast.includes(actor));
    score += commonCast.length;

    // Crew comparison (checking common crew members)
    const inputCrew = inputMovies.flatMap(m => (m.credits && m.credits.crew ? m.credits.crew.map(crew => crew.id) : []));
    const movieCrew = movie.credits && movie.credits.crew ? movie.credits.crew.map(crew => crew.id) : [];
    const commonCrew = movieCrew.filter(crew => inputCrew.includes(crew));
    score += commonCrew.length;

    // Production companies comparison
    const inputCompanies = inputMovies.flatMap(m => (m.production_companies || []).map(company => company.id));
    const movieCompanies = (movie.production_companies || []).map(company => company.id);
    const commonCompanies = movieCompanies.filter(company => inputCompanies.includes(company));
    score += commonCompanies.length;

    // Calculate similarity percentage, ensuring it doesn't exceed 100%
    const similarityPercentage = Math.min((score / maxScore) * 100, 100);
    return Math.round(similarityPercentage); // Round to whole number percentage
}
