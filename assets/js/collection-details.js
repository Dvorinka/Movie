// API Configuration
const apiKey = '054582e9ee66adcbe911e0008aa482a8';
const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
const imageW500Url = 'https://image.tmdb.org/t/p/w500';

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

// Fetch collection details from TMDB API
const fetchCollectionDetails = async () => {
    try {
        // Show loading state
        collectionTitle.textContent = 'Loading...';
        
        // Fetch collection details
        const response = await fetch(
            `https://api.themoviedb.org/3/collection/${collectionId}?api_key=${apiKey}&language=en-US`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch collection details');
        }
        
        const data = await response.json();
        
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
    // Set the background image
    if (collection.backdrop_path) {
        const backdropUrl = `${imageBaseUrl}${collection.backdrop_path}`;
        collectionHeader.style.setProperty('--bg-image', `url(${backdropUrl})`);
    }
    
    // Set the collection title
    collectionTitle.textContent = collection.name || 'Untitled Collection';
    
    // Set the collection overview
    if (collection.overview) {
        collectionOverview.textContent = collection.overview;
    } else {
        collectionOverview.textContent = 'No overview available for this collection.';
    }
    
    // Update movie count
    const movieCount = collection.parts?.length || 0;
    movieCountElement.textContent = formatMovieCount(movieCount);
    
    // Display the movies in the collection
    if (collection.parts && collection.parts.length > 0) {
        displayMovies(collection.parts);
    } else {
        moviesGrid.innerHTML = '<p>No movies found in this collection.</p>';
    }
};

// Display movies in the grid
const displayMovies = (movies) => {
    // Clear the grid
    moviesGrid.innerHTML = '';
    
    // Sort movies by release date (newest first)
    const sortedMovies = [...movies].sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
    });
    
    // Create movie cards
    sortedMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
};

// Create a movie card element
const createMovieCard = (movie) => {
    const card = document.createElement('a');
    card.href = `movie-details.html?id=${movie.id}`;
    card.className = 'movie-card';
    
    // Use backdrop path if available, otherwise use poster path
    const imagePath = movie.backdrop_path || movie.poster_path;
    const imageUrl = imagePath ? `${imageW500Url}${imagePath}` : 'assets/images/no-image.jpg';
    
    card.innerHTML = `
        <img 
            src="${imageUrl}" 
            alt="${movie.title || 'Movie'}" 
            class="movie-poster"
            onerror="this.onerror=null; this.src='assets/images/no-image.jpg'"
        >
        <div class="movie-info">
            <h3 class="movie-title" title="${movie.title || 'Untitled'}">${movie.title || 'Untitled'}</h3>
            <p class="movie-year">${formatYear(movie.release_date)}</p>
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