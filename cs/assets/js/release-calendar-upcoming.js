document.addEventListener('DOMContentLoaded', () => {
    fetchMoviesForMonth();
});

// Fetch movies for the current month
async function fetchMoviesForMonth() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // Current month (0-11)

        // Calculate the start and end dates for the current month
        const startDate = new Date(year, month, 1); // First day of the current month
        const endDate = new Date(year, month + 1, 0); // Last day of the current month

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        // Fetch movies within the calculated date range
        const movies = await fetchMoviesInDateRange(startDateStr, endDateStr);
        displayCalendar(movies, startDate, endDate);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
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
function displayCalendar(movies, startDate, endDate) {
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