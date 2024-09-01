document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
});

let currentMonth = new Date().getMonth(); // Current month (0-11)
let currentYear = new Date().getFullYear(); // Current year

// Initialize the calendar
function initializeCalendar() {
    populateMonthSelect();
    populateYearSelect();
    updateCalendar();

    document.getElementById('prev-month').addEventListener('click', () => {
        changeMonth(-1);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        changeMonth(1);
    });

    document.getElementById('month-select').addEventListener('change', (event) => {
        currentMonth = parseInt(event.target.value, 10);
        updateCalendar();
    });

    document.getElementById('year-select').addEventListener('change', (event) => {
        currentYear = parseInt(event.target.value, 10);
        updateCalendar();
    });
}

// Populate the month dropdown
function populateMonthSelect() {
    const monthSelect = document.getElementById('month-select');
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = month;
        monthSelect.appendChild(option);
    });

    monthSelect.value = currentMonth;
}

// Populate the year dropdown (with a range of years, e.g., 1900-2100)
function populateYearSelect() {
    const yearSelect = document.getElementById('year-select');
    const startYear = 1900;
    const endYear = new Date().getFullYear(); // You can set this to a future year if needed

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
}

// Update the calendar based on the current month and year
function updateCalendar() {
    const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
    const endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of the current month

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    fetchMoviesForMonth(startDateStr, endDateStr);
}

// Fetch movies for the given date range and display them on the calendar
async function fetchMoviesForMonth(startDateStr, endDateStr) {
    try {
        const movies = await fetchMoviesInDateRange(startDateStr, endDateStr);
        displayCalendar(movies, startDateStr, endDateStr);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Change the month by a certain number of months (negative for back, positive for forward)
function changeMonth(months) {
    currentMonth += months;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    document.getElementById('month-select').value = currentMonth;
    document.getElementById('year-select').value = currentYear;

    updateCalendar();
}

// Fetch movies within a specific date range
async function fetchMoviesInDateRange(startDate, endDate) {
    const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&region=US&release_date.gte=${startDate}&release_date.lte=${endDate}`);
    const data = await response.json();
    return data.results;
}

// Helper function to format date as 'YYYY-MM-DD'
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Display movies in a calendar format
function displayCalendar(movies, startDateStr, endDateStr) {
    const calendarDiv = document.getElementById('calendar');

    // Create a dictionary to map dates to their movies
    const moviesByDate = {};

    // Populate the dictionary with movies grouped by release date
    movies.forEach(movie => {
        const releaseDate = movie.release_date;
        if (releaseDate) { // Ensure release_date is not null or undefined
            const formattedDate = releaseDate; // We now rely directly on the release_date from the API, which is in 'YYYY-MM-DD' format
            if (!moviesByDate[formattedDate]) {
                moviesByDate[formattedDate] = [];
            }
            moviesByDate[formattedDate].push(movie);
        }
    });

    // Create the calendar grid
    let daysHTML = '';
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = formatDate(date); // Use the formatted date
        const moviesForDate = moviesByDate[dateString] || []; // Get movies for the date, or an empty array if none

        daysHTML += `
            <div class="calendar-day">
                <div class="date-header">${date.getDate()}</div>
                ${moviesForDate.length > 0 ? moviesForDate.map(movie => `
                    <div class="movie-item">
                        <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank">
                            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="movie-poster" />
                            <div class="movie-title">${movie.title}</div>
                        </a>
                    </div>
                `).join('') : '<div class="no-movie">No Releases</div>'}
            </div>
        `;
    }

    calendarDiv.innerHTML = `
        <div class="calendar-grid">
            ${daysHTML}
        </div>
    `;
}
