document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        'https://cbnwekzbcxbmeevdjgoq.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
    );

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
            return data; // Return show data for further processing
        } catch (error) {
            console.error('Error fetching show details:', error);
            return null;
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
        const showDetailLastAirDate = document.querySelector('.date-time .last-air-date'); // Assuming you have an element for last air date
    
        const showDetailStoryline = document.querySelector('.storyline');
        const showDetailCertification = document.querySelector('.badge-outline');
        const showDetailPosterPath = show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '../assets/images/placeholder_media.png';
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
        showDetailBadge.addEventListener('click', () => {
            // Redirect the user to the desired URL
            const showId = show.id; // Make sure `show.id` is accessible in this scope
            const url = `./episode-rating.html?id=${showId}`;
            window.location.href = url;
        });
        showDetailBadge.style.cursor = 'pointer';
        showDetailBadge.textContent = show.vote_average ? show.vote_average.toFixed(1) : 'NR';
        showDetailGenres.innerHTML = show.genres.map(genre => `<a href="genre-details.html?genreId=${genre.id}" target="_blank">${genre.name}</a>`).join(' ');
    
        // Determine first air date and last air date
        let firstAirYear = new Date(show.first_air_date).getFullYear();
        let lastAirYear = show.last_air_date ? new Date(show.last_air_date).getFullYear() : null;
        let status = show.status || '';
    
        if (lastAirYear === null || status === 'Returning Series' || status === 'In Production') {
            // Make an additional request to get the full TV show details
            let tvShowDetailsUrl = `https://api.themoviedb.org/3/tv/${show.id}?api_key=${apiKey}&append_to_response=content_ratings,videos`;
            console.log('Fetching TV show details from:', tvShowDetailsUrl); // Debugging line
            let tvShowDetailsResponse = await fetch(tvShowDetailsUrl);
            if (!tvShowDetailsResponse.ok) throw new Error('Network response was not ok');
            let tvShowDetailsData = await tvShowDetailsResponse.json();
            lastAirYear = tvShowDetailsData.last_air_date ? new Date(tvShowDetailsData.last_air_date).getFullYear() : 'Present';
            status = tvShowDetailsData.status || '';
        }
    
        if (status === 'Returning Series' || status === 'In Production') {
            showDetailFirstAirDate.textContent = `${firstAirYear} - Ongoing`;
        } else {
            showDetailFirstAirDate.textContent = `${firstAirYear} - ${lastAirYear}`;
        }
    
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
                const imageUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : '../assets/images/placeholder_person.png'; // Adjust the image URL as per your data structure
                
                // Get only the first name of the character
                const characterFirstName = actor.character.split(' ')[0];
                
                return `
                    <div>
                        <a href="./people-details.html?id=${actor.id}" target="_blank">
                            <img src="${imageUrl}" alt="${actor.name}">
                            <div class="actors-info">
                                <p>${actor.name}</p>
                            </div>
                        </a>
                        <p>${characterFirstName}</p>
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

        const redirectToDownload = () => {
            const showId = getShowIdFromUrl();
            window.location.href = `https://spark.tdvorak.dev/download.html?ns=&show=${showId}`;
        };
        
        const downloadButton = document.querySelector('.download-btn');
        if (downloadButton) {
            downloadButton.addEventListener('click', redirectToDownload);
        }           
    };

    const redirectToStream = (event) => {
        event.preventDefault();  // Prevents the default link behavior
        
        const streamUrl = `https://rivestream.org/embed?type=tv&id=${showId}&season=1&episode=1`;
    
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
    
        if (iframe && !iframe.contains(event.target) && !event.target.closest('.stream-btn')) {
            container.style.display = 'none';  // Hide the stream container
            container.innerHTML = '';  // Clear the iframe content
            document.removeEventListener('click', closeIframeOnClickOutside);  // Remove the event listener
        }
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
                        <div class="badge badge-outline">${show.vote_average.toFixed(1)}</div>
                    </div>
                </div>
            `;
            showsList.appendChild(showItem);
        });
    };
    
    // Function to mark a TV show as watched
    const markAsWatchedFeature = async (show) => {
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
    
            // Select all watched icon containers
            const watchedContainers = document.querySelectorAll('.watched-icon');
            const showImage = document.querySelector('.show-detail-banner img');
            
            if (!showImage) {
                console.error('Show image not found.');
            }
    
            let isWatched = false; // Shared state variable
    
            if (session) {
                // Check if show is watched
                const { data: existing, error: fetchError } = await supabase
                    .from('watched_tv')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('tv_id', show.id);
    
                if (fetchError) {
                    console.error('Error checking watched status:', fetchError);
                    return;
                }
    
                isWatched = existing.length > 0;
    
                // Helper function to update all containers
                const updateAllIcons = () => {
                    watchedContainers.forEach(container => {
                        const link = container.querySelector('a');
                        const icon = container.querySelector('ion-icon');
    
                        if (!link || !icon) return;
    
                        if (isWatched) {
                            applyWatchedStyle(showImage);
                            icon.setAttribute('name', 'eye-off-outline');
                            link.title = 'Unmark as Watched';
                        } else {
                            removeWatchedStyle(showImage);
                            icon.setAttribute('name', 'eye-outline');
                            link.title = 'Mark as Watched';
                        }
                    });
                };
    
                // Initialize all containers with current state
                updateAllIcons();
    
                // Add event listeners
                watchedContainers.forEach(container => {
                    const link = container.querySelector('a');
                    if (!link) return;
    
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
    
                        try {
                            if (isWatched) {
                                // Remove from watched_tv
                                const { error: deleteError } = await supabase
                                    .from('watched_tv')
                                    .delete()
                                    .eq('user_id', session.user.id)
                                    .eq('tv_id', show.id);
    
                                if (deleteError) {
                                    throw deleteError;
                                }
    
                                isWatched = false;
                            } else {
                                // Add to watched_tv
                                const { error: insertError } = await supabase
                                    .from('watched_tv')
                                    .insert({ 
                                        user_id: session.user.id, 
                                        tv_id: show.id, 
                                        tv_title: show.name,
                                        poster_path: show.poster_path,
                                        first_air_date: show.first_air_date
                                    });
    
                                if (insertError) {
                                    throw insertError;
                                }
    
                                isWatched = true;
                            }
    
                            // Update all icons and watcher count
                            updateAllIcons();
                            const updatedCount = await getWatcherCount(show.id);
                            if (updatedCount !== null) {
                                updateWatcherCountDisplay(updatedCount);
                            }
    
                        } catch (err) {
                            console.error('Error toggling watched status:', err);
                            alert('Failed to update watched status.');
                        }
                    });
                });
            } else {
                // Hide all watched icons if no session
                watchedContainers.forEach(container => {
                    const link = container.querySelector('a');
                    if (link) link.style.display = 'none';
                });
            }
    
            // Initialize watcher count
            const watcherCount = await getWatcherCount(show.id);
            if (watcherCount !== null) updateWatcherCountDisplay(watcherCount);
        } catch (err) {
            console.error('Error in markAsWatchedFeature:', err);
        }
    };

    // Function to add/remove TV show from watch later list
    const addToWatchLaterFeature = async (show) => {
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
    
            // Select all watch-later containers
            const watchLaterContainers = document.querySelectorAll('.watch-later-icon');
            const showImage = document.querySelector('.show-detail-banner img');
            
            let isInWatchList = false; // Shared state variable
    
            if (session) {
                // Check if show is in watch later list
                const { data: existing, error: fetchError } = await supabase
                    .from('watch_later_tv')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('tv_id', show.id);
    
                if (fetchError) {
                    console.error('Error checking watch later status:', fetchError);
                    return;
                }
    
                isInWatchList = existing.length > 0;
                
                // Apply or remove watch later label based on current status
                if (isInWatchList && showImage) {
                    applyWatchLaterLabel(showImage);
                } else if (showImage) {
                    removeWatchLaterLabel(showImage);
                }
    
                // Helper function to update all containers
                const updateAllIcons = () => {
                    watchLaterContainers.forEach(container => {
                        const link = container.querySelector('a');
                        const icon = container.querySelector('ion-icon');
    
                        if (!link || !icon) return;
    
                        icon.setAttribute('name', isInWatchList ? 'time' : 'time-outline');
                        link.title = isInWatchList ? 'Remove from Watch Later' : 'Add to Watch Later';
                    });
                };
    
                // Initialize all containers with current state
                updateAllIcons();
    
                // Add event listeners
                watchLaterContainers.forEach(container => {
                    const link = container.querySelector('a');
                    if (!link) return;
    
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
    
                        try {
                            if (isInWatchList) {
                                // Remove from watch_later_tv
                                const { error: deleteError } = await supabase
                                    .from('watch_later_tv')
                                    .delete()
                                    .eq('user_id', session.user.id)
                                    .eq('tv_id', show.id);
    
                                if (deleteError) {
                                    throw deleteError;
                                }
    
                                isInWatchList = false;
                                if (showImage) removeWatchLaterLabel(showImage);
                            } else {
                                // Add to watch_later_tv
                                const { error: insertError } = await supabase
                                    .from('watch_later_tv')
                                    .insert({ 
                                        user_id: session.user.id, 
                                        tv_id: show.id, 
                                        tv_title: show.name,
                                        poster_path: show.poster_path,
                                        first_air_date: show.first_air_date
                                    });
    
                                if (insertError) {
                                    throw insertError;
                                }
    
                                isInWatchList = true;
                                if (showImage) applyWatchLaterLabel(showImage);
                            }
    
                            // Update all icons
                            updateAllIcons();
    
                        } catch (err) {
                            console.error('Error toggling watch later status:', err);
                            alert('Failed to update watch later status.');
                        }
                    });
                });
            } else {
                // Hide all watch-later icons if no session
                watchLaterContainers.forEach(container => {
                    const link = container.querySelector('a');
                    if (link) link.style.display = 'none';
                });
            }
        } catch (error) {
            console.error('An unexpected error occurred:', error);
        }
    };

    // Function to get watcher count for a TV show
    const getWatcherCount = async (showId) => {
        if (!supabase) {
            console.error('Supabase client is not initialized.');
            return null;
        }
    
        try {
            const { data, error } = await supabase
                .from('watched_tv')
                .select('user_id', { count: 'exact' })
                .eq('tv_id', showId);
    
            if (error) {
                console.error('Error fetching watcher count:', error);
                return null;
            }
    
            return data ? data.length : 0;
        } catch (err) {
            console.error('Error in getWatcherCount:', err);
            return null;
        }
    };

    // Function to update watcher count display
    const updateWatcherCountDisplay = (count) => {
        const watcherCountElement = document.querySelector('.watcher-count');
        if (watcherCountElement) {
            watcherCountElement.textContent = count;
        }
    };

    // Function to apply watched style to show image
    const applyWatchedStyle = (image) => {
        if (!image) {
            console.error('Show image not found.');
            return;
        }

        // Apply grayscale filter to the image
        image.style.filter = 'grayscale(1)';

        // Create a "Watched" label
        const watchedLabel = document.createElement('div');
        watchedLabel.textContent = 'Watched';
        watchedLabel.classList.add('watched-label');

        // Ensure the label is added only once
        const parentElement = image.closest('.show-detail-banner');
        if (parentElement && !parentElement.querySelector('.watched-label')) {
            parentElement.appendChild(watchedLabel);
        }
    };

    // Function to remove watched style from show image
    const removeWatchedStyle = (image) => {
        if (!image) {
            console.error('Show image not found.');
            return;
        }

        // Remove grayscale filter from the image
        image.style.filter = 'none';

        // Remove the "Watched" label if it exists
        const parentElement = image.closest('.show-detail-banner');
        const watchedLabel = parentElement.querySelector('.watched-label');
        if (watchedLabel) {
            watchedLabel.remove();
        }
    };
    
    // Function to apply watch later label to show image
    const applyWatchLaterLabel = (image) => {
        if (!image) {
            console.error('Show image not found.');
            return;
        }
        
        // Create a "Planned" label
        const watchLaterLabel = document.createElement('div');
        watchLaterLabel.textContent = 'Planned';
        watchLaterLabel.classList.add('watch-later-label');
        
        // Ensure the label is added only once
        const parentElement = image.closest('.show-detail-banner');
        if (parentElement && !parentElement.querySelector('.watch-later-label')) {
            parentElement.appendChild(watchLaterLabel);
        }
    };
    
    // Function to remove watch later label from show image
    const removeWatchLaterLabel = (image) => {
        if (!image) {
            console.error('Show image not found.');
            return;
        }
        
        // Remove the "Planned" label if it exists
        const parentElement = image.closest('.show-detail-banner');
        const watchLaterLabel = parentElement.querySelector('.watch-later-label');
        if (watchLaterLabel) {
            watchLaterLabel.remove();
        }
    };

    const showId = getShowIdFromUrl();
    if (showId) {
        fetchShowDetails(showId).then(show => {
            // Initialize the watch later and watched features after show details are loaded
            markAsWatchedFeature(show);
            addToWatchLaterFeature(show);
        });
    }
});