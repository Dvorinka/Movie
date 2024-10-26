'use strict';


// Fetch suggestions from TMDB API for mobile
async function fetchMobileSuggestions(query) {
    try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching data from TMDB API');
        const data = await response.json();
        return data.results.slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        return [];
    }
}

// Display the fetched suggestions in the mobile results container
function displayMobileSuggestions(suggestions) {
    const resultsContainer = document.getElementById('mobile-results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (suggestions.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        return;
    }

    suggestions.forEach(suggestion => {
        let name = suggestion.name || suggestion.title;
        let mediaType = suggestion.media_type;
        let id = suggestion.id; // Get the ID of the suggestion (movie, tv, or person)
        let posterPath = suggestion.poster_path || suggestion.profile_path;
        let imageUrl = posterPath ? `https://image.tmdb.org/t/p/w92${posterPath}` : 'assets/images/default-poster.jpg';

        // Create result item with a clickable link
        let resultItem = document.createElement('a');
        resultItem.href = getDetailPageUrl(mediaType, id); // Set the correct URL based on media type
        resultItem.classList.add('result-item');

        resultItem.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="result-img">
            <div class="result-details">
                <p class="result-name">${name}</p>
                <p class="result-type">${mediaType}</p>
            </div>
        `;
        resultsContainer.appendChild(resultItem);
    });
}

// Function to generate the URL for movie, tv show, or person
function getDetailPageUrl(mediaType, id) {
    let url = '';
    switch (mediaType) {
        case 'movie':
            url = `movie-details.html?id=${id}`;
            break;
        case 'tv':
            url = `tv-details.html?id=${id}`;
            break;
        case 'person':
            url = `people-details.html?id=${id}`;
            break;
        default:
            console.error('Unsupported media type:', mediaType);
            break;
    }
    return url;
}

// Function to handle mobile search input
function handleMobileSearchInput() {
    const searchInput = document.getElementById('mobile-search-input');
    searchInput.addEventListener('input', async function () {
        const query = searchInput.value.trim();
        if (query) {
            const suggestions = await fetchMobileSuggestions(query);
            displayMobileSuggestions(suggestions);
        } else {
            document.getElementById('mobile-results-container').innerHTML = ''; // Clear results if input is empty
        }
    });
}

// Initialize mobile search functionality
document.addEventListener('DOMContentLoaded', function () {
    handleMobileSearchInput();
});
