document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const searchTerm = params.get('query');

    if (type && searchTerm) {
        // Perform search based on type and searchTerm
        fetchData(type, searchTerm);
    } else {
        // Handle case when type or searchTerm is missing
        displayNoResults();
    }
});

function fetchData(type, query) {
    let apiUrl = '';
    switch (type) {
        case 'movie':
            apiUrl = `${baseApiUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
            break;
        case 'tv':
            apiUrl = `${baseApiUrl}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
            break;
        case 'people':
            apiUrl = `${baseApiUrl}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
            break;
        default:
            displayNoResults();
            return;
    }

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayResults(data.results, type); // Pass results and type to displayResults function
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            displayNoResults();
        });
}

function displayResults(results, type) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

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

        switch (type) {
            case 'movie':
                title = item.title;
                releaseDate = formatDate(item.release_date);
                description = item.overview;
                posterUrl = item.poster_path ? `${imageBannerUrl}${item.poster_path}` : 'assets/images/placeholder-image.png'; // Replace 'placeholder.jpg' with your default image
                url = `movie-details.html?id=${item.id}`;
                break;
            case 'tv':
                title = item.name;
                releaseDate = formatDate(item.first_air_date);
                description = item.overview;
                posterUrl = item.poster_path ? `${imageBannerUrl}${item.poster_path}` : 'assets/images/placeholder-image.png'; // Replace 'placeholder.jpg' with your default image
                url = `tv-details.html?id=${item.id}`;
                break;
            case 'people':
                title = item.name;
                url = `people-details.html?id=${item.id}`;
                break;
        }

        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.innerHTML = `
                <div class="result-poster">
                    <a href="${url}" class="result-link"><img src="${posterUrl}" alt="${title} Poster"></a>
                </div>
                <div class="result-details">
                    <a href="${url}" class="result-link"><h3 class="result-title">${title}</h3>            </a>
                    <p class="result-release">${releaseDate}</p>
                    <p class="result-description">${description}</p>
                </div>
        `;
        resultsContainer.appendChild(resultItem);
    });
}

function displayNoResults() {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '<p>No results found.</p>';
}

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
}
