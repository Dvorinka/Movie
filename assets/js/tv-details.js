document.addEventListener('DOMContentLoaded', () => {
    const getShowIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const fetchShowDetails = async (showId) => {
        const url = `https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}&append_to_response=content_ratings,videos`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayShowDetails(data);
            generateMetaTags(data); // Generate meta tags based on show details
            displaySimilarShows(showId); // Fetch and display similar shows
        } catch (error) {
            console.error('Error fetching show details:', error);
        }
    };

    const generateMetaTags = (show) => {
        const metaTags = [
            { property: 'og:title', content: `${show.name} (${new Date(show.first_air_date).getFullYear()})` },
            { property: 'og:description', content: show.overview.length > 300 ? `${show.overview.substring(0, 297)}...` : show.overview },
            { property: 'og:image', content: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'assets/images/default-image.png' },
            { property: 'og:url', content: window.location.href },
            { property: 'og:type', content: 'video.tv_show' }
        ];

        metaTags.forEach(tag => {
            const metaElement = document.createElement('meta');
            metaElement.setAttribute('property', tag.property);
            metaElement.setAttribute('content', tag.content);
            document.head.appendChild(metaElement);
        });
    };

    const displayShowDetails = async (show) => {
        // Update show details
        const showDetailBanner = document.querySelector('.show-detail-banner img');
        const showDetailTitle = document.querySelector('.detail-title');
        const showDetailBadge = document.querySelector('.badge-fill');
        const showDetailGenres = document.querySelector('.ganre-wrapper');
        const showDetailFirstAirDate = document.querySelector('.date-time time[datetime]');

        const showDetailStoryline = document.querySelector('.storyline');
        const showDetailCertification = document.querySelector('.badge-outline');
        const showDetailPosterPath = show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'placeholder-image-url';
        const showDetailYear = new Date(show.first_air_date).getFullYear();
        const showDetailTrailer = show.videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');

        // Update the document title
        document.title = `${show.name} (${showDetailYear})`;

        // Update show banner
        showDetailBanner.src = showDetailPosterPath;
        showDetailBanner.alt = `${show.name} Poster`;

        // Format and update show title
        const titleWords = show.name.split(' ');
        const formattedTitle = `<strong>${titleWords[0]}</strong> ${titleWords.slice(1).join(' ')}`;
        showDetailTitle.innerHTML = formattedTitle;

        // Update other show details
        showDetailBadge.textContent = show.vote_average ? show.vote_average.toFixed(1) : 'NR';
        showDetailGenres.innerHTML = show.genres.map(genre => `<a href="genre-details.html?genreId=${genre.id}" target="_blank">${genre.name}</a>`).join(' ');
        showDetailFirstAirDate.textContent = showDetailYear;
        showDetailFirstAirDate.setAttribute('datetime', show.first_air_date);

        // Update seasons and episodes
        const seasonsCount = show.number_of_seasons;
        const episodesCount = show.number_of_episodes;
        document.getElementById('seasons-count').textContent = `Seasons: ${seasonsCount}`;
        document.getElementById('seasons-count').setAttribute('datetime', seasonsCount);
        document.getElementById('episodes-count').textContent = `Episodes: ${episodesCount}`;
        document.getElementById('episodes-count').setAttribute('datetime', episodesCount);

        showDetailStoryline.textContent = show.overview; // Assign the whole overview

        // Set the background image dynamically
        const showDetail = document.querySelector('.show-detail');
        const showBackdropPath = show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : 'default-backdrop-url';
        showDetail.style.backgroundImage = `url("movie-detail-bg.png"), url(${showBackdropPath})`;

        const creditsUrl = `https://api.themoviedb.org/3/tv/${show.id}/credits?api_key=${apiKey}`;
        try {
            const creditsResponse = await fetch(creditsUrl);
            const creditsData = await creditsResponse.json();
        
            // Get top 5 billed actors
            const actors = creditsData.cast.slice(0, 5);

            // Create comma-separated list of actor names with links
            const actorElements = actors.map(actor => {
                // Assuming actor has a profile_path or image_url property
                const imageUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : 'placeholder.jpg'; // Adjust the image URL as per your data structure
                
                // Get only the first name of the character
                const characterFirstName = actor.character.split(' ')[0];
                
                return `
                    <div>
                        <a href="./people-details.html?id=${actor.id}" target="_blank">
                            <img src="${imageUrl}" alt="${actor.name}">
                            <div class="actors-info">
                            <p>${actor.name}</p>
                        </a>
                        <p>${characterFirstName}</p>
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
        const getCertification = (show) => {
            const userLanguage = navigator.language.split('-')[0]; // Get the language code (e.g., 'en' or 'cs')

            if (show.content_ratings && show.content_ratings.results) {
                let certification = 'NR'; // Default to 'NR' if no certification is found

                // Determine which certification to use based on the user's preferred language
                let ratingInfo;
                if (userLanguage === 'cs') {
                    // Czech language, use certification data for Czech Republic ('CZ')
                    ratingInfo = show.content_ratings.results.find(country => country.iso_3166_1 === 'CZ');
                } else {
                    // Default to English language, use certification data for United States ('US')
                    ratingInfo = show.content_ratings.results.find(country => country.iso_3166_1 === 'US');
                }

                if (ratingInfo && ratingInfo.rating) {
                    certification = ratingInfo.rating;
                }

                if (certification) {
                    // Map the certification codes to their respective ratings and hints
                    switch (certification) {
                        case 'TV-Y':
                            return { rating: 'TV-Y', hint: 'All Children. This program is designed to be appropriate for all children.' };
                        case 'TV-Y7':
                            return { rating: 'TV-Y7', hint: 'Directed to Older Children. This program is designed for children age 7 and above.' };
                        case 'TV-G':
                            return { rating: 'TV-G', hint: 'General Audience. Most parents would find this program suitable for all ages.' };
                        case 'TV-PG':
                            return { rating: 'TV-PG', hint: 'Parental Guidance Suggested. This program contains material that parents may find unsuitable for younger children.' };
                        case 'TV-14':
                            return { rating: 'TV-14', hint: 'Parents Strongly Cautioned. This program contains some material that many parents would find unsuitable for children under 14 years of age.' };
                        case 'TV-MA':
                            return { rating: 'TV-MA', hint: 'Mature Audience Only. This program is specifically designed to be viewed by adults and therefore may be unsuitable for children under 17.' };
                        default:
                            return { rating: certification, hint: 'Rating Description Unavailable' };
                    }
                }
            }
            // If no certification is found, return default values
            return { rating: 'NR', hint: 'Not Rated' };
        };

        const certificationInfo = getCertification(show);
        showDetailCertification.textContent = certificationInfo.rating;

        // Add tooltip for certification hint
        showDetailCertification.setAttribute('title', certificationInfo.hint);
        showDetailCertification.classList.add('tooltip');
        showDetailCertification.addEventListener('mouseover', () => {
            showDetailCertification.classList.add('show-tooltip');
        });
        showDetailCertification.addEventListener('mouseout', () => {
            showDetailCertification.classList.remove('show-tooltip');
        });

        // Add play button functionality for trailer
        if (showDetailTrailer) {
            const playButton = document.querySelector('.play-btn');
            const modal = document.querySelector('.modal');
            const modalContent = document.querySelector('.modal-content');
            const iframe = document.createElement('iframe');
        
            playButton.addEventListener('click', () => {
                modal.style.display = 'block';
                iframe.src = `https://www.youtube.com/embed/${showDetailTrailer.key}?autoplay=1&rel=0&controls=1&showinfo=0&modestbranding=1&autohide=1&vq=hd1080`;
        
                // Add the allowfullscreen attribute to enable fullscreen
                iframe.setAttribute('allowfullscreen', '');
        
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

        const redirectToYTS = () => {
            // Get the show title from the document title
            const documentTitle = document.title;
            let showTitle = documentTitle.split(' (')[0]; // Extract show title from document title
        
            // Remove ":" and "." from the show title
            showTitle = showTitle.replace(/:/g, '').replace(/\./g, '');
        
            // Format the show title for the YTS URL
            let formattedShowTitle = showTitle.toLowerCase().replace(/ /g, '+'); // Replace spaces with dashes
        
            // Remove multiple consecutive dashes
            formattedShowTitle = formattedShowTitle.replace(/-+/g, '+');
        
            // Construct the YTS URL
            const ytsUrl = `https://1337x.to/sort-category-search/${formattedShowTitle}/TV/seeders/desc/1/`;
        
            // Open the YTS URL in a new tab
            window.open(ytsUrl, '_blank');
        };
        
        const downloadButton = document.querySelector('.download-btn');
        downloadButton.addEventListener('click', redirectToYTS);           
    };

    const redirectToStream = () => {
        const streamUrl = `https://rivestream.live//watch?type=tv&id=${showId}&season=1&episode=1`;
    
        // Open the stream URL in a new tab
        window.open(streamUrl, '_blank');
    };
    
    const streamButton = document.querySelector('.stream-btn');
    streamButton.addEventListener('click', redirectToStream);

    const displaySimilarShows = async (showId) => {
        const url = `https://api.themoviedb.org/3/tv/${showId}/recommendations?api_key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const similarShows = data.results.slice(0, 4); // Get the first 4 similar shows
    
            // Check if similarShows array is empty
            if (similarShows.length === 0) {
                // If no similar shows, hide the entire section
                document.querySelector('.tv-series').style.display = 'none';
            } else {
                // Display the section and populate similar shows
                document.querySelector('.tv-series').style.display = 'block';
                displayShows(similarShows);
            }
        } catch (error) {
            console.error('Error fetching similar shows:', error);
            // Handle error if necessary
        }
    };

    const displayShows = (shows) => {
        const showsList = document.querySelector('.shows-list');
        showsList.innerHTML = ''; // Clear existing content
    
        shows.forEach(show => {
            const showItem = document.createElement('li');
            showItem.innerHTML = `
                <div class="movie-card">
                    <a href="./tv-details.html?id=${show.id}">
                        <figure class="card-banner">
                            <img src="https://image.tmdb.org/t/p/w500${show.poster_path}" alt="${show.name} Poster">
                        </figure>
                    </a>
                    <div class="title-wrapper">
                        <a href="./tv-details.html?id=${show.id}">
                            <h3 class="card-title">${show.name}</h3>
                        </a>
                        <time>${new Date(show.first_air_date).getFullYear()}</time> <!-- Display first air year only -->
                    </div>
                    <div class="card-meta">
                        <div class="badge badge-outline">${show.vote_average.toFixed(1)}</div> <!-- Display rating with 1 decimal place -->
                    </div>
                </div>
            `;
            showsList.appendChild(showItem);
        });
    };
    
    const showId = getShowIdFromUrl();
    if (showId) {
        fetchShowDetails(showId);
    }
});