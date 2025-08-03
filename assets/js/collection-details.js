// API Configuration
const imageW500Url = 'https://image.tmdb.org/t/p/w500';
const imageW342Url = 'https://image.tmdb.org/t/p/w342'; // Better quality poster

// DOM Elements
const collectionHeader = document.getElementById('collectionHeader');
const collectionTitle = document.getElementById('collectionTitle');
const collectionOverview = document.getElementById('collectionOverview');
const movieCountElement = document.getElementById('movieCount');
const moviesGrid = document.getElementById('moviesGrid');

// Get collection ID from URL
const urlParams = new URLSearchParams(window.location.search);
const collectionId = urlParams.get('id');

// Check if collection ID exists
if (!collectionId) {
    window.location.href = 'index.html';
}

// Format date to display only the year
const formatYear = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
};

// Format the movie count with proper pluralization
const formatMovieCount = (count) => {
    return `${count} ${count === 1 ? 'Movie' : 'Movies'}`;
};

// Fetch collection details from TMDB API with additional movie details
const fetchCollectionDetails = async () => {
    try {
        // Show loading state
        collectionTitle.textContent = 'Loading...';
        
        // Fetch collection details with append_to_response to get more details
        const response = await fetch(
            `https://api.themoviedb.org/3/collection/${collectionId}?api_key=${apiKey}&language=en-US&append_to_response=images,credits`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch collection details');
        }
        
        const data = await response.json();
        
        // Sort movies by release date (oldest first)
        if (data.parts && data.parts.length > 0) {
            data.parts.sort((a, b) => {
                const dateA = a.release_date ? new Date(a.release_date) : new Date('9999-12-31');
                const dateB = b.release_date ? new Date(b.release_date) : new Date('9999-12-31');
                return dateA - dateB; // Sort from oldest to newest
            });
        }
        
        // Update the page with collection data
        updateCollectionUI(data);
        
        // Return the data for further processing
        return data;
    } catch (error) {
        console.error('Error fetching collection details:', error);
        collectionTitle.textContent = 'Error loading collection';
        collectionOverview.textContent = 'There was an error loading the collection. Please try again later.';
        return null;
    }
};

// Update the UI with collection data
const updateCollectionUI = (collection) => {
    // Set the background image with higher quality
    if (collection.backdrop_path) {
        const backdropUrl = `${imageBaseUrl}${collection.backdrop_path}`;
        collectionHeader.style.setProperty('--bg-image', `url(${backdropUrl})`);
    }
    
    // Set the collection title
    collectionTitle.textContent = collection.name || 'Untitled Collection';
    
    // Set the collection overview with better formatting
    if (collection.overview) {
        collectionOverview.textContent = collection.overview;
    } else {
        collectionOverview.textContent = 'No overview available for this collection.';
    }
    
    // Update movie count with icon
    const movieCount = collection.parts?.length || 0;
    movieCountElement.innerHTML = `<i class="fas fa-film"></i> ${formatMovieCount(movieCount)}`;
    
    // Display the movies in the collection
    if (collection.parts && collection.parts.length > 0) {
        displayMovies(collection.parts);
    } else {
        moviesGrid.innerHTML = `
            <div class="no-movies">
                <i class="fas fa-film"></i>
                <p>No movies found in this collection.</p>
            </div>`;
    }
};

// Display movies in the grid with loading state
const displayMovies = (movies) => {
    // Clear the grid
    moviesGrid.innerHTML = '';
    
    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Loading movies...';
    moviesGrid.appendChild(loadingDiv);
    
    // Small delay to show loading state (for better UX)
    setTimeout(() => {
        // Clear loading state
        moviesGrid.innerHTML = '';
        
        if (!movies || movies.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-movies">
                    <i class="fas fa-film"></i>
                    <p>No movies found in this collection.</p>
                </div>`;
            return;
        }
        
        // Create movie cards
        movies.forEach(movie => {
            // Only include movies with a valid poster or backdrop
            if (movie.poster_path || movie.backdrop_path) {
                const movieCard = createMovieCard(movie);
                moviesGrid.appendChild(movieCard);
            }
        });
        
        // If no valid movies were found
        if (moviesGrid.children.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-movies">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No valid movies found in this collection.</p>
                </div>`;
        }
    }, 300); // Small delay for better UX
};

// Format rating to one decimal place
const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'N/A';
};

// Create a movie card element with enhanced details
const createMovieCard = (movie) => {
    const card = document.createElement('a');
    card.href = `movie-details.html?id=${movie.id}`;
    card.className = 'movie-card';
    
    // Use poster path for better consistency
    const imagePath = movie.poster_path || movie.backdrop_path;
    const imageUrl = imagePath ? `${imageW342Url}${imagePath}` : 'assets/images/no-image.jpg';
    
    // Format release year
    const releaseYear = formatYear(movie.release_date);
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img 
                src="${imageUrl}" 
                alt="${movie.title || 'Movie'}" 
                class="movie-poster"
                loading="lazy"
                onerror="this.onerror=null; this.src='assets/images/no-image.jpg'"
            >
        </div>
        <div class="movie-info">
            <h3 class="movie-title" title="${movie.title || 'Untitled'}">
                ${movie.title || 'Untitled'}
            </h3>
            <div class="movie-meta">
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    ${formatRating(movie.vote_average)}
                </div>
                <div class="movie-year">
                    ${releaseYear}
                </div>
            </div>
        </div>
    `;
    
    return card;
};

// Initialize the page
const init = () => {
    fetchCollectionDetails();
};

// Run the initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);