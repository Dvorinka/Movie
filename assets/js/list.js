// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU' // Replace with your Supabase anonymous key
  );
  
  const API_KEY = '054582e9ee66adcbe911e0008aa482a8';  // Replace with your TMDb API key
  const BASE_URL = 'https://api.themoviedb.org/3';
  
  // TMDb API calls
  async function searchMovies(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    return data.results;
  }
  
  async function searchTVShows(query) {
    const response = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    return data.results;
  }
  
  async function getMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    const data = await response.json();
    return data;
  }
  
  async function getTVShowDetails(tvShowId) {
    const response = await fetch(`${BASE_URL}/tv/${tvShowId}?api_key=${API_KEY}`);
    const data = await response.json();
    return data;
  }
  
  // Create a new list
async function createList(listName, privacy) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
  
    if (userError || !userData) {
      console.error("User is not authenticated!", userError);
      return;
    }
  
    // Generate a unique share link for public lists
    let shareLink = null;
    if (privacy === 'public') {
      shareLink = generateShareLink();
    }
  
    const { data, error } = await supabase
      .from('user_lists')
      .insert([
        {
          user_id: userData.id, // Use the userData object to get the user ID
          list_name: listName,
          list_items: [], // Empty initially
          privacy: privacy,
          share_link: shareLink
        }
      ]);
  
    if (error) {
      console.error('Error creating list:', error.message);
    } else {
      console.log('List created:', data);
    }
  }  
  
  // Add movie/TV show to the list
  async function addToList(listId, item) {
    const { data, error } = await supabase
      .from('user_lists')
      .update({ list_items: supabase.raw('array_append(list_items, ?)', [item]) })
      .eq('id', listId);
  
    if (error) {
      console.error('Error adding item to list:', error.message);
    } else {
      console.log('Item added to list:', data);
    }
  }
  
  // Set the privacy of the list
  async function setPrivacy(listId, privacy) {
    const { data, error } = await supabase
      .from('user_lists')
      .update({ privacy: privacy })
      .eq('id', listId);
  
    if (error) {
      console.error('Error setting privacy:', error.message);
    } else {
      console.log('Privacy set to:', privacy);
    }
  }
  
  // Generate a unique share link for public lists
  function generateShareLink() {
    const randomId = Math.random().toString(36).substring(2, 15); // Random string
    return `https://yourwebsite.com/list/${randomId}`;
  }
  
  // Display a list (for public lists)
  async function viewList(listId) {
    const { data, error } = await supabase
      .from('user_lists')
      .select('*')
      .eq('id', listId)
      .single();
  
    if (error) {
      console.error('Error fetching list:', error.message);
    } else {
      console.log('List data:', data);
      if (data.privacy === 'public') {
        console.log('Shareable link:', data.share_link);
      }
    }
  }
  
  // Search for a movie or TV show and add it to the list
  async function searchAndAddToList(query, listId, isMovie = true) {
    let searchResults;
    if (isMovie) {
      searchResults = await searchMovies(query);
    } else {
      searchResults = await searchTVShows(query);
    }
  
    if (searchResults && searchResults.length > 0) {
      const firstResult = searchResults[0];
      const item = {
        id: firstResult.id,
        title: isMovie ? firstResult.title : firstResult.name,
        poster_path: firstResult.poster_path
      };
      
      // Add to the list
      addToList(listId, item);
    } else {
      console.error('No results found.');
    }
  }
  
  // Event listeners for handling forms
  
  // Handle creating a new list
  document.getElementById('createListForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const listName = document.getElementById('listName').value;
    const privacy = document.getElementById('privacySelect').value;
    createList(listName, privacy);
  });
  
  // Handle adding an item to a list
  document.getElementById('addToListForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const searchQuery = document.getElementById('searchQuery').value;
    const listId = document.getElementById('listId').value;
    const typeSelect = document.getElementById('typeSelect').value;
    const isMovie = typeSelect === 'movie';
    searchAndAddToList(searchQuery, listId, isMovie);
  });
  
  // Handle changing privacy settings
  document.getElementById('setPrivacyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const listId = document.getElementById('privacyListId').value;
    const newPrivacy = document.getElementById('newPrivacySelect').value;
    setPrivacy(listId, newPrivacy);
  });
  
  // Handle viewing a public list
  document.getElementById('viewListForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const listId = document.getElementById('viewListId').value;
    viewList(listId);
  });
  