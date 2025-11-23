const apiKey = '054582e9ee66adcbe911e0008aa482a8';
const omdbApiKey = '20e349a6';
const upcomingMoviesUrl = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=cs-CZ&region=US&with_release_type=2&page=1`;
const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=cs-CZ&page=1`;
const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
const imageBannerUrl = 'https://image.tmdb.org/t/p/w780';
const baseApiUrl = 'https://api.themoviedb.org/3';
const DEFAULT_YTS_DOMAIN = 'https://yts.lt';
function getYtsDomainFromCache() { try { const v = localStorage.getItem('ytsDomain'); return v || DEFAULT_YTS_DOMAIN; } catch (e) { return DEFAULT_YTS_DOMAIN; } }
function setYtsDomainInCache(domain) { try { localStorage.setItem('ytsDomain', domain); localStorage.setItem('ytsDomainUpdatedAt', Date.now().toString()); } catch (e) {} }
function getYtsBaseUrlSync() { return `${getYtsDomainFromCache()}/api/v2`; }
async function refreshYtsDomain() {
  const now = Date.now();
  let last = 0;
  try { last = parseInt(localStorage.getItem('ytsDomainUpdatedAt') || '0', 10); } catch (e) {}
  if (now - last < 21600000) { return getYtsBaseUrlSync(); }
  let html = null;
  try { const r = await fetch('https://yifystatus.com/', { cache: 'no-store' }); if (r.ok) { html = await r.text(); } } catch (e) {}
  if (!html) { try { const r2 = await fetch('https://r.jina.ai/http://yifystatus.com/', { cache: 'no-store' }); if (r2.ok) { html = await r2.text(); } } catch (e) {} }
  let domain = null;
  if (html) {
    try { const parser = new DOMParser(); const doc = parser.parseFromString(html, 'text/html'); const a = doc.querySelector('.ytsyifyinfo a[href*="yts."]'); if (a && a.href) { const u = new URL(a.href); domain = u.origin; } } catch (e) {}
    if (!domain) { const m = html.match(/https?:\/\/yts\.[a-z.]+/i); if (m) { try { const u = new URL(m[0]); domain = u.origin; } catch (e) {} } }
  }
  if (domain) { setYtsDomainInCache(domain); }
  return getYtsBaseUrlSync();
}
window.getYtsBaseUrlSync = getYtsBaseUrlSync;
refreshYtsDomain();
const accountID = '6578737f20ecaf00c699cdc4';
const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNTQ1ODJlOWVlNjZhZGNiZTkxMWUwMDA4YWE0ODJhOCIsIm5iZiI6MTczMjM1MzY2NC44NTUyODQsInN1YiI6IjY1Nzg3MzdmMjBlY2FmMDBjNjk5Y2RjNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.a5QAwVIb-gaZmD8jOwFsnzVr8wiSzLv0oXfE5ZLMnHE';
