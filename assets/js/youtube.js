document.addEventListener('DOMContentLoaded', () => {
    const apiKeyYouTube = 'AIzaSyCcZdOoNkXMisFgQgA-KzWS3tHWHAekSaA'; // Replace with your YouTube API key

    const getMovieIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const movieId = getMovieIdFromUrl();

    const fetchMovieDetails = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=videos`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMovieBackdrop(data.backdrop_path);
            fetchAlternativeTrailer(data.title, data.release_dates, data.videos.results);
            fetchBehindTheScenesVideos(data.title, data.release_dates);
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    };

    const displayMovieBackdrop = (backdrops) => {
        if (!backdrops || backdrops.length === 0) {
            console.log('No backdrops found.');
            return;
        }

        const backdropPath = backdrops.length > 1 ? backdrops[1].file_path : backdrops[0].file_path;
        const movieBackdropUrl = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : 'default-backdrop-url';

        const movieDetail = document.querySelector('.left-column');
        movieDetail.style.background = `url("../images/movie-detail-bg.png") no-repeat center center, url("${movieBackdropUrl}") no-repeat center top`;
        movieDetail.style.backgroundSize = 'cover, cover';
        movieDetail.style.backgroundPosition = 'center, center';
        movieDetail.style.backgroundRepeat = 'no-repeat, no-repeat';
    };

    const fetchAlternativeTrailer = async (movieTitle, releaseDates, existingTrailers) => {
        const releaseYear = getReleaseYear(releaseDates);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(movieTitle)}+${releaseYear}+trailer&key=${apiKeyYouTube}&type=video&maxResults=10`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const videos = data.items;

            const alternativeTrailers = videos.filter(video => {
                const title = video.snippet.title.toLowerCase();
                return !existingTrailers.some(trailer => trailer.name.toLowerCase().includes(title));
            });

            alternativeTrailers.sort((a, b) => a.snippet.publishedAt.localeCompare(b.snippet.publishedAt));

            if (alternativeTrailers.length > 1) {
                const videoId = alternativeTrailers[1].id.videoId; // Second alternative trailer
                displayVideo(videoId, '#main-video'); // Targeting the main-video div
            } else if (alternativeTrailers.length > 0) {
                const videoId = alternativeTrailers[0].id.videoId;
                displayVideo(videoId, '#main-video');
            } else {
                console.log('No alternative trailer found.');
            }
        } catch (error) {
            console.error('Error fetching alternative trailer:', error);
        }
    };

    const fetchBehindTheScenesVideos = async (movieTitle, releaseDates) => {
        const releaseYear = getReleaseYear(releaseDates);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(movieTitle)}+${releaseYear}+behind+the+scenes&key=${apiKeyYouTube}&type=video&maxResults=1`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const videos = data.items;

            if (videos.length > 0) {
                const videoId = videos[0].id.videoId;
                displayVideo(videoId, '#behind-the-scenes-video'); // Targeting the behind-the-scenes-video div
            } else {
                console.log('No behind-the-scenes video found.');
            }
        } catch (error) {
            console.error('Error fetching behind-the-scenes video:', error);
        }
    };

    const displayVideo = (videoId, containerSelector) => {
        const container = document.querySelector(containerSelector);
    
        if (!container) {
            console.error(`Container not found for selector: ${containerSelector}`);
            return;
        }
    
        // Remove any existing iframe to avoid duplicates
        const existingIframe = container.querySelector('iframe');
        if (existingIframe) {
            existingIframe.remove();
        }
    
        // Create and append the new iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&controls=1&showinfo=0&modestbranding=1&autohide=1&vq=hd1080`;
        iframe.setAttribute('allowfullscreen', '');
        container.appendChild(iframe);
    };
    

    const getReleaseYear = (releaseDates) => {
        if (!releaseDates || !releaseDates.results) return '';
        const releaseInfo = releaseDates.results.find(country => country.iso_3166_1 === 'US');
        if (!releaseInfo || !releaseInfo.release_dates || releaseInfo.release_dates.length === 0) return '';
        return new Date(releaseInfo.release_dates[0].release_date).getFullYear();
    };

    if (movieId) {
        fetchMovieDetails(movieId);
    }
});
