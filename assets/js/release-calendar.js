document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
});

let currentMonth = new Date().getMonth(); // Current month (0-11)
let currentYear = new Date().getFullYear(); // Current year
const trackedTvShowIds = [];

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
    showPreloader(true); // Show preloader when starting to fetch
    try {
        const movies = await fetchMoviesInDateRange(startDateStr, endDateStr);
        if (!movies || movies.length === 0) {
            console.log('No movies found for the selected period');
            document.getElementById('calendar').innerHTML = '<p style="text-align: center; padding: 20px;">No releases found for this period</p>';
        } else {
            displayCalendar(movies, startDateStr, endDateStr);
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        document.getElementById('calendar').innerHTML = '<p style="text-align: center; padding: 20px; color: #ff6b6b;">Error loading calendar. Please try again later.</p>';
    } finally {
        // Always hide the preloader when done, whether successful or not
        showPreloader(false);
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
        // Determine if we should filter by vote count (for current/previous months)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const startDateObj = new Date(startDate);
        const isCurrentOrPastMonth = 
            (startDateObj.getFullYear() === currentYear && startDateObj.getMonth() <= currentMonth) ||
            startDateObj.getFullYear() < currentYear;
            
        // Build the movie API URL with conditional vote count
        let movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&region=US&release_date.gte=${startDate}&release_date.lte=${endDate}`;
        if (isCurrentOrPastMonth) {
            movieUrl += '&vote_count.gte=50'; // Only include movies with at least 50 votes for current/past months
        }
        
        // Fetch movies
        const moviesResponse = await fetch(movieUrl);
        const moviesData = await moviesResponse.json();
        const movies = moviesData.results
            .filter(movie => movie.poster_path) // Only include movies with poster images
            .map(movie => ({
                ...movie,
                type: 'movie',
                title: movie.title || 'Untitled Movie',
                name: movie.title, // For consistency with TV shows
                display_title: movie.title || 'Untitled Movie',
                detail_url: `movie-details.html?id=${movie.id}`,
                is_new_season: false // Flag to identify new seasons
            }));

        // Fetch TV shows (new series)
        const tvResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}`);
        const tvData = await tvResponse.json();
        let tvShows = tvData.results
            .filter(show => show.poster_path) // Only include shows with poster images
            .map(show => ({
                ...show,
                type: 'tv',
                title: show.name, // For consistency with movies
                name: show.name || 'Untitled TV Show',
                display_title: show.name || 'Untitled TV Show',
                release_date: show.first_air_date,
                detail_url: `tv-details.html?id=${show.id}`,
                is_new_season: false // This is a new show, not a new season
            }));

        // Fetch upcoming seasons of existing shows
        const upcomingSeasonsResponse = await fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=1`);
        const upcomingSeasonsData = await upcomingSeasonsResponse.json();
        
        // Fetch popular TV shows (for broader episode coverage)
        const popularResponse = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=1`);
        const popularData = await popularResponse.json();
        const popularShows = Array.isArray(popularData.results) ? popularData.results.filter(show => show.poster_path) : [];
        
        // Filter to only include shows with new seasons in our date range
        const upcomingSeasons = [];
        for (const show of upcomingSeasonsData.results) {
            try {
                // Get the show details to check the next episode to air
                const showDetailsResponse = await fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${apiKey}&language=en-US&append_to_response=next_episode_to_air`);
                const showDetails = await showDetailsResponse.json();
                
                // Check if the next episode is in our date range and it's a new season
                if (showDetails.next_episode_to_air && 
                    showDetails.next_episode_to_air.air_date >= startDate && 
                    showDetails.next_episode_to_air.air_date <= endDate &&
                    showDetails.next_episode_to_air.season_number > 1) {
                    
                    upcomingSeasons.push({
                        ...show,
                        type: 'tv',
                        title: `${show.name} (Season ${showDetails.next_episode_to_air.season_number})`,
                        name: show.name,
                        display_title: `${show.name} (Season ${showDetails.next_episode_to_air.season_number})`,
                        release_date: showDetails.next_episode_to_air.air_date,
                        detail_url: `tv-details.html?id=${show.id}&season=${showDetails.next_episode_to_air.season_number}`,
                        is_new_season: true,
                        poster_path: show.poster_path,
                        first_air_date: showDetails.next_episode_to_air.air_date
                    });
                }
            } catch (error) {
                console.error(`Error fetching details for show ${show.id}:`, error);
            }
        }

        // Build per-episode entries for candidate shows within the selected date range
        const episodeItems = [];
        try {
            const candidateIds = new Set();
            (upcomingSeasonsData.results || []).forEach(s => candidateIds.add(s.id));
            (tvShows || []).forEach(s => candidateIds.add(s.id));
            (popularShows || []).forEach(s => candidateIds.add(s.id));
            (trackedTvShowIds || []).forEach(id => candidateIds.add(id));

            for (const id of candidateIds) {
                try {
                    const detailsRes = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US&append_to_response=next_episode_to_air`);
                    const details = await detailsRes.json();
                    const seasonNumber = (details && details.next_episode_to_air && details.next_episode_to_air.season_number) ||
                        (Array.isArray(details?.seasons) && details.seasons.filter(se => se.season_number > 0).sort((a,b)=>b.season_number-a.season_number)[0]?.season_number) || null;
                    if (!seasonNumber) continue;

                    const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${apiKey}&language=en-US`);
                    const season = await seasonRes.json();
                    const episodes = Array.isArray(season?.episodes) ? season.episodes : [];

                    for (const ep of episodes) {
                        const air = ep.air_date;
                        if (!air) continue;
                        if (air >= startDate && air <= endDate) {
                            episodeItems.push({
                                id: details.id,
                                type: 'tv',
                                title: `${details.name} S${String(seasonNumber).padStart(2,'0')}E${String(ep.episode_number || 0).padStart(2,'0')}`,
                                name: `${details.name} S${String(seasonNumber).padStart(2,'0')}E${String(ep.episode_number || 0).padStart(2,'0')}`,
                                display_title: `${details.name} S${String(seasonNumber).padStart(2,'0')}E${String(ep.episode_number || 0).padStart(2,'0')}`,
                                overview: ep.overview,
                                release_date: air,
                                first_air_date: air,
                                poster_path: ep.still_path || details.poster_path,
                                backdrop_path: details.backdrop_path,
                                detail_url: `tv-details.html?id=${details.id}`,
                                is_new_season: ep.episode_number === 1
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching episodes for show ${id}:`, err);
                }
            }
        } catch (err) {
            console.error('Error building episode items:', err);
        }

        // Combine all items (movies, new TV shows, and new seasons)
        const allItems = [...movies, ...tvShows, ...upcomingSeasons, ...episodeItems];
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

