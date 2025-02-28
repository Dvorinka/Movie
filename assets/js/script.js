'use strict';

/**
 * Navbar variables
 */
const navOpenBtn = document.querySelector("[data-menu-open-btn]");
const navCloseBtn = document.querySelector("[data-menu-close-btn]");
const navbar = document.querySelector("[data-navbar]");
const overlay = document.querySelector("[data-overlay]");
const header = document.querySelector("[data-header]");

const navElemArr = [navOpenBtn, navCloseBtn, overlay];

navElemArr.forEach(elem => {
    elem.addEventListener("click", () => {
        navbar.classList.toggle("active");
        overlay.classList.toggle("active");
        header.classList.toggle("active");

        if (navbar.classList.contains("active")) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    });
});

/**
 * Header sticky
 */
window.addEventListener("scroll", () => {
    window.scrollY >= 10 ? header.classList.add("active") : header.classList.remove("active");
});

/**
 * Go top button
 */
const goTopBtn = document.querySelector("[data-go-top]");

/**
 * Toggle search input
 */
function toggleSearchInput() {
    const searchInput = document.getElementById('search-input');
    const defaultResultsContainer = document.getElementById('default-results');
    const searchBtnIcon = document.querySelector('.search-btn ion-icon');

    if (searchInput && defaultResultsContainer && searchBtnIcon) {
        searchInput.classList.toggle('visible');
        defaultResultsContainer.classList.toggle('visible');

        if (searchInput.classList.contains('visible')) {
            searchBtnIcon.setAttribute('name', 'close-outline');
            searchInput.style.display = 'block';
            searchInput.focus();
            showSuggestions();
        } else {
            searchBtnIcon.setAttribute('name', 'search-outline');
            searchInput.style.display = 'none';
            defaultResultsContainer.innerHTML = '';
            defaultResultsContainer.style.display = 'block';
        }
    } else {
        console.error('One or more required elements are missing.');
    }
}

/**
 * Fetch suggestions from API
 */
async function fetchSuggestions(query) {
    try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
        console.log('Fetching suggestions from:', url); // Debugging line
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging line
        return data.results.slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

/**
 * Show suggestions in the results container
 */
async function showSuggestions() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const searchTerm = searchInput.value.trim();
        console.log('Search input value:', searchTerm); // Debugging line
        if (searchTerm) {
            const suggestions = await fetchSuggestions(searchTerm);
            displaySuggestions(suggestions);
        } else {
            const defaultResultsContainer = document.getElementById('default-results');
            if (defaultResultsContainer) {
                defaultResultsContainer.innerHTML = ''; // Clear suggestions if search term is empty
            }
        }
    } else {
        console.error('Search input element not found.');
    }
}

/**
 * Display suggestions in the results container
 */
