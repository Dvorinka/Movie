'use strict';

// Fetch suggestions from TMDB API for mobile
async function fetchMobileSuggestions(query) {
    try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching data from TMDB API');
        const data = await response.json();
        const results = data.results.slice(0, 3); // Limit to 3 suggestions for mobile
        
        // Fetch additional details for each result
        const detailedResults = await Promise.all(results.map(async (result) => {
            if (result.media_type === 'movie' || result.media_type === 'tv') {
                try {
                    const detailsUrl = `https://api.themoviedb.org/3/${result.media_type}/${result.id}?api_key=${apiKey}&append_to_response=credits`;
                    const detailsResponse = await fetch(detailsUrl);
                    if (!detailsResponse.ok) return result;
                    
                    const details = await detailsResponse.json();
                    return {
                        ...result,
                        release_date: details.release_date || details.first_air_date,
                        cast: details.credits?.cast?.slice(0, 3) || []
                    };
                } catch (error) {
                    console.error('Failed to fetch details:', error);
                    return result;
                }
            } else {
                return result;
            }
        }));
        
        return detailedResults;
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
        resultsContainer.innerHTML = '<p style="padding: 10px; text-align: center;">No results found</p>';
        return;
    }

    suggestions.forEach(suggestion => {
        let name = suggestion.name || suggestion.title;
        let mediaType = suggestion.media_type;
        let id = suggestion.id;
        let posterPath = suggestion.poster_path || suggestion.profile_path;
        // Use different placeholder based on media type
        const placeholderImage = suggestion.media_type === 'person' ? 
            '../assets/images/placeholder_person.png' : 
            '../assets/images/placeholder_media.png';
        let imageUrl = posterPath ? `https://image.tmdb.org/t/p/w92${posterPath}` : placeholderImage;
        
        // Format year from release date
        let year = '';
        if (suggestion.release_date) {
            year = new Date(suggestion.release_date).getFullYear();
        }
        
        // Get actor names if available
        let actors = '';
        if (suggestion.cast && suggestion.cast.length > 0) {
            actors = suggestion.cast.map(actor => actor.name).slice(0, 2).join(', ');
            if (suggestion.cast.length > 2) {
                actors += '...';
            }
        }
        
        // Create different details based on media type
        let detailsHtml = '';
        if (mediaType === 'person') {
            detailsHtml = `<p class="result-type">Actor</p>`;
        } else {
            detailsHtml = `
                <p class="result-type">${year ? year : ''} ${actors ? '• ' + actors : ''}</p>
            `;
        }

        // Create result item with a clickable link
        let resultItem = document.createElement('a');
        resultItem.href = getDetailPageUrl(mediaType, id);
        resultItem.classList.add('result-item');

        resultItem.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="result-img">
            <div class="result-details">
                <p class="result-name">${name}</p>
                ${detailsHtml}
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

// Function to handle mobile search input with debounce
function handleMobileSearchInput() {
    const searchInput = document.getElementById('mobile-search-input');
    const resultsContainer = document.getElementById('mobile-results-container');
    
    // Debounce function to prevent too many API calls
    let debounceTimer;
    
    searchInput.addEventListener('input', function() {
        // Clear previous timer
        clearTimeout(debounceTimer);
        
        const query = searchInput.value.trim();
        
        if (query === '') {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Set a new timer
        debounceTimer = setTimeout(async function() {
            const suggestions = await fetchMobileSuggestions(query);
            displayMobileSuggestions(suggestions);
            
            // Show results container only if there are results
            if (suggestions.length > 0 || query !== '') {
                resultsContainer.style.display = 'block';
            } else {
                resultsContainer.style.display = 'none';
            }
        }, 300); // 300ms delay
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !resultsContainer.contains(event.target)) {
            resultsContainer.style.display = 'none';
        }
    });
    
    // Show results again when focusing on input if there's a query
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim() !== '' && resultsContainer.childElementCount > 0) {
            resultsContainer.style.display = 'block';
        }
    });
}

// Initialize mobile search functionality
document.addEventListener('DOMContentLoaded', function() {
    handleMobileSearchInput();
    
    // Ensure the search input is properly positioned
    const mobileSearchInput = document.getElementById('mobile-search-input');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
        });
    }
});
