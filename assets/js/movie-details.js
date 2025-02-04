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
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=release_dates,videos`;
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
        
        const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`;
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

    

    let torrentLink = ''; // This will hold the magnet link for either 4K or Full HD
    let selectedQuality = ''; // This will store the selected quality (4k or full hd)
    let availableQualities = []; // This will store available qualities (either 4K or Full HD)
    
    const trackerUrls = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.tracker.cl:1337/announce",
        "udp://p4p.arenabg.com:1337/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://tracker.dler.org:6969/announce",
        "udp://open.stealth.si:80/announce",
        "udp://ipv4.tracker.harry.lu:80/announce",
        "https://opentracker.i2p.rocks:443/announce"
    ];
    
    const fetchYtsImdbId = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/external_ids?api_key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('Fetched IMDb ID:', data.imdb_id); // Debugging the IMDb ID fetch
            return data.imdb_id; // Return IMDb ID from TMDB response
        } catch (error) {
            console.error('Error fetching IMDb ID:', error);
            return null;
        }
    };
    
    // Main function to fetch torrent link
// Main function to fetch torrent link
const torrentYTS = async () => {
    try {
        // Wait for a short cooldown
        await new Promise(resolve => setTimeout(resolve, 500));

        const imdbId = await fetchYtsImdbId(movieId);

        if (!imdbId) throw new Error("IMDb ID not available for this movie.");

        // Now, use the IMDb ID to query YTS
        const ytsUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}`;
        const response = await fetch(ytsUrl);
        if (!response.ok) throw new Error("Error fetching movie list");

        const data = await response.json();
        if (!data.data || !data.data.movies || data.data.movies.length === 0) {
            throw new Error("Movie not found.");
        }

        // Get the first movie found with the IMDb ID match
        const movie = data.data.movies[0];

        if (!movie) throw new Error("Exact movie not found.");

        const movieIdYTS = movie.id; // Extract the YTS movie ID

        // Fetch detailed movie info using movie_id
        const movieDetailsUrl = `https://yts.mx/api/v2/movie_details.json?movie_id=${movieIdYTS}`;
        const movieDetailsResponse = await fetch(movieDetailsUrl);
        if (!movieDetailsResponse.ok) throw new Error("Error fetching movie details");

        const movieDetailsData = await movieDetailsResponse.json();
        const movieDetails = movieDetailsData.data.movie;

        if (!movieDetails || !movieDetails.torrents) {
            throw new Error("No torrents available for this movie.");
        }

        console.log('Movie Details:', movieDetails); // Debugging movie details fetch

        // Try to find the 4K torrent first (2160p)
        let torrent4k = movieDetails.torrents.find(torrent => torrent.quality === "2160p");
        console.log('4K Torrent:', torrent4k); // Debugging 4K torrent

        // Try to find the Full HD torrent (1080p)
        let torrentHD = movieDetails.torrents.find(torrent => torrent.quality === "1080p");
        console.log('HD Torrent:', torrentHD); // Debugging HD torrent

        // Store available qualities
        availableQualities = [];
        if (torrent4k) availableQualities.push("4k");
        if (torrentHD) availableQualities.push("hd");

        // Get the download button
        const downloadBtn = document.querySelector('.download-btn');

        // Disable the download link if no quality is available
        if (availableQualities.length === 0) {
            console.log('No available torrents. Disabling download button.'); // Debugging no available torrents
            downloadBtn.href = '#';
            downloadBtn.style.cursor = 'not-allowed';
            downloadBtn.innerHTML = 'Unavailable <ion-icon name="alert-circle-outline"></ion-icon>';
            return; // Exit the function early
        }

        // If only Full HD is available, set the magnet link and enable the button
        if (availableQualities.length === 1 && torrentHD) {
            console.log('Only Full HD available. Setting magnet link.'); // Debugging Full HD
            torrentLink = `magnet:?xt=urn:btih:${torrentHD.hash}&dn=${encodeURIComponent(movieDetails.title)}%20${movieDetails.year}%20[1080p]%20[YTS.MX]${trackerUrls.map(url => `&tr=${encodeURIComponent(url)}`).join('')}`;
            downloadBtn.href = torrentLink;
            downloadBtn.download = `${movieDetails.title}-1080p.torrent`;
            return;
        }

        // If both are available, show the quality selection popup
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (availableQualities.length === 2) {
                console.log('Both qualities available. Showing quality popup.'); // Debugging both qualities available
                document.getElementById('quality-popup').style.display = 'flex';
            }
        });

        // Handle the quality selection for torrent download
        document.getElementById('btn-4k').addEventListener('click', () => {
            console.log('User selected 4K for torrent.'); // Debugging 4K selection
            selectedQuality = "4k";
            torrentLink = `magnet:?xt=urn:btih:${torrent4k.hash}&dn=${encodeURIComponent(movieDetails.title)}%20${movieDetails.year}%20[2160p]%20[YTS.MX]${trackerUrls.map(url => `&tr=${encodeURIComponent(url)}`).join('')}`;
            document.getElementById('quality-popup').style.display = 'none';
            downloadBtn.href = torrentLink;
            downloadBtn.download = `${movieDetails.title}-2160p.torrent`;

            // Trigger the download by creating an anchor tag click event
            const tempLink = document.createElement('a');
            tempLink.href = torrentLink;
            tempLink.download = `${movieDetails.title}-2160p.torrent`;
            tempLink.click(); // This triggers the download
        });

        document.getElementById('btn-hd').addEventListener('click', () => {
            console.log('User selected HD for torrent.'); // Debugging HD selection
            selectedQuality = "hd";
            torrentLink = `magnet:?xt=urn:btih:${torrentHD.hash}&dn=${encodeURIComponent(movieDetails.title)}%20${movieDetails.year}%20[1080p]%20[YTS.MX]${trackerUrls.map(url => `&tr=${encodeURIComponent(url)}`).join('')}`;
            document.getElementById('quality-popup').style.display = 'none';
            downloadBtn.href = torrentLink;
            downloadBtn.download = `${movieDetails.title}-1080p.torrent`;

            // Trigger the download by creating an anchor tag click event
            const tempLink = document.createElement('a');
            tempLink.href = torrentLink;
            tempLink.download = `${movieDetails.title}-1080p.torrent`;
            tempLink.click(); // This triggers the download
        });

        // Close the popup when 'Cancel' is clicked
        document.getElementById('btn-cancel').addEventListener('click', () => {
            document.getElementById('quality-popup').style.display = 'none';
        });
    } catch (error) {
        console.error('Error in torrentYTS function:', error);

        // Disable the download button if there is an error
        const downloadBtn = document.querySelector('.download-btn');
        downloadBtn.href = '#';
        downloadBtn.style.cursor = 'not-allowed';
        downloadBtn.style.pointerEvents = 'none';
        const icon = downloadBtn.querySelector('ion-icon');
        if (icon) {
            icon.style.fontSize = '16px !important';
        }
        downloadBtn.innerHTML = 'Unavailable <ion-icon name="alert-circle-outline"></ion-icon>';
    }
};


    
    // Call the function when the page loads
    window.onload = torrentYTS;
    