function displaySuggestions(suggestions) {
    const defaultResultsContainer = document.getElementById('default-results');
    if (defaultResultsContainer) {
        Promise.all(suggestions.map(async suggestion => {
            let name = suggestion.name || suggestion.title;
            let mediaType = suggestion.media_type;
            let posterPath = suggestion.poster_path || suggestion.profile_path;
            let defaultImageUrl = mediaType === 'person' ? 'assets/images/person.svg' : 'assets/images/movie-tv.svg';
            let posterUrl = posterPath ? `https://image.tmdb.org/t/p/w92${posterPath}` : defaultImageUrl;
            let details = '';
            let actors = '';

            if (mediaType === 'movie' || mediaType === 'tv') {
                let releaseYear = suggestion.release_date ? new Date(suggestion.release_date).getFullYear() : 'N/A';
                if (mediaType === 'tv') {
                    let firstAirYear = suggestion.first_air_date ? new Date(suggestion.first_air_date).getFullYear() : 'N/A';
                    let lastAirYear = suggestion.last_air_date ? new Date(suggestion.last_air_date).getFullYear() : null;
                    let status = suggestion.status || '';

                    if (lastAirYear === null || status === 'Returning Series' || status === 'In Production') {
                        // Make an additional request to get the full TV show details
                        let tvShowDetailsUrl = `https://api.themoviedb.org/3/tv/${suggestion.id}?api_key=${apiKey}`;
                        console.log('Fetching TV show details from:', tvShowDetailsUrl); // Debugging line
                        let tvShowDetailsResponse = await fetch(tvShowDetailsUrl);
                        if (!tvShowDetailsResponse.ok) throw new Error('Network response was not ok');
                        let tvShowDetailsData = await tvShowDetailsResponse.json();
                        lastAirYear = tvShowDetailsData.last_air_date ? new Date(tvShowDetailsData.last_air_date).getFullYear() : 'Present';
                        status = tvShowDetailsData.status || '';
                    }

                    if (status === 'Returning Series' || status === 'In Production') {
                        details = `${firstAirYear} - Ongoing`;
                    } else {
                        details = `${firstAirYear} - ${lastAirYear}`;
                    }
                } else {
                    details = `${releaseYear}`;
                }

                let creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${suggestion.id}/credits?api_key=${apiKey}`;
                console.log('Fetching credits from:', creditsUrl); // Debugging line
                let creditsResponse = await fetch(creditsUrl);
                if (!creditsResponse.ok) throw new Error('Network response was not ok');
                let creditsData = await creditsResponse.json();
                let cast = creditsData.cast.slice(0, 2).map(actor => actor.name).join(', ');
                actors = cast ? `${cast}` : '<br>'; // Add <br> only if no actors
            } else if (mediaType === 'person') {
                let knownFor = suggestion.known_for_department || 'N/A';
                let lastRole = suggestion.known_for && suggestion.known_for.length > 0 ? suggestion.known_for[0].title || suggestion.known_for[0].name : 'N/A';
                details = `${knownFor}, ${lastRole}`;
                actors = '<br>'; // Add empty line for people
            }

            let url = '';
            switch (mediaType) {
                case 'movie':
                    url = `movie-details.html?id=${suggestion.id}`;
                    break;
                case 'tv':
                    url = `tv-details.html?id=${suggestion.id}`;
                    break;
                case 'person':
                    url = `people-details.html?id=${suggestion.id}`;
                    break;
                default:
                    console.error(`Unsupported media type: ${mediaType}`);
                    return '';
            }

            return `
            <a href="${url}" class="result-item">
                <div>
                    <img src="${posterUrl}" alt="${name}" style="width: 48px; height: 71px; margin-right: 10px;">
                </div>
                <div class="name">${name}</div>
                <div class="release">${details}</div>
                <div class="actors">${actors}</div>
            </a>`;
        })).then(results => {
            defaultResultsContainer.innerHTML = results.join('');
        }).catch(error => {
            console.error('Error displaying suggestions:', error);
        });
    } else {
        console.error('Results container not found.');
    }
}
/**
 * Event listeners and initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.querySelector('.input-main-mobile');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log('Input event fired on #search-input');
            showSuggestions();
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed in #search-input');
                redirectToSearchPage();
            }
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', () => {
            console.log('Input event fired on .input-main-mobile');
            showSuggestions();
        });
        mobileSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed in .input-main-mobile');
                redirectToSearchPage();
            }
        });
    }

    const searchInputs = document.querySelectorAll('.input-main');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            console.log('Input event fired on .input-main');
            if (input.value.trim() !== "") {
                input.classList.add('active');
            } else {
                input.classList.remove('active');
            }
        });
    });
});

function selectSuggestion(name, mediaType, id) {
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
            console.error(`Unsupported media type: ${mediaType}`);
            return;
    }
    window.location.href = url;
}

function redirectToSearchPage() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm) {
        const formattedSearchTerm = searchTerm.replace(/ /g, '-'); // Replace spaces with dashes
        const searchUrl = `search.html?query=${encodeURIComponent(formattedSearchTerm)}`;
        window.location.href = searchUrl;
    } else {
        console.error('Search term is empty.');
    }
}

// Close search input and clear results when clicking outside of it
document.addEventListener('click', function(e) {
    const searchInput = document.getElementById('search-input');
    const defaultResultsContainer = document.getElementById('default-results');
    const searchBtn = document.querySelector('.search-btn');
    const isClickInsideSearch = searchInput && searchInput.contains(e.target);
    const isClickInsideResults = defaultResultsContainer && defaultResultsContainer.contains(e.target);
    const isClickOnSearchBtn = searchBtn && searchBtn.contains(e.target);

    if (!isClickInsideSearch && !isClickInsideResults && !isClickOnSearchBtn) {
        if (searchInput && defaultResultsContainer) {
            searchInput.classList.remove('visible');
            defaultResultsContainer.classList.remove('visible');
            searchInput.style.display = 'none';
            defaultResultsContainer.style.display = 'none';
            document.querySelector('.search-btn ion-icon').setAttribute('name', 'search-outline');
            searchInput.value = ''; // Clear input value
        }
    }
});

// Close search input and clear results when scrolling
window.addEventListener("scroll", () => {
    const searchInput = document.getElementById('search-input');
    const defaultResultsContainer = document.getElementById('default-results');
    if (searchInput && defaultResultsContainer) {
        searchInput.classList.remove('visible');
        defaultResultsContainer.classList.remove('visible');
        searchInput.style.display = 'none';
        defaultResultsContainer.style.display = 'none';
        document.querySelector('.search-btn ion-icon').setAttribute('name', 'search-outline');
        searchInput.value = ''; // Clear input value
    }
});
