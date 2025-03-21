import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Set CORS headers to allow access from your domain
  const headers = {
    "Access-Control-Allow-Origin": "*", // Specify your domain
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization", // Include Authorization header
  };

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No content for preflight
      headers: headers,
    });
  }

  const url = new URL(req.url);
  const movieId = url.searchParams.get("details");

  if (!movieId) {
    return new Response("Movie ID missing", { status: 400, headers });
  }

  // Fetch the TMDB API key from environment secrets
  const tmdbApiKey = Deno.env.get("tmdb_api");

  if (!tmdbApiKey) {
    return new Response("TMDB API key not set", { status: 500, headers });
  }

  const tmdbUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`;

  const response = await fetch(tmdbUrl);
  const movie = await response.json();

  // Log the movie data for debugging purposes
  console.log(movie);

  // Handle movie not found or TMDB error
  if (movie.status_code && movie.status_code === 34) {
    return new Response("Movie not found", { status: 404, headers });
  }

  // Check if required fields are available
  if (!movie.title || !movie.overview || !movie.poster_path) {
    return new Response("Invalid movie data", { status: 404, headers });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta property="og:title" content="${movie.title}">
      <meta property="og:description" content="${movie.overview}">
      <meta property="og:image" content="https://image.tmdb.org/t/p/original${movie.poster_path}">
      <meta property="og:url" content="https://spark.tdvorak.dev/movie-details.html?id=${movieId}">
      <meta name="twitter:card" content="summary_large_image">
    </head>
    <body>
      <h1>${movie.title}</h1>
      <p>${movie.overview}</p>
      <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html", ...headers },
  });
});