// movie-details.js
document.addEventListener('DOMContentLoaded', () => {
    const sparkApiUrl = "https://goapi.tdvorak.dev";

    // Initialize Supabase client
    const supabase = window.supabase.createClient(
        'https://cbnwekzbcxbmeevdjgoq.supabase.co', // Replace with your Supabase URL
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase public API key
    );

  
    const getMovieIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const showPreloader = () => {
        document.getElementById("preloader").style.display = "flex";
    };
    
    const hidePreloader = () => {
        document.getElementById("preloader").style.display = "none";
    };

    const getBucketName = () => "scraped-movie";

    const fetchFromSupabase = async (movieId) => {
        const bucket = getBucketName();
        console.log(`[INFO] Attempting to fetch movie data from Supabase bucket: ${bucket} with movie id: ${movieId}`);
        try {
            const { data, error } = await supabase
                .storage
                .from(bucket)
                .download(`${movieId}.json`);

            if (error) {
                console.error("[ERROR] Supabase download error:", error);
                return null;
            }
            const text = await data.text();
            const jsonData = JSON.parse(text);
            console.log("[INFO] Successfully fetched data from Supabase for movie id:", movieId);
            return jsonData;
        } catch (err) {
            console.error("[ERROR] Exception fetching from Supabase:", err);
            return null;
        }
    };


    const fetchMovieDetails = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=release_dates,videos`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            displayMovieDetails(data);
            fetchAIRating(movieId);
            fetchMovieData(movieId); // Fetch and display similar movies
            displaySimilarMovies(movieId); // Fetch and display similar movies
            displayRatings(movieId); // Fetch and display similar movies
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    };

    const fetchMovieData = async (movieId) => {
        showPreloader();
        let data;
    
        // List of movie IDs to fetch directly from Supabase without background scraping
        const directFetchMovieIds = [591273]; // Add more movie IDs here as needed
    
        if (directFetchMovieIds.includes(movieId)) {
            // Fetch data only from Supabase for specified movie IDs
            data = await fetchFromSupabase(movieId);
            if (data) {
                console.log("[INFO] Fetched movie data from Supabase Storage for movie id:", movieId);
            } else {
                console.log("[INFO] No data in Supabase for movie id:", movieId);
            }
        } else {
            // For other movie IDs, follow the existing logic
            data = await fetchFromSupabase(movieId);
            if (data) {
                console.log("[INFO] Fetched movie data from Supabase Storage for movie id:", movieId);
            } else {
                console.log("[INFO] No data in Supabase, scraping new data for movie id:", movieId);
                try {
                    const response = await fetch(`${sparkApiUrl}/movie/${movieId}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    data = await response.json();
                    console.log("[INFO] Scraped new movie data from API for movie id:", movieId);
                } catch (error) {
                    console.error(`[ERROR] Error fetching movie data from API for movie id: ${movieId}`, error);
                }
            }
        }
    
        if (data) {
            if (data.ai_score !== undefined) {
                displayAIRating(data.ai_score);
            }
            displayRatings(data);
    
            // Fire background scraping request without waiting for its result
            if (!directFetchMovieIds.includes(movieId)) { // Only scrape in background for non-specified movie IDs
                fetch(`${sparkApiUrl}/movie/${movieId}`)
                    .then(() => console.log(`[INFO] Background scraping completed for movie id: ${movieId}`))
                    .catch(err => console.error(`[ERROR] Background scraping error for movie id: ${movieId}`, err));
            }
        }
    
        hidePreloader();
    };

    const fetchAIRating = async (movieId) => {
        showPreloader();
        let data = null;
        try {
            data = await fetchFromSupabase(movieId);
            if (data) {
                console.log("[INFO] Fetched AI rating from Supabase Storage for movie id:", movieId);
            } else {
                console.log("[INFO] AI rating not found in Supabase Storage, scraping new data for movie id:", movieId);
                const response = await fetch(`${sparkApiUrl}/movie/${movieId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                data = await response.json();
                console.log("[INFO] Scraped new AI rating data from API for movie id:", movieId);
            }
            if (data.ai_score !== undefined) {
                displayAIRating(data.ai_score);
            } else {
                console.warn("[WARN] AI score not found in the response for movie id:", movieId);
            }
        } catch (error) {
            console.error("[ERROR] Error fetching AI rating for movie id:", movieId, error);
        } finally {
            hidePreloader();
        }
    };

    const displayAIRating = (aiScore) => {
        const aiRatingElement = document.querySelector('#ai-rating');
        const aiBadgeElement = document.querySelector('.ai-rating-badge');
    
        if (aiRatingElement) {
            aiRatingElement.textContent = aiScore !== undefined && aiScore !== null ? aiScore : "N/A";
        } else {
            console.error('Element with id #ai-rating not found in the DOM.');
        }
    
    
        if (aiBadgeElement) {
            let rightPosition = '122px'; // Default position
    
            if (aiScore === 100) {
                rightPosition = '116px';
            } else if (aiScore === 0) {
                rightPosition = '133px';
            }
    
            aiBadgeElement.style.right = rightPosition;
        } else {
            console.error('Element with class .ai-rating-badge not found in the DOM.');
        }
    };

    const displayRatings = (data) => {
        // Define SVG images
        const freshSvg = '<img src="assets/images/fresh-audience.svg" alt="Fresh Audience">';
        const midSvg = '<img src="assets/images/mid-audience.svg" alt="Mid Audience">';
        const rottenSvg = '<img src="assets/images/rotten-audience.svg" alt="Rotten Audience">';
        const unknownSvg = '<img src="assets/images/unknown-audience.svg" alt="Unknown Audience">';
    
        const freshCriticsSvg = '<img src="assets/images/fresh-critics.svg" alt="Fresh Critics">';
        const midCriticsSvg = '<img src="assets/images/mid-critics.svg" alt="Mid Critics">';
        const rottenCriticsSvg = '<img src="assets/images/rotten-critics.svg" alt="Rotten Critics">';
        const unknownCriticsSvg = '<img src="assets/images/unknown-critics.svg" alt="Unknown Critics">';
    
        // Rotten Tomatoes
        const tomatometerElement = document.querySelector('#tomatometer');
        const popcornmeterElement = document.querySelector('#popcornmeter');
    
        if (tomatometerElement) {
            const criticScore = data.rotten_tomatoes.critic_score;
            const criticCertifiedFresh = data.rotten_tomatoes.critic_certified_fresh;
            let svgImage = unknownCriticsSvg;
            let scoreText = "N/A";
    
            if (criticScore !== undefined) {
                scoreText = `${criticScore}`;
                const scoreValue = parseFloat(criticScore);
    
                if (criticCertifiedFresh) {
                    svgImage = freshCriticsSvg;
                } else if (scoreValue >= 60) {
                    svgImage = midCriticsSvg;
                } else {
                    svgImage = rottenCriticsSvg;
                }
            }
    
            tomatometerElement.innerHTML = `
              <div class="tomatometer">
                ${svgImage}
                <p class="score-value">${scoreText}</p>
                <a>Tomatometer</a>
              </div>
            `;
        } else {
            console.error('Element with id #tomatometer not found in the DOM.');
        }
    
        if (popcornmeterElement) {
            const audienceScore = data.rotten_tomatoes.audience_score;
            const audienceCertifiedFresh = data.rotten_tomatoes.audience_certified_fresh;
            let svgImage = unknownSvg;
            let scoreText = "N/A";
    
            if (audienceScore !== undefined) {
                scoreText = `${audienceScore}`;
                const scoreValue = parseFloat(audienceScore);
    
                if (audienceCertifiedFresh) {
                    svgImage = freshSvg;
                } else if (scoreValue >= 60) {
                    svgImage = midSvg;
                } else {
                    svgImage = rottenSvg;
                }
            }
    
            popcornmeterElement.innerHTML = `
              <div class="audience-score">
                ${svgImage}
                <p class="score-value">${scoreText}</p>
                <a>Popcornmeter</a>
              </div>
            `;
        } else {
            console.error('Element with id #popcornmeter not found in the DOM.');
        }
    
        // Metacritic
        const metascoreElement = document.querySelector('#metascore');
        const userscoreElement = document.querySelector('#userscore');
    