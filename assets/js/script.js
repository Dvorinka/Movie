'use strict';

/**
 * Navbar variables
 */
const navOpenBtn = document.querySelector("[data-menu-open-btn]");
const navCloseBtn = document.querySelector("[data-menu-close-btn]");
const navbar = document.querySelector("[data-navbar]");
const overlay = document.querySelector("[data-overlay]");

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
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", () => {
    window.scrollY >= 10 ? header.classList.add("active") : header.classList.remove("active");
});

/**
 * Go top button
 */
const goTopBtn = document.querySelector("[data-go-top]");

function toggleSearchInput() {
  const searchInput = document.getElementById('search-input');
  const defaultResultsContainer = document.getElementById('default-results');
  const searchBtnIcon = document.querySelector('.search-btn ion-icon');

  // Toggle visibility using classes
  searchInput.classList.toggle('visible');
  defaultResultsContainer.classList.toggle('visible');

  // Toggle search button icon
  if (searchInput.classList.contains('visible')) {
      searchBtnIcon.setAttribute('name', 'close-outline');
      searchInput.style.display = 'block';
      searchInput.focus();
      
      // Show suggestions if search input is visible
      showSuggestions();
  } else {
      searchBtnIcon.setAttribute('name', 'search-outline');
      searchInput.style.display = 'none'; // Hide search input
      
      // Clear previous results
      defaultResultsContainer.innerHTML = '';
      defaultResultsContainer.style.display = 'block'; // Hide results container
  }
}

async function fetchSuggestions(query) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.slice(0, 5); // Limit to 5 suggestions
}

async function showSuggestions() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm) {
        const suggestions = await fetchSuggestions(searchTerm);
        displaySuggestions(suggestions);
    } else {
        const defaultResultsContainer = document.getElementById('default-results');
        defaultResultsContainer.innerHTML = ''; // Clear suggestions if search term is empty
    }
}

function displaySuggestions(suggestions) {
    const defaultResultsContainer = document.getElementById('default-results');

    Promise.all(suggestions.map(async suggestion => {
        let name = suggestion.name || suggestion.title;
        let mediaType = suggestion.media_type;
        let posterPath = suggestion.poster_path || suggestion.profile_path;

        // Use the appropriate default image based on the media type
        let defaultImageUrl = mediaType === 'person' ? 'assets/images/person.svg' : 'assets/images/movie-tv.svg';
        let posterUrl = posterPath ? `https://image.tmdb.org/t/p/w92${posterPath}` : defaultImageUrl;

        let details = '';
        let actors = '';

        if (mediaType === 'movie' || mediaType === 'tv') {
            let releaseYear = suggestion.release_date ? new Date(suggestion.release_date).getFullYear() : 'N/A';
            if (mediaType === 'tv') {
                let firstAirYear = suggestion.first_air_date ? new Date(suggestion.first_air_date).getFullYear() : 'N/A';
                let lastAirYear = suggestion.last_air_date ? new Date(suggestion.last_air_date).getFullYear() : 'Present';
                details = `${firstAirYear} - ${lastAirYear}`;
            } else {
                details = `${releaseYear}`;
            }

            // Fetch credits
            let creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${suggestion.id}/credits?api_key=${apiKey}`;
            let creditsResponse = await fetch(creditsUrl);
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
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', showSuggestions);

    // Add event listener for Enter key press
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            redirectToSearchPage();
        }
    });

    const searchInputs = document.querySelectorAll('.input-main');
  
    searchInputs.forEach(searchInput => {
        searchInput.addEventListener('input', function() {
            if (searchInput.value.trim() !== "") {
                searchInput.classList.add('active');
            } else {
                searchInput.classList.remove('active');
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
    // Redirect to search.html with search term from input
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm) {
        const formattedSearchTerm = searchTerm.replace(/ /g, '-'); // Replace spaces with dashes
        const searchUrl = `search.html?query=${encodeURIComponent(formattedSearchTerm)}`;
        window.location.href = searchUrl;
    }
}

// Close search input and clear results when clicking outside of it
document.addEventListener('click', function(e) {
    const searchInput = document.getElementById('search-input');
    const defaultResultsContainer = document.getElementById('default-results');
    const searchBtn = document.querySelector('.search-btn');
    const isClickInsideSearch = searchInput.contains(e.target);
    const isClickInsideResults = defaultResultsContainer.contains(e.target);
    const isClickOnSearchBtn = searchBtn.contains(e.target); // Check if click is on search button or its icon

    if (!isClickInsideSearch && !isClickInsideResults && !isClickOnSearchBtn) {
        searchInput.classList.remove('visible');
        defaultResultsContainer.classList.remove('visible');
        searchInput.style.display = 'none';
        defaultResultsContainer.style.display = 'none';
        document.querySelector('.search-btn ion-icon').setAttribute('name', 'search-outline');
        searchInput.value = ''; // Clear input value
    }
});

// Close search input and clear results when scrolling
window.addEventListener("scroll", () => {
    const searchInput = document.getElementById('search-input');
    const defaultResultsContainer = document.getElementById('default-results');
    searchInput.classList.remove('visible');
    defaultResultsContainer.classList.remove('visible');
    searchInput.style.display = 'none';
    defaultResultsContainer.style.display = 'none';
    document.querySelector('.search-btn ion-icon').setAttribute('name', 'search-outline');
    searchInput.value = ''; // Clear input value
});
