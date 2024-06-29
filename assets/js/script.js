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

  if (searchInput.style.display === 'none' || searchInput.style.display === '') {
      // Show search input
      searchInput.style.display = 'block';
      searchInput.focus();
      // Change search button icon to close-outline
      searchBtnIcon.setAttribute('name', 'close-outline');
      // Clear results when showing the input
      defaultResultsContainer.style.display = 'block';
      defaultResultsContainer.innerHTML = '';
  } else {
      // Hide search input
      searchInput.style.display = 'none';
      // Change search button icon to search-outline
      searchBtnIcon.setAttribute('name', 'search-outline');
      // Clear results when hiding the input
      defaultResultsContainer.style.display = 'none';
      defaultResultsContainer.innerHTML = '';
  }
}


function performSearch() {
  const searchTerm = document.getElementById('search-input').value.trim(); // Trim to remove any leading or trailing whitespace

  if (searchTerm) {
      const movieUrl = `search.html?type=movie&query=${encodeURIComponent(searchTerm)}`;
      const tvUrl = `search.html?type=tv&query=${encodeURIComponent(searchTerm)}`;
      const peopleUrl = `search.html?type=people&query=${encodeURIComponent(searchTerm)}`;

      const defaultResultsContainer = document.getElementById('default-results');
      defaultResultsContainer.innerHTML = `
          <div class="result-item"><a href="${movieUrl}">${searchTerm} in Movies</a></div>
          <div class="result-item"><a href="${tvUrl}">${searchTerm} in TV Shows</a></div>
          <div class="result-item"><a href="${peopleUrl}">${searchTerm} in People</a></div>
      `;
  } else {
      const defaultResultsContainer = document.getElementById('default-results');
      defaultResultsContainer.innerHTML = ''; // Clear results if search term is empty
  }
}

document.getElementById('search-input').addEventListener('input', performSearch);


window.addEventListener("scroll", () => {
  if (window.scrollY >= 500 && window.scrollY <= 3800) {
    goTopBtn.classList.add("active");
  } else {
    goTopBtn.classList.remove("active");
  }
});