// Add popup trigger to Stream button
const streamButton = document.querySelector('.stream-btn');
if (streamButton) {
    streamButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default streaming action
    });
}

const streamMagnet = document.getElementById('stream-magnet');

// Function to fetch the Full HD magnet link dynamically based on IMDb ID
const getFullHdMagnetLink = async (movieId) => {
    try {
        // Fetch IMDb ID from TMDB
        const imdbId = await fetchYtsImdbId(movieId);
        if (!imdbId) throw new Error("IMDb ID not available for this movie.");
    
        // Use IMDb ID to query YTS for the torrent
        const ytsUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}`;
        const response = await fetch(ytsUrl);
        const data = await response.json();
    
        if (!data.data || !data.data.movies || data.data.movies.length === 0) {
            throw new Error("Movie not found.");
        }
    
        // Get the first movie entry
        const movie = data.data.movies[0];
    
        // Try to find Full HD torrent first
        let torrentHD = movie.torrents.find(torrent => torrent.quality === "1080p" && torrent.type === "web");
        if (!torrentHD) {
            // Fall back to Blu-ray if no Full HD web quality found
            torrentHD = movie.torrents.find(torrent => torrent.quality === "1080p" && torrent.type === "bluray");
        }
    
        if (!torrentHD) throw new Error("Full HD torrent not available for this movie.");
    
        // Construct magnet link for Full HD
        const magnetLink = `magnet:?xt=urn:btih:${torrentHD.hash}&dn=${encodeURIComponent(movie.title)}%20${movie.year}%20[1080p]%20[YTS.MX]`;
        return magnetLink;
    } catch (error) {
        console.error("Error fetching magnet link:", error);
        return null;
    }
};


    const updateStreamButton = async () => {
        const movieId = getMovieIdFromUrl();
        const streamButton = document.querySelector('.stream-btn');
    
        // Fetch the Full HD magnet link
        const magnetLink = await getFullHdMagnetLink(movieId);
    
        if (!magnetLink) {
            // Disable the Stream button and show alert
            streamButton.href = '#';
            streamButton.style.cursor = 'not-allowed';
            streamButton.style.pointerEvents = 'none';
            const streamIcon = streamButton.querySelector('ion-icon');
            if (streamIcon) {
                streamIcon.style.fontSize = '16px !important';
            }
            streamButton.innerHTML = 'Unavailable <ion-icon name="alert-circle-outline"></ion-icon>';
        } else {
            // Enable the Stream button with normal behavior
            streamButton.addEventListener('click', openStreamModal);
        }
    };
    
    // Call the function after fetching movie details
    updateStreamButton();

    
    
    

    // Function to open the modal and dynamically set video source
    const openStreamModal = async () => {
        // Show the modal
        streamMagnet.style.display = 'block';
        document.body.classList.add('blur');
        disableScroll();
        document.body.addEventListener('touchmove', preventDefault, { passive: false });

        // Clear any existing content in streamMagnet
        streamMagnet.innerHTML = '';

        // Get the movieId from the URL
        const movieId = getMovieIdFromUrl();

        // Fetch the Full HD magnet link
        const magnetLink = await getFullHdMagnetLink(movieId);
        if (!magnetLink) {
            closeStreamModal();
            return;
        }

        // Create video element with the magnet link as the source
        const video = document.createElement('video');
        video.controls = true;
        video.src = magnetLink;

        // Append video element to the modal
        streamMagnet.appendChild(video);

        // Load the Webtor player script and initialize it
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@webtor/player-sdk-js/dist/index.min.js";
        script.charset = "utf-8";
        script.async = true;
        script.onload = () => {
            window.webtorPlayer = new Webtor.Player({
                el: video,  // Bind the Webtor player to the video element
                url: video.src // Provide the source URL for the player
            });
        };
        document.body.appendChild(script); // Append the script to the body
    };

    // Function to close the modal and remove video content
    const closeStreamModal = (event) => {
        if (event.target === streamMagnet) {
            streamMagnet.style.display = 'none';
            document.body.classList.remove('blur');
            enableScroll();
            document.body.removeEventListener('touchmove', preventDefault);
            streamMagnet.innerHTML = ''; // Remove video content to stop playback
        }
    };

    // Disable and enable scrolling functions
    const disableScroll = () => document.body.style.overflow = 'hidden';
    const enableScroll = () => document.body.style.overflow = 'auto';
    const preventDefault = (e) => e.preventDefault;

    // Event listeners
    streamButton.addEventListener('click', openStreamModal);
    streamMagnet.addEventListener('click', closeStreamModal);

    const redirectToSDStream = (event) => {
        event.preventDefault();  // Prevents the default link behavior
        
        const streamUrl = `https://rivestream.live/watch?type=movie&id=${movieId}`;
    
        // Create an iframe element
        const iframe = document.createElement('iframe');
        iframe.src = streamUrl;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; fullscreen';  // Allow fullscreen and autoplay
        iframe.allowfullscreen = true;          // Explicitly set the allowfullscreen attribute
        
        // Insert the iframe into the container
        const container = document.getElementById('stream-container');
        container.innerHTML = '';  // Clear any previous content in the container
        container.appendChild(iframe);
        
        // Display the container
        container.style.display = 'flex';  // Show the stream container
    
        // Add event listener to close the iframe when clicking outside
        document.addEventListener('click', closeIframeOnClickOutside);
    };
    
    const closeIframeOnClickOutside = (event) => {
        const container = document.getElementById('stream-container');
        const iframe = container.querySelector('iframe');
    
        if (iframe && !iframe.contains(event.target) && !event.target.closest('.sd-stream-btn')) {
            container.style.display = 'none';  // Hide the stream container
            container.innerHTML = '';  // Clear the iframe content
            document.removeEventListener('click', closeIframeOnClickOutside);  // Remove the event listener
        }
    };
    
    const sdstreamButton = document.querySelector('.sd-stream-btn');
    sdstreamButton.addEventListener('click', redirectToSDStream);
    
    


    const displaySimilarMovies = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}`;
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
    
    const addToWatchLaterFeature = async (movie) => {
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
      
          const watchLaterIconContainer = document.querySelector('#add-to-watch-later');
          if (!watchLaterIconContainer) {
            console.error('Watch Later icon not found.');
            return;
          }

          watchLaterIconContainer.style.display = session ? 'block' : 'none';
      
          let isInWatchList = false; // Track watch list status locally
      
          if (session) {
            const { data: existing, error: fetchError } = await supabase
              .from('watch_later_movies')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('movie_id', movie.id);
      
            if (fetchError) {
              console.error('Error checking watch later status:', fetchError);
              return;
            }
      
            isInWatchList = existing.length > 0;
      
            const ionIconElement = watchLaterIconContainer.querySelector('ion-icon');
            if (!ionIconElement) {
              console.error('Ion Icon not found within the anchor tag.');
              return;
            }
      
            ionIconElement.setAttribute(
              'name',
              isInWatchList ? 'time' : 'time-outline'
            );
      
            watchLaterIconContainer.addEventListener('click', async (event) => {
              event.preventDefault();
      
              if (isInWatchList) {
                const { error: deleteError } = await supabase
                  .from('watch_later_movies')
                  .delete()
                  .eq('user_id', session.user.id)
                  .eq('movie_id', movie.id);
      
                if (deleteError) {
                  console.error('Error removing from watch later list:', deleteError);
                }
              } else {
                const { error: insertError } = await supabase
                  .from('watch_later_movies')
                  .insert([
                    { 
                      user_id: session.user.id, 
                      movie_id: movie.id,
                      movie_title: movie.title // Add the movie title here
                    }
                  ]);
      
                if (insertError) {
                  console.error('Error adding to watch later list:', insertError);
                }
              }
      
              isInWatchList = !isInWatchList;
              ionIconElement.setAttribute(
                'name',
                isInWatchList ? 'time' : 'time-outline'
              );
            });
          }
        } catch (error) {
          console.error('An unexpected error occurred:', error);
        }
      };      
    
        
        // Call this function when movie details are fetched
        document.addEventListener('movieDetailsFetched', (event) => {
            const movie = event.detail;
            if (movie) {
            addToListFeature(movie);
            markAsWatchedFeature(movie);
            addToWatchLaterFeature(movie);
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