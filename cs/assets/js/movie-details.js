// movie-details.js
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        'https://cbnwekzbcxbmeevdjgoq.supabase.co', // Replace with your Supabase URL
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase public API key
    );
  
    const getMovieIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const fetchMovieDetails = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=release_dates,videos&language=cs-CZ`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMovieDetails(data);
            displaySimilarMovies(movieId); // Fetch and display similar movies
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    };


    const displayMovieDetails = async (movie) => {
        // Update movie details
        const movieDetailBanner = document.querySelector('.movie-detail-banner img');
        const movieDetailTitle = document.querySelector('.detail-title');
        const movieDetailBadge = document.querySelector('.badge-fill');
        const movieDetailGenres = document.querySelector('.ganre-wrapper');
        const movieDetailReleaseDate = document.querySelector('.date-time time[datetime]');
        const movieDetailRuntime = document.querySelector('.date-time time[datetime="PT115M"]');
        const movieDetailStoryline = document.querySelector('.storyline');
        const movieDetailCertification = document.querySelector('.badge-outline');
        const movieDetailPosterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'assets/images/person.svg';
        const movieDetailYear = new Date(movie.release_date).getFullYear();
        const movieDetailTrailer = movie.videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');

        // Update the document title
        document.title = `${movie.title} (${movieDetailYear})`;


        // Update movie banner
        movieDetailBanner.src = movieDetailPosterPath;
        movieDetailBanner.alt = `${movie.title} Poster`;

        // Format and update movie title
        let maxTitleLength = 36;
        let shortenedTitle = movie.title.length > maxTitleLength ? movie.title.slice(0, maxTitleLength) + "..." : movie.title;
        const titleWords = shortenedTitle.split(' ');
        const formattedTitle = `<strong>${titleWords[0]}</strong> ${titleWords.slice(1).join(' ')}`;
        movieDetailTitle.innerHTML = formattedTitle;


        // Update other movie details
        movieDetailBadge.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
        let maxGenres = 3;
        const limitedGenres = movie.genres.slice(0, maxGenres);
        movieDetailGenres.innerHTML = limitedGenres
        .map(genre => `<a href="genre-details.html?genreId=${genre.id}" target="_blank">${genre.name}</a>`)
        .join(' ');
        movieDetailReleaseDate.textContent = movieDetailYear;
        movieDetailReleaseDate.setAttribute('datetime', movie.release_date);
        movieDetailRuntime.textContent = formatRuntime(movie.runtime);
        movieDetailRuntime.setAttribute('datetime', `PT${movie.runtime}M`);
        const truncatedOverview = movie.overview.length > 240 ? movie.overview.substring(0, 240) + '...' : movie.overview;
        movieDetailStoryline.textContent = truncatedOverview;

        


        // Set the background image dynamically
        const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|webOS|Windows Phone|IEMobile/i.test(navigator.userAgent);

        const movieBackdropPath = movie.backdrop_path ? (
        isMobile ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        ) : 'default-backdrop-url';
        
        const movieDetail = document.querySelector('.movie-detail');
        movieDetail.style.backgroundImage = `url("movie-detail-bg.png"), url(${movieBackdropPath})`;
        
        const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}&language=cs-CZ`;
