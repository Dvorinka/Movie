document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded and DOM content fully loaded');

    const getMovieIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const movieId = getMovieIdFromUrl();
    console.log(`Extracted movie ID from URL: ${movieId}`);

    const fetchMovieDetails = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=videos`;
        console.log(`Fetching movie details from: ${url}`);
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('Movie details fetched successfully:', data);
            fetchAlternativeTrailer(data.title, data.release_dates);
            fetchBehindTheScenesVideos(data.title, data.release_dates);
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    };

    const fetchAlternativeTrailer = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} trailer`;
        console.log(`Fetching alternative trailer for query: ${searchQuery}`);
        fetchYouTubeVideo(searchQuery, '#main-video');
    };

    const fetchBehindTheScenesVideos = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} behind the scenes`;
        console.log(`Fetching behind-the-scenes video for query: ${searchQuery}`);
        fetchYouTubeVideo(searchQuery, '#behind-the-scenes-video');
    };

    const fetchYouTubeVideo = async (searchQuery, containerSelector) => {
        const apiUrl = `https://ytbproxy.tdvorak.dev/youtube?q=${encodeURIComponent(searchQuery)}`;
        console.log(`Fetching YouTube video ID from API: ${apiUrl}`);
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log('YouTube video ID fetched successfully:', data);
            if (data.video_id) {
                const videoId = data.video_id;
                console.log(`Extracted video ID: ${videoId}`);
                displayVideo(videoId, containerSelector);
            } else {
                console.error('No video ID found in API response.');
            }
        } catch (error) {
            console.error('Error fetching YouTube video ID:', error);
        }
    };

    const displayVideo = (videoId, containerSelector) => {
        console.log(`Displaying video with ID: ${videoId} in ${containerSelector}`);
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error(`Container not found for selector: ${containerSelector}`);
            return;
        }
        container.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    };

    const getReleaseYear = (releaseDates) => {
        console.log('Extracting release year from movie data');
        if (!releaseDates || !releaseDates.results) return '';
        const releaseInfo = releaseDates.results.find(country => country.iso_3166_1 === 'US');
        return releaseInfo && releaseInfo.release_dates.length > 0 
            ? new Date(releaseInfo.release_dates[0].release_date).getFullYear() 
            : '';
    };

    if (movieId) {
        fetchMovieDetails(movieId);
    }
});