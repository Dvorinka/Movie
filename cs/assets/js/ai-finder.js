const API_KEY = "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"; // AI model API Key
const TMDB_API_KEY = "054582e9ee66adcbe911e0008aa482a8"; // TMDB API Key
const ENDPOINT = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";
const TMDB_ENDPOINT = "https://api.themoviedb.org/3/search/movie&language=cs-CZ";

async function getAIResponse(userInput, agePreference) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
    };

    const ageSuffix = agePreference === "newer" ? "The movie is newer." : "The movie is older.";
    const data = {
        inputs: `User describes a movie: "${userInput}". ${ageSuffix} Suggest possible matches. Respond only with a list of titles and years formatted as "Title (Year)", separated by new lines. Return exactly 5 suggestions.`
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            const aiResponse = jsonResponse[0].generated_text.trim();

            // Validate and sanitize the response
            const suggestions = aiResponse
                .split('\n') // Split by new lines
                .filter(item => item.match(/^(.*)\s\((\d{4})\)$/)) // Match "Title (Year)"
                .slice(0, 5); // Limit to 5 results

            return suggestions.length > 0 ? suggestions : ["No valid suggestions found."];
        } else {
            const errorResponse = await response.json();
            if (errorResponse.error && errorResponse.error.includes("currently loading")) {
                throw new Error("The AI model is currently loading. Please try again in a few seconds.");
            } else {
                console.error("Error:", response.status, await response.text());
                throw new Error("Failed to fetch AI response.");
            }
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        throw new Error("An error occurred while connecting to the AI service.");
    }
}

async function getMovieDetails(title) {
    const movieTitle = title.split('(')[0].trim();
    const year = title.split('(')[1].split(')')[0];
    const url = `${TMDB_ENDPOINT}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&year=${year}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const movie = data.results[0]; // Get the first match
            return {
                title: movie.title,
                year: movie.release_date.split('-')[0],
                overview: movie.overview,
                poster: `https://image.tmdb.org/t/p/w200${movie.poster_path}`, // Poster image URL
                id: movie.id // TMDB movie ID
            };
        } else {
            return { title: movieTitle, year: year, overview: 'No overview available', poster: '', id: null };
        }
    } catch (error) {
        console.error("Error fetching movie details:", error);
        return { title: movieTitle, year: year, overview: 'No overview available', poster: '', id: null };
    }
}

document.getElementById('movie-finder-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const description = document.getElementById('description').value;
    const movieAge = document.getElementById('movie-age').value; // Get the age preference
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Searching...';

    try {
        const aiResponse = await getAIResponse(description, movieAge);

        const movieDetailsPromises = aiResponse.map(async (movie) => {
            const movieData = await getMovieDetails(movie);
            return movieData;
        });

        const movieDetails = await Promise.all(movieDetailsPromises);

        // Create HTML for displaying the movie details with clickable links
        const movieListHTML = movieDetails.map(movie => {
            if (movie.id) {
                return `
                    <li class="movie-item">
                        <a href="movie-details.html?id=${movie.id}">
                            <div class="movie-poster">
                                ${movie.poster ? `<img src="${movie.poster}" alt="${movie.title} poster" />` : ''}
                            </div>
                            <div class="movie-info">
                                <h3>${movie.title} (${movie.year})</h3>
                                <p>${movie.overview}</p>
                            </div>
                        </a>
                    </li>
                `;
            } else {
                return `
                    <li>
                        <h3>${movie.title} (${movie.year})</h3>
                        <p>${movie.overview}</p>
                    </li>
                `;
            }
        }).join('');

        resultsDiv.innerHTML = `<ul>${movieListHTML}</ul>`;
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = error.message;
    }
});

const descriptionTextarea = document.getElementById('description');
const charCounter = document.getElementById('char-counter');

descriptionTextarea.addEventListener('input', () => {
    const currentLength = descriptionTextarea.value.length;
    charCounter.textContent = `${currentLength}/50`;
});