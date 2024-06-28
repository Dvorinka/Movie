// movie-details.js
document.addEventListener('DOMContentLoaded', () => {

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
        const movieDetailPosterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'placeholder-image-url';
        const movieDetailYear = new Date(movie.release_date).getFullYear();
        const movieDetailTrailer = movie.videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');

        // Update the document title
        document.title = `${movie.title} (${movieDetailYear})`;

        // Update movie banner
        movieDetailBanner.src = movieDetailPosterPath;
        movieDetailBanner.alt = `${movie.title} Poster`;

        // Format and update movie title
        const titleWords = movie.title.split(' ');
        const formattedTitle = `<strong>${titleWords[0]}</strong> ${titleWords.slice(1).join(' ')}`;
        movieDetailTitle.innerHTML = formattedTitle;

        // Update other movie details
        movieDetailBadge.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
        movieDetailGenres.innerHTML = movie.genres.map(genre => `<a href="genre-details.html?genreId=${genre.id}" target="_blank">${genre.name}</a>`).join(' ');
        movieDetailReleaseDate.textContent = movieDetailYear;
        movieDetailReleaseDate.setAttribute('datetime', movie.release_date);
        movieDetailRuntime.textContent = formatRuntime(movie.runtime);
        movieDetailRuntime.setAttribute('datetime', `PT${movie.runtime}M`);
        movieDetailStoryline.textContent = movie.overview; // Assign the whole overview

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

    // Update director's name in HTML
    const movieDetailDirector = document.querySelector('.director');
    movieDetailDirector.innerHTML = `<span>Director:</span> <a href="./people-details.html?id=${directorId}" target="_blank">${directorName}</a>`;

    // Get top 5 billed actors
    const actors = creditsData.cast.slice(0, 4);

    // Create links for actor names
    const actorLinks = actors.map(actor => `<a href="./people-details.html?id=${actor.id}" target="_blank">${actor.name}</a>`).join(', ');

    // Update actors in HTML
    const actorsContainer = document.querySelector('.actors');
    actorsContainer.innerHTML = ''; // Clear existing content

    const starsElement = document.createElement('p');
    starsElement.innerHTML = `<span>Stars:</span> ${actorLinks}`;
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
        if (movieDetailTrailer) {
            const playButton = document.querySelector('.play-btn');
            const modal = document.querySelector('.modal');
            const modalContent = document.querySelector('.modal-content');
            const iframe = document.createElement('iframe');

            playButton.addEventListener('click', () => {
                modal.style.display = 'block';
                iframe.src = `https://www.youtube.com/embed/${movieDetailTrailer.key}?autoplay=1&rel=0&controls=1&showinfo=0&modestbranding=1&autohide=1&vq=hd1080`;
                modalContent.appendChild(iframe);

                // Blur the background
                document.body.classList.add('blur');

                // Disable scrolling
                disableScroll();

                // Prevent scrolling on touch devices
                document.body.addEventListener('touchmove', preventDefault, { passive: false });

                // Close the modal when clicking outside the video
                modal.addEventListener('click', closeModal);
            });

            const closeModal = (event) => {
                if (event.target === modal || event.clientY <= 0 || event.clientY >= window.innerHeight) {
                    modal.style.display = 'none';
                    iframe.remove();
                    // Remove blur from the background
                    document.body.classList.remove('blur');
                    // Enable scrolling
                    enableScroll();
                    // Re-enable scrolling on touch devices
                    document.body.removeEventListener('touchmove', preventDefault);
                    // Remove event listener to close modal
                    modal.removeEventListener('click', closeModal);
                }
            };

            const disableScroll = () => {
                document.body.style.overflow = 'hidden';
            };

            const enableScroll = () => {
                document.body.style.overflow = '';
            };

            const preventDefault = (event) => {
                event.preventDefault();
            };
        }
    };

    const redirectToYTS = () => {
        // Get the movie title from the document title
        const documentTitle = document.title;
        let movieTitle = documentTitle.split(' (')[0]; // Extract movie title from document title
    
        // Remove ":" and "." from the movie title
        movieTitle = movieTitle.replace(/:/g, '').replace(/\./g, '');
    
        // Format the movie title for the YTS URL
        let formattedMovieTitle = movieTitle.toLowerCase().replace(/ /g, '-'); // Replace spaces with dashes
    
        // Remove multiple consecutive dashes
        formattedMovieTitle = formattedMovieTitle.replace(/-+/g, '-');
    
        // Get the release year from the document title
        const releaseYearMatch = documentTitle.match(/\((\d{4})\)/);
        const releaseYear = releaseYearMatch ? releaseYearMatch[1] : '';
    
        // Construct the YTS URL
        const ytsUrl = `https://yts.mx/movies/${formattedMovieTitle}-${releaseYear}`;
    
        // Open the YTS URL in a new tab
        window.open(ytsUrl, '_blank');
    };

    const redirectToStream = () => {
        const streamUrl = `https://rivestream.vercel.app/watch?type=movie&id=${movieId}`;
    
        // Open the stream URL in a new tab
        window.open(streamUrl, '_blank');
    };
    
    const downloadButton = document.querySelector('.download-btn');
    downloadButton.addEventListener('click', redirectToYTS);
    
    const streamButton = document.querySelector('.stream-btn');
    streamButton.addEventListener('click', redirectToStream);
    


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
                                const tomatometerInfo = document.querySelector('.tomatometer-info');
                                if (tomatometerInfo) {
                                    tomatometerInfo.style.display = 'inline-block';
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
                        <a href="#" class="audienceScore-link">Audience Score</a>
                        `;
                        
                        const audienceScoreLink = audienceScoreElement.querySelector('.audienceScore-link');
                        if (audienceScoreLink) {
                            audienceScoreLink.addEventListener('click', function(event) {
                                event.preventDefault();
                                const audienceInfo = document.querySelector('.audience-info');
                                if (audienceInfo) {
                                    audienceInfo.style.display = 'inline-block';
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
                        }});
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
            return scoreValue >= 60 ? 'assets/images/fresh-audience.svg' : 'assets/images/rotten-audience.svg';
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
