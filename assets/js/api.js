const apiKey = NEXT_PUBLIC_API_KEY;
const omdbApiKey = NEXT_PUBLIC_OMDB_API_KEY;
const upcomingMoviesUrl = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=en-US&region=US&with_release_type=2&page=1`;
const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
const imageBaseUrl = NEXT_PUBLIC_IMAGE_BASE_URL;
const imageBannerUrl = NEXT_PUBLIC_IMAGE_BANNER_URL;
const baseApiUrl = NEXT_PUBLIC_BASE_API_URL;
const ytsBaseUrl = NEXT_PUBLIC_YTS_BASE_URL;
const accountID = NEXT_PUBLIC_ACCOUNT_ID;
const accessToken = NEXT_PUBLIC_ACCESS_TOKEN;

// Example usage
console.log("API Key:", apiKey);
console.log("OMDB API Key:", omdbApiKey);