try {
    const creditsResponse = await fetch(creditsUrl);
    const creditsData = await creditsResponse.json();

    // Get director's name and id
    const director = creditsData.crew.find(member => member.job === 'Director');
    const directorName = director ? director.name : 'Director Not Found';
    const directorId = director ? director.id : '#';

    const producer = creditsData.crew.find(member => member.job === 'Producer');
    const producerName = producer ? producer.name : 'Producer Not Found';
    const producerId = producer ? producer.id : '#';

    const writer = creditsData.crew.find(member => member.job === 'Writer');
    const writerName = writer ? writer.name : null; // Use null instead of 'Writer Not Found'
    const writerId = writer ? writer.id : '#';
    
    // Find the editor
    const editor = creditsData.crew.find(member => member.job === 'Editor');
    const editorName = editor ? editor.name : 'Editor Not Found'; // Default editor to 'Editor Not Found'
    const editorId = editor ? editor.id : '#';

    // Update director's name in HTML
    const movieDetailDirector = document.querySelector('.director');
    movieDetailDirector.innerHTML = `<span>Director:</span> <a href="./people-details.html?id=${directorId}" target="_blank">${directorName}</a><br>`;

    const movieDetailProducer = document.querySelector('.producer');
    movieDetailProducer.innerHTML = `<span>Producer:</span> <a href="./people-details.html?id=${producerId}" target="_blank">${producerName}</a><br>`;

    const movieDetailWriter = document.querySelector('.writer');
    movieDetailWriter.innerHTML = writerName
            ? `<span>Writer:</span> <a href="./people-details.html?id=${writerId}" target="_blank">${writerName}</a>`
            : `<span>Editor:</span> <a href="./people-details.html?id=${editorId}" target="_blank">${editorName}</a>`;

    const actors = creditsData.cast.slice(0, 10);

    // Create links for actor names and images
    const actorElements = actors.map(actor => {
        // Assuming actor has a profile_path or image_url property
        const imageUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'placeholder.jpg'; // Adjust the image URL as per your data structure
        return `
            <div class="actors-stars">
                <a href="./people-details.html?id=${actor.id}" target="_blank">
                    <img src="${imageUrl}" alt="${actor.name}">
                    <div class="actors-info">
                    <p>${actor.name}</p>
                </a>
                <p>${actor.character}</p>
                </div>
            </div>`;
    }).join('');
    
    // Update actors in HTML
    const actorsContainer = document.querySelector('.actors');
    actorsContainer.innerHTML = ''; // Clear existing content
    
    const starsElement = document.createElement('div');
    starsElement.innerHTML += actorElements;
    actorsContainer.appendChild(starsElement);
    

} catch (error) {
    console.error('Error fetching credits:', error);
    // Handle error if necessary
}



        // Determine certification based on user's language
        const getCertification = (movie) => {
            const userLanguage = navigator.language.split('-')[0]; // Get the language code (e.g., 'en' or 'cs')

            if (movie.release_dates && movie.release_dates.results) {
                let certification = 'NR'; // Default to 'NR' if no certification is found

                // Determine which certification to use based on the user's preferred language
                let releaseInfo;
                if (userLanguage === 'cs') {
                    // Czech language, use certification data for Czech Republic ('CZ')
                    releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'CZ');
                } else {
                    // Default to English language, use certification data for United States ('US')
                    releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'US');
                }

                if (releaseInfo && releaseInfo.release_dates && releaseInfo.release_dates.length > 0) {
                    certification = releaseInfo.release_dates[0].certification;
                }

                if (certification) {
                    // Map the certification codes to their respective ratings and hints
                    switch (certification) {
                        case 'NR':
                            return { rating: 'NR', hint: 'Not Rated' };
                        case 'G':
                            return { rating: 'G', hint: 'General Audiences. All ages admitted.' };
                        case 'PG':
                            return { rating: 'PG', hint: 'Parental Guidance Suggested. Some material may not be suitable for children.' };
                        case 'PG-13':
                            return { rating: 'PG-13', hint: 'Parents Strongly Cautioned. Some material may be inappropriate for children under 13.' };
                        case 'R':
                            return { rating: 'R', hint: 'Restricted. Under 17 requires accompanying parent or adult guardian.' };
                        case 'NC-17':
                            return { rating: 'NC-17', hint: 'No One 17 and Under Admitted.' };
                        case 'U':
                            return { rating: 'U', hint: 'Universal. Suitable for all ages.' }; // Map 'U' to 'G'
                        default:
                            return { rating: certification, hint: 'Rating Description Unavailable' };
                    }
                }
            }
            // If no certification is found, return default values
            return { rating: 'NR', hint: 'Not Rated' };
        };

        const certificationInfo = getCertification(movie);
        movieDetailCertification.textContent = certificationInfo.rating;

        // Add tooltip for certification hint
        movieDetailCertification.setAttribute('title', certificationInfo.hint);
        movieDetailCertification.classList.add('tooltip');
        movieDetailCertification.addEventListener('mouseover', () => {
            movieDetailCertification.classList.add('show-tooltip');
        });
        movieDetailCertification.addEventListener('mouseout', () => {
            movieDetailCertification.classList.remove('show-tooltip');
        });

        // Add play button functionality for trailer
