// people-details.js
// Fetch and display person details from TMDB

document.addEventListener('DOMContentLoaded', async () => {
  const tmdbBase = 'https://api.themoviedb.org/3';
  const imgBase = 'https://image.tmdb.org/t/p/w500';

  function getPersonIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function createKnownForCard(item) {
    const title = item.title || item.name || '';
    const poster = item.poster_path ? imgBase + item.poster_path : '../assets/images/placeholder_person.png';
    const link = item.media_type === 'movie' ? `movie-details.html?id=${item.id}` : (item.media_type === 'tv' ? `tv-details.html?id=${item.id}` : '#');
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const character = item.character ? `<div class="card-character">${item.character}</div>` : '';
    return `
      <a href="${link}" class="known-for-card">
        <img src="${poster}" alt="${title}" />
        <div class="card-info">
            <div class="known-for-title" title="${title}">${title}</div>
            <div class="card-meta">
                ${year ? `<span>${year}</span>` : ''}
                <span class="badge">${rating}</span>
            </div>
            ${character}
        </div>
      </a>
    `;
  }

  function createFeaturedCard(item) {
    const title = item.title || item.name || '';
    const poster = item.poster_path ? imgBase + item.poster_path : '../assets/images/placeholder_person.png';
    const link = item.media_type === 'movie' ? `movie-details.html?id=${item.id}` : (item.media_type === 'tv' ? `tv-details.html?id=${item.id}` : '#');
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const character = item.character ? `<div class="card-character">${item.character}</div>` : '';
    return `
      <a href="${link}" class="featured-card">
        <img src="${poster}" alt="${title}" />
        <div class="card-info">
            <div class="featured-title" title="${title}">${title}</div>
            <div class="card-meta">
                ${year ? `<span>${year}</span>` : ''}
                <span class="badge">${rating}</span>
            </div>
            ${character}
        </div>
      </a>
    `;
  }

  function createLatestCard(item) {
    const title = item.title || item.name || '';
    const poster = item.poster_path ? imgBase + item.poster_path : '../assets/images/placeholder_person.png';
    const link = item.media_type === 'movie' ? `movie-details.html?id=${item.id}` : (item.media_type === 'tv' ? `tv-details.html?id=${item.id}` : '#');
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const character = item.character ? `<div class="card-character">${item.character}</div>` : '';
    return `
      <a href="${link}" class="featured-card">
        <img src="${poster}" alt="${title}" />
        <div class="card-info">
            <div class="featured-title" title="${title}">${title}</div>
            <div class="card-meta">
                ${year ? `<span>${year}</span>` : ''}
                <span class="badge">${rating}</span>
            </div>
            ${character}
        </div>
      </a>
    `;
  }

  function createImageCard(file, idx, allImages) {
    const url = file.file_path ? imgBase + file.file_path : '../assets/images/placeholder_person.png';
    // Use data-index for gallery
    return `<a href="javascript:void(0)" class="person-image-thumb-link" data-gallery-index="${idx}">
        <img src="${url}" class="person-image-thumb" alt="Person image" />
    </a>`;
  }

  function createVideoCard(video) {
    if (video.site === 'YouTube') {
      return `<iframe width="320" height="180" src="https://www.youtube.com/embed/${video.key}" frameborder="0" allowfullscreen></iframe>`;
    }
    return '';
  }

  async function fetchPersonDetails(personId) {
    const res = await fetch(`${tmdbBase}/person/${personId}?api_key=${apiKey}&language=en-US`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function fetchPersonCombinedCredits(personId) {
    const res = await fetch(`${tmdbBase}/person/${personId}/combined_credits?api_key=${apiKey}&language=en-US`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function fetchPersonImages(personId) {
    const res = await fetch(`${tmdbBase}/person/${personId}/images?api_key=${apiKey}`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function fetchPersonVideos(personId) {
    // TMDB does not provide person videos directly, but we can try to fetch tagged videos
    const res = await fetch(`${tmdbBase}/person/${personId}/tagged_images?api_key=${apiKey}`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function fetchPersonExternalIds(personId) {
    const res = await fetch(`${tmdbBase}/person/${personId}/external_ids?api_key=${apiKey}`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function fetchPersonVideosFromYoutube(personName) {
    // Try to fetch YouTube videos (interviews, etc.) about the person
    // This is a fallback using YouTube search embed (no API key required)
    // Returns an array of embed URLs
    if (!personName) return [];
    // Use YouTube search embed for interviews
    const searchQueries = [
        `${personName} interview`,
        `${personName} behind the scenes`,
        `${personName} talk show`
    ];
    // Return up to 2 embed URLs
    return searchQueries.map(q =>
        `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}`
    );
}

  // Pagination state
  let currentFeaturedPage = 1;
  let currentLatestPage = 1;
  const ITEMS_PER_PAGE = 12;
  let allFeaturedItems = [];
  let allLatestItems = [];

  async function renderPersonPage(personId, featuredPage = 1, latestPage = 1) {
    currentFeaturedPage = featuredPage;
    currentLatestPage = latestPage;
    
    setText('person-name', 'Loading...');
    setText('person-biography', 'Loading...');
    setText('person-born', '');
    
    // Only clear these on initial load, not on pagination
    if (featuredPage === 1) {
      setHTML('person-featured-list', '');
      allFeaturedItems = [];
    }
    if (latestPage === 1) {
      setHTML('person-latest-list', '');
      allLatestItems = [];
    }
    
    setHTML('person-images-list', '');
    setHTML('person-videos-list', '');

    // Fetch all data in parallel
    const [person, credits, images, externalIds] = await Promise.all([
      fetchPersonDetails(personId),
      fetchPersonCombinedCredits(personId),
      fetchPersonImages(personId),
      fetchPersonExternalIds(personId)
    ]);

    if (!person) {
      setText('person-name', 'Not found');
      return;
    }

    // Profile image
    const profileImg = person.profile_path ? imgBase + person.profile_path : '../assets/images/placeholder_person.png';
    const profileEl = document.getElementById('person-profile');
    if (profileEl) {
      profileEl.src = profileImg;
      profileEl.alt = person.name;
    }

    // Name
    const personName = person.name || 'Unknown';
    setText('person-name', personName);
    
    // Update page title with name and birth year
    const birthYear = person.birthday ? ` (${person.birthday.split('-')[0]})` : '';
    document.title = `${personName} ${birthYear} - Person Details`;

    // Biography
    setText('person-biography', person.biography || 'No biography available.');

    // Born
    let born = '';
    if (person.birthday) {
      born += `Born: ${person.birthday}`;
      if (person.place_of_birth) born += ` in ${person.place_of_birth}`;
    }
    if (person.deathday) {
      born += `<br>Died: ${person.deathday}`;
    }
    setHTML('person-born', born);

    // Process all credits
    if (credits && credits.cast && credits.cast.length > 0) {
      // Sort all credits by popularity (or another metric) and store them
      const sortedCredits = [...credits.cast].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      
      // Split into featured and latest (or use different criteria if needed)
      allFeaturedItems = [...sortedCredits];
      allLatestItems = [...sortedCredits].sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '';
        const dateB = b.release_date || b.first_air_date || '';
        return new Date(dateB) - new Date(dateA);
      });
      
      // Render the current page of items
      renderFeaturedItems();
      renderLatestItems();
      const sorted = credits.cast.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      const featured = sorted.slice(0, 12);
      setHTML('person-featured-list', featured.map(createFeaturedCard).join(''));
    } else {
      setHTML('person-featured-list', '<div>No featured works found.</div>');
    }

    // Latest Appearances are now handled by the renderLatestItems function

    // Images
    if (images && images.profiles && images.profiles.length > 0) {
      // Prepare array of URLs for gallery
      const imgUrls = images.profiles.slice(0, 12).map(file => file.file_path ? imgBase + file.file_path : '../assets/images/placeholder_person.png');
      setHTML('person-images-list', images.profiles.slice(0, 12).map((file, idx) => createImageCard(file, idx, imgUrls)).join(''));
      // Add gallery modal logic
      setTimeout(() => {
        const links = document.querySelectorAll('.person-image-thumb-link');
        links.forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const idx = parseInt(this.getAttribute('data-gallery-index'), 10);
            openGallery(imgUrls, idx);
          });
        });
      }, 0);
    } else {
      setHTML('person-images-list', '<div>No images found.</div>');
    }

    // Videos: show trailers from "Featured" movies/TV (top 6 by vote count)
    let videoHtml = '';
    let foundVideos = false;
    let featured = [];
    if (credits && credits.cast && credits.cast.length > 0) {
      // Sort by vote count for "featured"
      featured = credits.cast.slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 6);
      for (let i = 0; i < featured.length; i++) {
        const item = featured[i];
        const type = item.media_type;
        const id = item.id;
        let url = '';
        if (type === 'movie') url = `${tmdbBase}/movie/${id}/videos?api_key=${apiKey}`;
        else if (type === 'tv') url = `${tmdbBase}/tv/${id}/videos?api_key=${apiKey}`;
        if (url) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data.results && data.results.length > 0) {
                // Only include trailers, teasers, or featurettes
                const filtered = data.results.filter(
                  v => v.site === 'YouTube' && (
                    v.type === 'Trailer' ||
                    v.type === 'Teaser' ||
                    v.type === 'Featurette'
                  )
                );
                if (filtered.length > 0) {
                  videoHtml += filtered.slice(0, 1).map(createVideoCard).join('');
                  foundVideos = true;
                }
              }
            }
          } catch (e) {}
        }
      }
    }
    // If no videos found, try to show YouTube interviews about the actor
    if (!foundVideos && person && person.name) {
      const ytEmbeds = await fetchPersonVideosFromYoutube(person.name);
      if (ytEmbeds.length > 0) {
        videoHtml = ytEmbeds.map(url =>
          `<iframe width="420" height="240" src="${url}" frameborder="0" allowfullscreen></iframe>`
        ).join('');
        foundVideos = true;
      }
    }
    setHTML('person-videos-list', videoHtml || '<div>No videos found.</div>');
  }

  function renderFeaturedItems() {
    const startIdx = (currentFeaturedPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const itemsToShow = allFeaturedItems.slice(0, endIdx);
    
    // Create featured items HTML
    const featuredHTML = itemsToShow.map(createFeaturedCard).join('');
    
    // Create load more button HTML if there are more items to show
    let loadMoreHTML = '';
    if (endIdx < allFeaturedItems.length) {
      loadMoreHTML = `
        <div class="featured-card load-more-container">
          <button id="load-more-featured" class="load-more-btn">
            <ion-icon name="add-circle-outline"></ion-icon>
            <span class="btn-text">Load More</span>
          </button>
        </div>
      `;
    }
    
    // Combine featured items with load more button
    setHTML('person-featured-list', featuredHTML + loadMoreHTML);
  }
  
  function renderLatestItems() {
    const startIdx = (currentLatestPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const itemsToShow = allLatestItems.slice(0, endIdx);
    
    // Create latest items HTML
    const latestHTML = itemsToShow.map(createLatestCard).join('');
    
    // Create load more button HTML if there are more items to show
    let loadMoreHTML = '';
    if (endIdx < allLatestItems.length) {
      loadMoreHTML = `
        <div class="featured-card load-more-container">
          <button id="load-more-latest" class="load-more-btn">
            <ion-icon name="add-circle-outline"></ion-icon>
            <span class="btn-text">Load More</span>
          </button>
        </div>
      `;
    }
    
    // Combine latest items with load more button
    setHTML('person-latest-list', latestHTML + loadMoreHTML);
  }
  
  // Handle load more clicks using event delegation
  document.addEventListener('click', function(e) {
    const loadMoreFeaturedBtn = e.target.closest('#load-more-featured');
    const loadMoreLatestBtn = e.target.closest('#load-more-latest');
    
    if (loadMoreFeaturedBtn) {
      e.preventDefault();
      currentFeaturedPage++;
      renderFeaturedItems();
      // Scroll to show the newly loaded items
      setTimeout(() => {
        loadMoreFeaturedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } else if (loadMoreLatestBtn) {
      e.preventDefault();
      currentLatestPage++;
      renderLatestItems();
      // Scroll to show the newly loaded items
      setTimeout(() => {
        loadMoreLatestBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });

  // Main
  const personId = getPersonIdFromUrl();
  if (personId) {
    renderPersonPage(personId);
  } else {
    setText('person-name', 'No person ID provided.');
  }
});
