document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded and DOM content fully loaded');
    
    // Proxy URLs in rotation order
    const proxies = [
        'https://ytbproxy.tdvorak.dev',
        'https://ytbproxy2.tdvorak.dev',
        'https://ytbproxy3.tdvorak.dev'
    ];

    // Helper function to fetch YouTube data with proxy rotation
    async function fetchYouTubeWithProxy(searchQuery) {
        for (const proxy of proxies) {
            const apiUrl = `${proxy}/youtube?q=${encodeURIComponent(searchQuery)}`;
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    if (response.status === 500) {
                        console.log(`Proxy ${proxy} returned 500, trying next.`);
                        continue;
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                return data; // Return valid data
            } catch (error) {
                console.error(`Error with ${proxy}:`, error);
                if (error instanceof SyntaxError) {
                    console.log('Invalid JSON response, trying next proxy.');
                    continue;
                }
                break; // Stop on unrecoverable error
            }
        }
        return null; // All proxies failed
    }
    

    const getMovieIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const movieId = getMovieIdFromUrl();
    console.log(`Extracted movie ID from URL: ${movieId}`);

    const fetchMovieDetails = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=videos,genres,release_dates`;
        console.log(`Fetching movie details from: ${url}`);
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('Movie details fetched successfully:', data);
            fetchAlternativeTrailer(data.title, data.release_dates);
            if (data.status === "Released") {
                fetchBehindTheScenesVideos(data.title, data.release_dates);
                fetchHowToBeatVideo(data.title, data.release_dates);
                fetchThingsYouMissedVideo(data.title, data.release_dates);
                fetchHistoryVideo(data.title, data.release_dates);
            } else {
                console.log('Movie is not released, skipping additional videos.');
            }
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    };

    const fetchAlternativeTrailer = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} trailer`;
        console.log(`Fetching alternative trailer for query: ${searchQuery}`);
        await fetchYouTubeVideo(searchQuery, '#main-video');
    };

    const fetchBehindTheScenesVideos = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} behind the scenes`;
        console.log(`Fetching behind-the-scenes video for query: ${searchQuery}`);
        await fetchYouTubeVideo(searchQuery, '#behind-the-scenes-video');
    };

    const fetchYouTubeVideoWithChannelCheck = async (searchQuery, containerSelector, allowedChannels) => {
        const data = await fetchYouTubeWithProxy(searchQuery);
        if (data?.video_id && allowedChannels.includes(data.channel_name)) {
            displayVideo(data.video_id, containerSelector);
        } else {
            console.log(`Video for ${searchQuery} is not from an allowed channel.`);
        }
    };

    const fetchHowToBeatVideo = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} how to beat`;
        const allowedChannels = ["How To Beat", "Nerd Explains", "The Film Theorists"];
        await fetchYouTubeVideoWithChannelCheck(searchQuery, '#how-to-beat-video', allowedChannels);
    };

    const fetchThingsYouMissedVideo = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} things you missed`;
        const allowedChannels = ["Screen Rant", "The Film Theorists", "CZsWorld", "Movie Balls Deep", "Heavy Spoilers"];
        await fetchYouTubeVideoWithChannelCheck(searchQuery, '#things-you-missed-video', allowedChannels);
    };

    const fetchHistoryVideo = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const searchQuery = `${movieTitle} ${releaseYear} history`;
        const allowedChannels = ["CZsWorld"];
        await fetchYouTubeVideoWithChannelCheck(searchQuery, '#history-video', allowedChannels);
    };

    const fetchYouTubeVideo = async (searchQuery, containerSelector) => {
        const data = await fetchYouTubeWithProxy(searchQuery);
        if (data?.video_id) {
            displayVideo(data.video_id, containerSelector);
        }
    };

    const displayVideo = (videoId, containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = `
                <iframe 
                    width="560" 
                    height="315" 
                    src="https://www.youtube.com/embed/${videoId}"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                ></iframe>
            `;
        } else {
            console.error(`Container not found: ${containerSelector}`);
        }
    };

    const getReleaseYear = (releaseDates) => {
        if (!releaseDates || !releaseDates.results) return '';
        const releaseInfo = releaseDates.results.find(country => country.iso_3166_1 === 'US');
        if (!releaseInfo || !releaseInfo.release_dates) return '';
        
        // Find theatrical release (type 3)
        const theatricalRelease = releaseInfo.release_dates.find(date => date.type === 3);
        // If no theatrical release, take the first available
        const releaseDateEntry = theatricalRelease || releaseInfo.release_dates[0];
        if (!releaseDateEntry) return '';
        
        const releaseDate = releaseDateEntry.release_date;
        if (!releaseDate) return '';
        
        const date = new Date(releaseDate);
        // Check if the parsed date is valid
        if (isNaN(date.getFullYear())) {
            console.error(`Invalid release date: ${releaseDate}`);
            return '';
        }
        
        return date.getFullYear().toString(); // Return as string for safe interpolation
    };

    if (movieId) {
        fetchMovieDetails(movieId);
    }
});