const playButton = document.querySelector('.play-btn');
if (movieDetailTrailer) {
    const modal = document.querySelector('.modal');
    const modalContent = document.querySelector('.modal-content');
    const iframe = document.createElement('iframe');

    playButton.addEventListener('click', () => {
        modal.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${movieDetailTrailer.key}?autoplay=1&rel=1&controls=1&showinfo=0&modestbranding=1&autohide=1&vq=hd1080`;

        iframe.setAttribute('allowfullscreen', '');
        modalContent.appendChild(iframe);

        document.body.classList.add('blur');
        disableScroll();

        modal.addEventListener('click', closeModal);
    });

    const closeModal = (event) => {
        if (event.target === modal || event.clientY <= 0 || event.clientY >= window.innerHeight) {
            modal.style.display = 'none';
            iframe.remove();
            document.body.classList.remove('blur');
            enableScroll();
            modal.removeEventListener('click', closeModal);
        }
    };

    const disableScroll = () => {
        document.body.style.overflow = 'hidden';
    };

    const enableScroll = () => {
        document.body.style.overflow = '';
    };
} else {
    // Disable the button if no trailer is available
    playButton.setAttribute('disabled', 'true');
    playButton.style.cursor = 'default';
    playButton.innerHTML = '';
}


        const event = new CustomEvent('movieDetailsFetched', { detail: movie });
        document.dispatchEvent(event);

    };

    
    
    const redirectToYTS = () => {
        // Get the movie title from the document title
        const documentTitle = document.title;
        let movieTitle = documentTitle.split(' (')[0]; // Extract movie title from document title
    
        // Remove ":" and "." from the movie title
        movieTitle = movieTitle.replace(/:/g, '').replace(/\./g, '');
    
        // Format the movie title for the YTS URL
        let formattedMovieTitle = movieTitle.toLowerCase().replace(/ /g, '+'); // Replace spaces with dashes
    
        // Remove multiple consecutive dashes
        formattedMovieTitle = formattedMovieTitle.replace(/-+/g, '+');
    
        // Construct the YTS URL
        const ytsUrl = `https://sktorrent.eu/torrent/torrents_v2.php?search=${formattedMovieTitle}&category=0&zaner=&jazyk=&active=0`;
    
        // Open the YTS URL in a new tab
        window.open(ytsUrl, '_blank');
    };

    const redirectToStream = () => {
        const documentTitle = document.title;
        let movieTitle = documentTitle.split(' (')[0]; // Extract movie title from document title
    
        // Remove ":" and "." from the movie title
        movieTitle = movieTitle.replace(/:/g, '').replace(/\./g, '');
    
        // Format the movie title for the YTS URL
        let formattedMovieTitle = movieTitle.toLowerCase().replace(/ /g, '-'); // Replace spaces with dashes
    
        // Remove multiple consecutive dashes
        formattedMovieTitle = formattedMovieTitle.replace(/-+/g, '-');
        const streamUrl = `https://film.kukaj.io/${formattedMovieTitle}`;
    
        // Open the stream URL in a new tab
        window.open(streamUrl, '_blank');
    };

    const redirectToSDStream = () => {

        const documentTitle = document.title;
        let movieTitle = documentTitle.split(' (')[0]; // Extract movie title from document title
    
        // Remove ":" and "." from the movie title
        movieTitle = movieTitle.replace(/:/g, '').replace(/\./g, '');
    
        // Format the movie title for the YTS URL
        let formattedMovieTitle = movieTitle.toLowerCase().replace(/ /g, '+'); // Replace spaces with dashes
    
        // Remove multiple consecutive dashes
        formattedMovieTitle = formattedMovieTitle.replace(/-+/g, '+');

        const streamUrl = `https://online.sktorrent.eu/search/videos?search_query=${formattedMovieTitle}`;
    
        // Open the stream URL in a new tab
        window.open(streamUrl, '_blank');
    };

    const downloadButton = document.querySelector('.download-btn');
    downloadButton.addEventListener('click', redirectToYTS);
    const streamButton = document.querySelector('.stream-btn');
    streamButton.addEventListener('click', redirectToStream);
    const sdstreamButton = document.querySelector('.sd-stream-btn');
    sdstreamButton.addEventListener('click', redirectToSDStream);
    
    


    const displaySimilarMovies = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}&language=cs-CZ`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const similarMovies = data.results.slice(0, 4); // Get the first 4 similar movies
    
            // Check if similarMovies array is empty
            if (similarMovies.length === 0) {
                // If no similar movies, hide the entire section
                document.querySelector('.tv-series').style.display = 'none';
            } else {
                // Display the section and populate similar movies
                document.querySelector('.tv-series').style.display = 'block';
                displayMovies(similarMovies);
            }
        } catch (error) {
            console.error('Error fetching similar movies:', error);
            // Handle error if necessary
        }
    };
    

    const displayMovies = (movies) => {
        const moviesList = document.querySelector('.movies-list');
        moviesList.innerHTML = ''; // Clear existing content
    
        movies.forEach(movie => {
            const movieItem = document.createElement('li');
            movieItem.innerHTML = `
                <div class="movie-card">
                    <a href="./movie-details.html?id=${movie.id}">
                        <figure class="card-banner">
                            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
                        </figure>
                    </a>
                    <div class="title-wrapper">
                        <a href="./movie-details.html?id=${movie.id}">
                            <h3 class="card-title">${movie.title}</h3>
                        </a>
                        <time>${new Date(movie.release_date).getFullYear()}</time> <!-- Display release year only -->
                    </div>
                    <div class="card-meta">
                        <div class="badge badge-outline">${movie.vote_average.toFixed(1)}</div> <!-- Display rating with 1 decimal place -->
                    </div>
                </div>
            `;
            moviesList.appendChild(movieItem);
        });
    };

    const fetchImdbId = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/external_ids?api_key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.imdb_id; // Return IMDb ID from TMDB response
        } catch (error) {
            console.error('Error fetching IMDb ID:', error);
            return null;
        }
    };

    const fetchAndDisplayMovieDetails = async (movieId) => {
    
        try {
            // Fetch IMDb ID using TMDB API
            const imdbId = await fetchImdbId(movieId);
    
            if (imdbId) {
                const omdbUrl = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`;
    
                // Fetch data from OMDB API
                const response = await fetch(omdbUrl);
                const data = await response.json();
    
                // Check if the data is valid and update UI accordingly
                if (data.Response === "True") {
                    const ratings = data.Ratings;
                    let criticsScore = 'N/A';
                    let audienceScore = 'N/A';
    
                    ratings.forEach(rating => {
                        if (rating.Source === 'Rotten Tomatoes') {
                            criticsScore = rating.Value;
                        }
                        if (rating.Source === 'Internet Movie Database') {
                            audienceScore = `${parseFloat(rating.Value) * 10}%`;
                        }
                    });
    
                    const criticsScoreElement = document.getElementById('tomatometer');
                        if (criticsScoreElement) {
                            criticsScoreElement.classList.add('tomatometer');
                            criticsScoreElement.innerHTML = `
                                <img src="${getCriticsScoreImage(criticsScore)}" alt="Critics Score">
                                <p>${criticsScore}</p>
                                <a href="#" class="tomatometer-link">Tomatometer</a>
                            `;
                            
                            const tomatometerLink = criticsScoreElement.querySelector('.tomatometer-link');
                            if (tomatometerLink) {
                                tomatometerLink.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    if (criticsScore !== 'N/A') {
                                        window.location.href = `discover.html?critics=${criticsScore.replace('%', '')}`;
                                }
                                });
                            }
                        }

                        // Function to toggle display of audience-info div
                        const audienceScoreElement = document.getElementById('audience-score');
                        if (audienceScoreElement) {
                            audienceScoreElement.classList.add('audience-score');
                            audienceScoreElement.innerHTML = `
                                <img src="${getAudienceScoreImage(audienceScore)}" alt="Audience Score">
                                <p>${audienceScore}</p>
                                <a href="#" class="audienceScore-link">Popcornmeter</a>
                            `;
                            
                            const audienceScoreLink = audienceScoreElement.querySelector('.audienceScore-link');
                            if (audienceScoreLink) {
                                audienceScoreLink.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    if (audienceScore !== 'N/A') {
                                        window.location.href = `discover.html?audience=${audienceScore.replace('%', '')}`;
            }
                                });
                            }
                        }

                        document.addEventListener('click', function(event) {
                            const tomatometerInfo = document.querySelector('.tomatometer-info');
                            if (tomatometerInfo && !event.target.closest('#tomatometer')) {
                                tomatometerInfo.style.display = 'none';
                            }

                            const audienceInfo = document.querySelector('.audience-info');
                            if (audienceInfo && !event.target.closest('#audience-score')) {
                                audienceInfo.style.display = 'none';
                            }
                        });
                } else {
                    console.log('OMDB API returned no valid data.');
                    // Handle case where data.Response is not true
                }
            } else {
                console.error('IMDb ID not found.');
                // Handle case where IMDb ID is not found
            }
        } catch (error) {
            console.error('Error fetching or displaying movie details:', error);
            // Handle other errors related to fetching or displaying
        }
    };
    

    const getAudienceScoreImage = (score) => {
        if (score === 'N/A') {
            return 'assets/images/unknown-audience.svg';
        } else {
            const scoreValue = parseFloat(score);
            if (scoreValue >= 84) {
                return 'assets/images/fresh-audience.svg';
            } else if (scoreValue > 50) {
                return 'assets/images/mid-audience.svg';
            } else {
                return 'assets/images/rotten-audience.svg';
            }
        }
    };

    const getCriticsScoreImage = (score) => {
        if (score === 'N/A') {
            return 'assets/images/unknown-critics.svg';
        } else {
            const scoreValue = parseInt(score); // Assuming score is in percentage
            if (scoreValue < 60) {
                return 'assets/images/rotten-critics.svg';
            } else if (scoreValue < 90) {
                return 'assets/images/mid-critics.svg';
            } else {
                return 'assets/images/fresh-critics.svg';
            }
        }
    };

    const addToListFeature = async (movie) => {
        if (!supabase || !supabase.auth) {
            console.error('Supabase client is not initialized.');
            return;
        }
    
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
                return;
            }
    
            // Get the existing add-to-list icon and container
            const addToListAnchor = document.querySelector('#add-to-list');
            const addToListIcon = addToListAnchor.querySelector('ion-icon');
    
            if (!addToListAnchor || !addToListIcon) {
                console.error('Add-to-list button or icon not found.');
                return;
            }
    
            // Ensure the button is visible only if the user is logged in
            addToListAnchor.style.display = session ? 'block' : 'none';
    
            // Check if the movie is already in any of the user's lists
            const { data: userLists, error: fetchError } = await supabase
                .from('user_lists')
                .select('id, list_items')
                .eq('user_id', session.user.id);
    
            if (fetchError) {
                console.error('Error fetching user lists:', fetchError);
                return;
            }
    
            const isInList = userLists.some(list =>
                Array.isArray(list.list_items) &&
                list.list_items.some(item => item.id === movie.id)
            );
    
            // Set the initial icon state
            addToListIcon.name = isInList ? 'list-circle-outline' : 'add-circle-outline';
    
            // Handle the click event
            addToListAnchor.addEventListener('click', async (e) => {
                e.preventDefault();
    
                if (addToListIcon.name === 'add-circle-outline') {
                    // Add the movie to the user's default list or prompt for a list
                    const defaultList = userLists[0]; // Assume the first list as default
    
                    if (!defaultList) {
                        alert('No lists found. Please create a new list.');
                        return;
                    }
    
                    const updatedListItems = Array.isArray(defaultList.list_items)
                        ? [...defaultList.list_items, { id: movie.id, title: movie.title }]
                        : [{ id: movie.id, title: movie.title }];
    
                    const { error: updateError } = await supabase
                        .from('user_lists')
                        .update({ list_items: updatedListItems })
                        .eq('id', defaultList.id);
    
                    if (updateError) {
                        console.error('Error adding movie to list:', updateError);
                        alert('Failed to add movie to list.');
                        return;
                    }
    
                    // Update icon
                    addToListIcon.name = 'list-circle-outline';
                    alert(`${movie.title} added to your list!`);
                } else if (addToListIcon.name === 'list-circle-outline') {
                    // Remove the movie from all lists
                    const updatedLists = userLists.map(list => ({
                        ...list,
                        list_items: list.list_items.filter(item => item.id !== movie.id),
                    }));
    
                    for (const list of updatedLists) {
                        const { error: removeError } = await supabase
                            .from('user_lists')
                            .update({ list_items: list.list_items })
                            .eq('id', list.id);
    
                        if (removeError) {
                            console.error('Error removing movie from list:', removeError);
                            alert('Failed to remove movie from list.');
                            return;
                        }
                    }
    
                    // Update icon
                    addToListIcon.name = 'add-circle-outline';
                    alert(`${movie.title} removed from your list!`);
                }
            });
        } catch (err) {
            console.error('Error in addToListFeature:', err);
        }
    };
    

    const markAsWatchedFeature = async (movie) => {
        if (!supabase || !supabase.auth) {
            console.error('Supabase client is not initialized.');
            return;
        }
    
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
                return;
            }
    
            // Select the watched icon container
            const watchedIcon = document.querySelector('.watched-icon #mark-as-watched');
            const watchedIconElement = document.querySelector('.watched-icon ion-icon');
    
            if (!watchedIcon || !watchedIconElement) {
                console.error('Watched icon not found.');
                return;
            }
    
            // Select the movie image for grayscale effect
            const movieImage = document.querySelector(`.movie-detail-banner img`);
            if (!movieImage) {
                console.error('Movie image not found.');
            }
    
            // Update watched icon visibility based on session
            watchedIcon.style.display = session ? 'block' : 'none';
    
            let isWatched = false; // Track watched status locally
    
            if (session) {
                // Check if the movie is already marked as watched
                const { data: existing, error: fetchError } = await supabase
                    .from('watched_movies')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('movie_id', movie.id);
    
                if (fetchError) {
                    console.error('Error checking watched status:', fetchError);
                    return;
                }
    
                isWatched = existing.length > 0;
    
                // Set initial icon and state based on watch status
                if (isWatched) {
                    applyWatchedStyle(movieImage);
                    watchedIconElement.name = 'eye-off-outline';
                    watchedIcon.title = 'Unmark as Watched';
                } else {
                    removeWatchedStyle(movieImage);
                    watchedIconElement.name = 'eye-outline';
                    watchedIcon.title = 'Mark as Watched';
                }
    
                // Add event listener for toggling watched status
                watchedIcon.addEventListener('click', async (e) => {
                    e.preventDefault();
    
                    if (isWatched) {
                        // Remove movie from the watched_movies table
                        const { error: deleteError } = await supabase
                            .from('watched_movies')
                            .delete()
                            .eq('user_id', session.user.id)
                            .eq('movie_id', movie.id);
    
                        if (deleteError) {
                            console.error('Error removing watched status:', deleteError);
                            alert('Failed to unmark as watched.');
                        } else {
                            removeWatchedStyle(movieImage);
                            watchedIconElement.name = 'eye-outline';
                            watchedIcon.title = 'Mark as Watched';
                            isWatched = false; // Update local state
                        }
                    } else {
                        // Add movie to the watched_movies table
                        const { error: insertError } = await supabase
                            .from('watched_movies')
                            .insert({
                                user_id: session.user.id,
                                movie_id: movie.id,
                                movie_title: movie.title,
                            });
    
                        if (insertError) {
                            console.error('Error marking as watched:', insertError);
                            alert('Failed to mark as watched.');
                        } else {
                            applyWatchedStyle(movieImage);
                            watchedIconElement.name = 'eye-off-outline';
                            watchedIcon.title = 'Unmark as Watched';
                            isWatched = true; // Update local state
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in markAsWatchedFeature:', err);
        }
    };
    
    const applyWatchedStyle = (image) => {
        if (!image) {
            console.error('Movie image not found.');
            return;
        }
    
        // Apply grayscale filter to the image
        image.style.filter = 'grayscale(1)';
    
        // Create a "Watched" label
        const watchedLabel = document.createElement('div');
        watchedLabel.textContent = 'Watched';
        watchedLabel.classList.add('watched-label');
    
        // Ensure the label is added only once
        const parentElement = image.closest('.movie-detail-banner');
        if (parentElement && !parentElement.querySelector('.watched-label')) {
            parentElement.appendChild(watchedLabel);
        }
    };
    
    
    const removeWatchedStyle = (image) => {
        if (!image) {
            console.error('Movie image not found.');
            return;
        }
    
        // Remove grayscale filter from the image
        image.style.filter = 'none';
    
        // Remove the "Watched" label if it exists
        const parentElement = image.closest('.movie-detail-banner');
        const watchedLabel = parentElement.querySelector('.watched-label');
        if (watchedLabel) {
            watchedLabel.remove();
        }
    };
    
    
    
    
        
        // Generate a unique shareable link
        const generateShareLink = () => {
            return `${Math.random().toString(36).substr(2, 9)}`;
        };
        
        // Call this function when movie details are fetched
        document.addEventListener('movieDetailsFetched', (event) => {
            const movie = event.detail;
            if (movie) {
            addToListFeature(movie);
            markAsWatchedFeature(movie);
            }
        });
        

    
    
    const formatRuntime = (minutes) => {
        if (!minutes) return 'N/A'; // Return N/A if no runtime available
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };
    
    const movieId = getMovieIdFromUrl();
    if (movieId) {
        fetchMovieDetails(movieId);
        fetchAndDisplayMovieDetails(movieId);
    }   


});


updateredirectToSDStream();