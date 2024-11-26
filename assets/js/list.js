document.addEventListener('DOMContentLoaded', async () => {
  console.log("Script loaded and DOM is ready.");

  // Initialize Supabase client
  const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
  );

  // Extract share_link from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const shareLink = params.get('share_link');
  console.log('Extracted shareLink from URL:', shareLink);

  // Handle case where no share_link is provided
  if (!shareLink) {
    console.error('No share_link provided in the URL.');
    document.getElementById('listContainer').innerText = 'Invalid link.';
    return;
  }

  // URL-encode the share_link
  const encodedShareLink = encodeURIComponent(shareLink);
  console.log('URL-encoded shareLink:', encodedShareLink);

  console.log('Attempting to fetch data from Supabase...');

  // Fetch data from Supabase
  const { data, error } = await supabase
    .from('user_lists')
    .select('*')
    .eq('share_link', `"${shareLink}"`) // Ensure the value is passed as a string.
    .maybeSingle();

  console.log('Supabase response:', { data, error });

  // Handle error or missing data
  if (error) {
    console.error('Error fetching data from Supabase:', error);
    document.getElementById('listContainer').innerText = 'Error fetching list.';
    return;
  }

  if (!data) {
    console.warn('No list found for the provided share_link:', shareLink);
    document.getElementById('listContainer').innerText = 'List not found.';
    return;
  }

  console.log('Fetched data:', data);

  // Check if list_items is a string and needs to be parsed
  const listItems = typeof data.list_items === 'string' ? JSON.parse(data.list_items) : data.list_items;

  console.log('List items:', listItems);

  // TMDB API Key
  const tmdbApiKey = 'YOUR_TMDB_API_KEY'; // Replace with your actual TMDB API key

  // Function to fetch movie details from TMDB
  async function fetchMovieDetails(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`);
    const data = await response.json();
    return data;
  }

  // Fetch details for each movie and render the list
  const movieDetailsPromises = listItems.map(async (item) => {
    const movieDetails = await fetchMovieDetails(item.id);
    return {
      ...item,
      movieDetails
    };
  });

  const moviesWithDetails = await Promise.all(movieDetailsPromises);

  // Render the list in the DOM with detailed movie info
  const listContainer = document.getElementById('listContainer');
  listContainer.innerHTML = `
    <h2>${data.list_name}</h2>
    <ul>
      ${moviesWithDetails.map(movie => `
        <li>
            <h3>${movie.movieDetails.title}</h3>
              <a href="movie-details.html?id=${movie.id}">
                <img src="https://image.tmdb.org/t/p/w500${movie.movieDetails.poster_path}" alt="${movie.movieDetails.title}" />
              </a>
            <p>${movie.movieDetails.overview}</p>
            <p>Release Date: ${movie.movieDetails.release_date}</p>
        </li>
      `).join('')}
    </ul>
  `;
  console.log('List rendered successfully.');
});
