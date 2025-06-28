let inputCount = 1;
let selectedMovies = [];
let overlayCounter = 0; // Counter to switch between overlay images

function addInputField() {
    if (inputCount >= 6) return;

    inputCount++;
    const inputWrapper = document.getElementById('input-wrapper');
    const newInputContainer = document.createElement('div');
    newInputContainer.className = 'input-container';
    
    // Add the square plus button
    newInputContainer.innerHTML = `
        <div class="movie-box" onclick="activateSearch(${inputCount})">
            <div class="plus-button">+</div>
        </div>
        <button class="remove-button" onclick="removeInputField(${inputCount})">-</button>
        <input type="text" id="movie${inputCount}" placeholder="Enter Movie Name" oninput="searchMovie(${inputCount})" style="display:none;" autocorrect="off" autofill="off" autocomplete="off" spellcheck="false">
    `;
    
    inputWrapper.appendChild(newInputContainer);
    
    // Update the previous container to show circular plus button
    const prevContainer = newInputContainer.previousElementSibling;
    if (prevContainer && prevContainer.classList.contains('input-container')) {
        prevContainer.querySelector('.movie-box').style.display = 'none';
        const circularPlus = document.createElement('div');
        circularPlus.className = 'movie-box';
        circularPlus.style.display = 'flex';
        circularPlus.style.width = '30px';
        circularPlus.style.height = '30px';
        circularPlus.style.borderRadius = '50%';
        circularPlus.style.backgroundColor = '#00b7ff';
        circularPlus.innerHTML = '<div class="plus-button">+</div>';
        circularPlus.onclick = () => addInputField();
        prevContainer.insertBefore(circularPlus, prevContainer.firstChild);
    }
    
    updateButtonVisibility();
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
            <img src="${posterUrl}" alt="${movie.title}" width="100">
            <div>
                <strong>${movie.title}</strong> (${movie.release_date ? movie.release_date.substring(0, 4) : '-'})<br>
                Similarity Score: ${Math.round(movie.similarityScore)}%
            </div>
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

function removeInputField(index) {
    if (inputCount <= 1) return; // Prevent removing the last input field

    const inputWrapper = document.getElementById('input-wrapper');
    const inputContainers = inputWrapper.querySelectorAll('.input-container');
    const containerToRemove = inputContainers[inputContainers.length - 1]; // Always remove the last container

    if (containerToRemove) {
        inputWrapper.removeChild(containerToRemove);
        selectedMovies.splice(inputContainers.length - 1, 1); // Remove the corresponding movie from the selectedMovies array
        inputCount--;

        // Reindex remaining containers and their elements
        const remainingContainers = inputWrapper.querySelectorAll('.input-container');
        remainingContainers.forEach((container, idx) => {
            const newIndex = idx + 1;
            const movieBox = container.querySelector('.movie-box');
            const input = container.querySelector('input');

            if (movieBox) movieBox.setAttribute('onclick', `activateSearch(${newIndex})`);
            if (input) {
                input.id = `movie${newIndex}`;
                input.setAttribute('oninput', `searchMovie(${newIndex})`);
            }
        });

        updateButtonVisibility();
    }
}

function updateButtonVisibility() {
    const containers = document.querySelectorAll('.input-container');
    
    // Remove all existing remove and add buttons
    containers.forEach(container => {
        const removeBtn = container.querySelector('.remove-button');
        if (removeBtn) removeBtn.remove();
        const addBtn = container.querySelector('.add-button');
        if (addBtn) addBtn.remove();
    });

    // Add plus button to last container if we're below max
    if (inputCount < 6) {
        const lastContainer = containers[containers.length - 1];
        const addBtn = document.createElement('div');
        addBtn.className = 'add-button';
        addBtn.innerHTML = '&#43;';
        addBtn.onclick = () => addInputField();
        lastContainer.appendChild(addBtn);
    }

    // Add minus button to last container only when multiple containers exist
    if (containers.length > 1) {
        const lastContainer = containers[containers.length - 1];
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-button';
        removeBtn.innerHTML = '&#8722;';
        removeBtn.onclick = () => removeInputField(containers.length);
        lastContainer.appendChild(removeBtn);
    }
}

// Initialize button visibility when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateButtonVisibility();
});
