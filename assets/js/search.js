'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('query');

    if (searchTerm) {
        const formattedSearchTerm = searchTerm.replace(/-/g, ' ');
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = formattedSearchTerm;
        }
        fetchData(formattedSearchTerm);
    } else {
        // Handle case when searchTerm is missing
        displayNoResults();
    }
});

function fetchData(query) {
    const apiUrl = `${baseApiUrl}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&sort_by=popularity.desc`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const results = data.results || []; // Ensure results array exists and handle empty responses
            if (results.length === 0) {
                displayNoResults();
                return;
            }

            // Filter out results without a poster path
            const filteredResults = results.filter(item => item.poster_path || item.profile_path);

            if (filteredResults.length === 0) {
                displayNoResults();
                return;
            }

            // Sort results by popularity in descending order
            filteredResults.sort((a, b) => b.popularity - a.popularity);

            displayResults(filteredResults); // Pass sorted and filtered results to displayResults function
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            displayNoResults();
        });
}


function displayResults(results) {
    const moviesContainer = document.getElementById('movies');
    const tvContainer = document.getElementById('tv');
    const peopleContainer = document.getElementById('people');

    moviesContainer.innerHTML = '';
    tvContainer.innerHTML = '';
    peopleContainer.innerHTML = '';

    if (results.length === 0) {
        displayNoResults();
        return;
    }

    results.forEach(item => {
        let title = '';
        let releaseDate = '';
        let description = '';
        let posterUrl = '';
        let url = '';

        switch (item.media_type) {
            case 'movie':
                title = item.title;
                releaseDate = formatDate(item.release_date);
                description = item.overview;
                posterUrl = `${imageBannerUrl}${item.poster_path}`;
                url = `movie-details.html?id=${item.id}`;

                const movieResultItem = createResultItem(title, releaseDate, description, posterUrl, url);
                moviesContainer.appendChild(movieResultItem);
                break;
            case 'tv':
                title = item.name;
                releaseDate = formatDate(item.first_air_date);
                description = item.overview;
                posterUrl = `${imageBannerUrl}${item.poster_path}`;
                url = `tv-details.html?id=${item.id}`;

                const tvResultItem = createResultItem(title, releaseDate, description, posterUrl, url);
                tvContainer.appendChild(tvResultItem);
                break;
            case 'person':
                title = item.name;
                url = `people-details.html?id=${item.id}`;

                const personResultItem = createResultItem(title, '', '', '', url); // No poster or details for people
                peopleContainer.appendChild(personResultItem);
                break;
            default:
                break;
        }
    });
}

function createResultItem(title, releaseDate, description, posterUrl, url) {
    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');
    resultItem.innerHTML = `
        <div class="result-poster">
            <a href="${url}" class="result-link"><img src="${posterUrl}" alt="${title} Poster"></a>
        </div>
        <div class="result-details">
            <a href="${url}" class="result-link"><h3 class="result-title">${title}</h3></a>
            ${releaseDate ? `<p class="result-release">${releaseDate}</p>` : ''}
            ${description ? `<p class="result-description">${description}</p>` : ''}
        </div>
    `;
    return resultItem;
}

function displayNoResults() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
}