// Function to show/hide preloader
function showPreloader(show = true) {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = show ? 'flex' : 'none';
    }
}

// Display movies and TV shows in a calendar format
function displayCalendar(items, startDateStr, endDateStr) {
    showPreloader(true); // Show preloader when starting to load
    const calendarDiv = document.getElementById('calendar');

    // Create a dictionary to map dates to their items
    const itemsByDate = {};

    // First, filter out any items without poster paths or release dates
    const validItems = items.filter(item => {
        if (!item.poster_path) return false;
        const releaseDate = item.release_date || item.first_air_date;
        if (!releaseDate) return false;
        
        // Additional validation for TV shows
        if (item.type === 'tv' && !item.first_air_date) return false;
        
        return true;
    });
    
    // Now group the valid items by date
    validItems.forEach(item => {
        const releaseDate = item.release_date || item.first_air_date;
        if (!releaseDate) return; // Skip items without a valid release date
        
        const formattedDate = releaseDate.split('T')[0]; // Ensure we only get YYYY-MM-DD
        if (!itemsByDate[formattedDate]) {
            itemsByDate[formattedDate] = [];
        }
        itemsByDate[formattedDate].push(item);
    });
    
    // Store the filtered items in a way that's accessible to showMoreDetails
    window.filteredItemsByDate = {};
    
    // Create a deep copy of the filtered items to avoid reference issues
    Object.keys(itemsByDate).forEach(date => {
        window.filteredItemsByDate[date] = [...itemsByDate[date]];
    });

    // Create the calendar grid
    let daysHTML = '';
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = formatDate(date);
        const validItems = window.filteredItemsByDate[dateString] || [];
        const hasValidItems = validItems.length > 0;
        
        if (!hasValidItems) continue; // Skip dates with no valid items
        
        const firstItem = validItems[0];
        
        // Add type indicator and appropriate styling
        let typeBadge = `<span class="type-badge ${firstItem.type}">${firstItem.type.toUpperCase()}</span>`;
        
        // Add new season badge if applicable
        if (firstItem.is_new_season) {
            typeBadge += `<span class="type-badge new-season">NEW SEASON</span>`;
        }
            
        // Get the first item's display title, defaulting to 'Untitled' if not available
        const displayTitle = firstItem.display_title || firstItem.name || 'Untitled';
        
        // Determine if this is a TV show to apply specific styling
        const isTvShow = firstItem.type === 'tv';
        const isNewSeason = firstItem.is_new_season;
        const calendarDayClass = `calendar-day ${isTvShow ? 'tv-show' : ''} ${isNewSeason ? 'new-season' : ''} has-movie`;
            
        const itemType = firstItem.type === 'tv' ? 'tv' : 'movie';
        daysHTML += `
            <div class="${calendarDayClass}" 
                 onclick="showMoreDetails('${dateString}')" 
                 data-item-id="${firstItem.id}" 
                 data-item-type="${itemType}">
                <div class="date-header">
                    ${date.getDate()}
                    ${typeBadge}
                </div>
                <div class="item-card">
                    <a href="${firstItem.detail_url}" data-item-id="${firstItem.id}" data-item-type="${itemType}">
                        <img src="${firstItem.poster_path ? 'https://image.tmdb.org/t/p/w500' + firstItem.poster_path : '../assets/images/placeholder_media.png'}" 
                             alt="${displayTitle}" 
                             class="item-poster" 
                             data-item-id="${firstItem.id}"
                             data-item-type="${itemType}"
                             onerror="this.onerror=null; this.src='../assets/images/placeholder_media.png'" />
                        <div class="item-title" data-item-id="${firstItem.id}" data-item-type="${itemType}">${displayTitle}</div>
                    </a>
                </div>
                ${validItems.length > 1 ? 
                    `<div class="more-items" data-item-id="${firstItem.id}" data-item-type="${itemType}">+${validItems.length - 1} more</div>` : ''}
            </div>`;
    }

    // Update the calendar content
    calendarDiv.innerHTML = `
        <div class="calendar-grid">
            ${daysHTML}
        </div>
    `;
    
    // Preloader is now hidden in the finally block of fetchMoviesForMonth
}

// Show more details for a specific date
function showMoreDetails(dateString) {
    const itemsForDate = window.filteredItemsByDate[dateString] || [];
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
                
        const itemType = item.type === 'tv' ? 'tv' : 'movie';
        return `
            <div class="item-card" data-item-id="${item.id}" data-item-type="${itemType}">
                <span class="type-badge ${itemType}" data-item-id="${item.id}" data-item-type="${itemType}">${itemType.toUpperCase()}</span>
                <a href="${detailUrl}" data-item-id="${item.id}" data-item-type="${itemType}">
                    ${imageHtml.replace('<img ', `<img data-item-id="${item.id}" data-item-type="${itemType}" `)}
                    <div class="item-title" data-item-id="${item.id}" data-item-type="${itemType}">${title}</div>
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