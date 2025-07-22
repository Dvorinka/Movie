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

}

// Fetch movies and TV shows within a specific date range
async function fetchMoviesInDateRange(startDate, endDate) {
    try {
        // Fetch movies
        const moviesResponse = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&region=US&release_date.gte=${startDate}&release_date.lte=${endDate}`);
        const moviesData = await moviesResponse.json();
        const movies = moviesData.results
            .filter(movie => movie.poster_path) // Only include movies with poster images
            .map(movie => ({
                ...movie,
                type: 'movie',
                title: movie.title || 'Untitled Movie',
                name: movie.title, // For consistency with TV shows
                display_title: movie.title || 'Untitled Movie',
                detail_url: `movie-details.html?id=${movie.id}`
            }));

        // Fetch TV shows
        const tvResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}`);
        const tvData = await tvResponse.json();
        const tvShows = tvData.results
            .filter(show => show.poster_path) // Only include shows with poster images
            .map(show => ({
                ...show,
                type: 'tv',
                title: show.name, // For consistency with movies
                name: show.name || 'Untitled TV Show',
                display_title: show.name || 'Untitled TV Show',
                release_date: show.first_air_date,
                detail_url: `tv-details.html?id=${show.id}`
            }));

        // Combine and sort by date
        const allItems = [...movies, ...tvShows];
        console.log('Fetched items with images:', allItems); // Debug log
        
        return allItems.sort((a, b) => 
            new Date(a.release_date || '1970-01-01') - new Date(b.release_date || '1970-01-01')
        );
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// Helper function to format date as 'YYYY-MM-DD'
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Display movies and TV shows in a calendar format
function displayCalendar(items, startDateStr, endDateStr) {
    const calendarDiv = document.getElementById('calendar');

    // Create a dictionary to map dates to their items
    const itemsByDate = {};

    // Populate the dictionary with items grouped by release date
    // Only include items that have a poster image
    items.forEach(item => {
        if (!item.poster_path) return; // Skip items without poster images
        
        const releaseDate = item.release_date || item.first_air_date;
        if (releaseDate) {
            const formattedDate = releaseDate.split('T')[0]; // Ensure we only get YYYY-MM-DD
            if (!itemsByDate[formattedDate]) {
                itemsByDate[formattedDate] = [];
            }
            itemsByDate[formattedDate].push(item);
        }
    });

    // Create the calendar grid
    let daysHTML = '';
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = formatDate(date);
        const itemsForDate = itemsByDate[dateString] || [];
        const validItems = itemsForDate.filter(item => item.poster_path);
        const hasValidItems = validItems.length > 0;
        
        if (!hasValidItems) continue; // Skip dates with no valid items
        
        const firstItem = validItems[0];
        
        // Add type indicator and appropriate styling
        const typeBadge = `<span class="type-badge ${firstItem.type}">${firstItem.type.toUpperCase()}</span>`;
            
        // Get the first item's display title, defaulting to 'Untitled' if not available
        const displayTitle = firstItem.display_title || firstItem.name || 'Untitled';
        
        // Determine if this is a TV show to apply specific styling
        const isTvShow = firstItem.type === 'tv';
        const calendarDayClass = `calendar-day ${isTvShow ? 'tv-show' : ''} has-movie`;
            
        daysHTML += `
            <div class="${calendarDayClass}" onclick="showMoreDetails('${dateString}')">
                <div class="date-header">
                    ${date.getDate()}
                    ${typeBadge}
                </div>
                <div class="item-card">
                    <a href="${firstItem.detail_url}">
                        <img src="https://image.tmdb.org/t/p/w500${firstItem.poster_path}" 
                             alt="${displayTitle}" 
                             class="item-poster" 
                             onerror="this.onerror=null; this.style.display='none'" />
                        <div class="item-title">${displayTitle}</div>
                    </a>
                </div>
                ${validItems.length > 1 ? 
                    `<div class="more-items">+${validItems.length - 1} more</div>` : ''}
            </div>
        `;
    }

    calendarDiv.innerHTML = `
        <div class="calendar-grid">
            ${daysHTML}
        </div>
    `;
}

// Show more details for a specific date
function showMoreDetails(dateString) {
    const itemsForDate = (itemsByDate[dateString] || []).filter(item => item.poster_path);
    if (itemsForDate.length === 0) return;
    
    const modalContent = itemsForDate.map(item => {
        const title = item.display_title || item.title || item.name || 'Untitled';
        const detailUrl = item.type === 'tv' 
            ? `tv-details.html?id=${item.id}` 
            : `movie-details.html?id=${item.id}`;
            
        // We know poster_path exists because we filtered for it
        const imageHtml = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}" 
                             alt="${title}" 
                             class="item-poster"
                             onerror="this.style.display='none'" />`;
                
        return `
            <div class="item-card">
                <span class="type-badge ${item.type}">${item.type.toUpperCase()}</span>
                <a href="${detailUrl}">
                    ${imageHtml}
                    <div class="item-title">${title}</div>
                </a>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Releases on ${new Date(dateString).toDateString()}</h3>
            <span class="close" onclick="closeModal()">&times;</span>
            <div class="items-grid">
                ${modalContent}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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

// Close the modal
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}