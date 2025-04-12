// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://cbnwekzbcxbmeevdjgoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibndla3piY3hibWVldmRqZ29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NDMwNTEsImV4cCI6MjA0ODAxOTA1MX0.R1KoGInR7ZlAiAAWHxaOicNY-0EA-wK07JvEwdz6xdU'
);

// TMDB API Key
const apiKey = '054582e9ee66adcbe911e0008aa482a8';

// Game state
const gameState = {
    currentMode: 'title', // title, actor
    difficulty: 1, // 1-5 for each mode
    letterLengths: {
        title: [4, 5, 6, 7, 8], // Start with 4 letters
        actor: [3, 4, 5, 6, 'double'] // 'double' means two words
    },
    maxAttempts: 6,
    currentAttempt: 0,
    answer: '',
    currentGuess: '',
    guesses: [],
    letterStatuses: {}, // For keyboard coloring
    streak: 0,
    bestStreak: localStorage.getItem('bestStreak') ? parseInt(localStorage.getItem('bestStreak')) : 0,
    isGameOver: false,
    currentHints: {}
};

// DOM Elements
const elements = {
    modeButtons: document.querySelectorAll('.mode-btn'),
    currentStreak: document.getElementById('currentStreak'),
    bestStreak: document.getElementById('bestStreak'),
    currentLevel: document.getElementById('currentLevel'),
    titleGrid: document.getElementById('titleGrid'),
    actorGrid: document.getElementById('actorGrid'),
    keyboard: document.getElementById('keyboard'),
    guessInput: document.getElementById('guessInput'),
    submitGuess: document.getElementById('submitGuess'),
    message: document.getElementById('message'),
    hintContent: document.getElementById('hint-content'),
    levelCompleteModal: document.getElementById('levelCompleteModal'),
    gameOverModal: document.getElementById('gameOverModal'),
    victoryModal: document.getElementById('victoryModal'),
    completedAnswer: document.getElementById('completedAnswer'),
    correctAnswer: document.getElementById('correctAnswer'),
    finalStreak: document.getElementById('finalStreak'),
    victoryStreak: document.getElementById('victoryStreak'),
    nextLevelBtn: document.getElementById('nextLevelBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    newGameBtn: document.getElementById('newGameBtn'),
    switchModeBtn: document.getElementById('switchModeBtn'),
    progressFill: document.querySelector('.progress-fill'),
    gameModes: {
        title: document.getElementById('title-mode'),
        actor: document.getElementById('actor-mode')
    },
    actorHint: document.getElementById('actor-hint'),
    actorFilmography: document.getElementById('actor-filmography')
};

// Initialize game
function initGame() {
    updateStats();
    setupEventListeners();
    loadGameFromStorage();
    startNewGame();
}

// Setup event listeners
function setupEventListeners() {
    // Mode selection
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            changeMode(mode);
        });
    });

    // Keyboard clicks
    elements.keyboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('key')) {
            handleKeyPress(e.target.dataset.key);
        }
    });

    // Physical keyboard input
    document.addEventListener('keydown', (e) => {
        if (e.target === elements.guessInput) return; // Prevent conflict when typing in the input field
        if (e.key === 'Enter') {
            submitGuess();
        } else if (e.key === 'Backspace') {
            handleKeyPress('backspace');
        } else if (/^[a-zA-Z0-9 ]$/.test(e.key)) { // Allow letters, numbers, and spaces
            handleKeyPress(e.key.toLowerCase());
        }
    });

    // Input field for guesses with dynamic suggestions
    elements.guessInput.addEventListener('input', async (e) => {
        const inputValue = e.target.value.toUpperCase();
        gameState.currentGuess = inputValue;

        const suggestionsContainer = document.getElementById('suggestionsContainer');
        suggestionsContainer.innerHTML = ''; // Clear previous suggestions

        if (inputValue.length > 1) {
            // Fetch suggestions based on the current mode
            const suggestions = await fetchSuggestions(inputValue, gameState.currentMode);

            // Display suggestions
            suggestions.forEach((suggestion) => {
                if (suggestion.name) { // Ensure suggestion.name exists
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = suggestion.name.toUpperCase();
                    suggestionItem.addEventListener('click', () => {
                        elements.guessInput.value = suggestion.name.toUpperCase();
                        gameState.currentGuess = suggestion.name.toUpperCase();
                        updateCurrentRow();
                        suggestionsContainer.innerHTML = ''; // Clear suggestions after selection
                    });
                    suggestionsContainer.appendChild(suggestionItem);
                }
            });
        }

        updateCurrentRow();
    });

    // Hide suggestions when the input loses focus
    elements.guessInput.addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('suggestionsContainer').innerHTML = '';
        }, 200); // Delay to allow click events on suggestions
    });

    // Submit button click
    elements.submitGuess.addEventListener('click', submitGuess);

    // Modal buttons
    elements.nextLevelBtn.addEventListener('click', nextLevel);
    elements.playAgainBtn.addEventListener('click', resetGame);
    elements.newGameBtn.addEventListener('click', resetGame);
    elements.switchModeBtn.addEventListener('click', () => {
        resetGame();
        // Cycle to next mode
        const modes = ['title', 'actor'];
        const currentIndex = modes.indexOf(gameState.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        changeMode(modes[nextIndex]);
    });
}

// Fetch suggestions dynamically based on the game mode
async function fetchSuggestions(query, mode) {
    try {
        let endpoint = '';
        switch (mode) {
            case 'actor':
                endpoint = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
                break;
            case 'title':
                endpoint = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
                break;
            default:
                return [];
        }

        const response = await fetch(endpoint);
        const data = await response.json();

        // For 'title' mode, filter results to include only movies and TV shows, excluding tricky titles with numbers
        if (mode === 'title') {
            return data.results.filter(item => {
                const isMovieOrTV = item.media_type === 'movie' || item.media_type === 'tv';
                const hasNoNumbers = /^[^0-9]*$/.test(item.title || item.name);
                return isMovieOrTV && hasNoNumbers;
            });
        }

        return data.results || [];
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Fetch actor suggestions from TMDB API
async function fetchActorSuggestions(query) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching actor suggestions:', error);
        return [];
    }
}

// Change game mode
function changeMode(mode) {
    if (gameState.currentMode === mode) return;

    gameState.currentMode = mode;
    gameState.difficulty = 1;
    gameState.currentAttempt = 0;
    gameState.guesses = [];
    gameState.letterStatuses = {};
    gameState.isGameOver = false;

    elements.modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    Object.values(elements.gameModes).forEach(el => {
        el.style.display = 'none';
    });

    elements.gameModes[mode].style.display = 'block';

    updateLevelIndicator();
    startNewGame();
    saveGameToStorage();
}

// Start a new game
async function startNewGame() {
    gameState.currentAttempt = 0;
    gameState.guesses = [];
    gameState.letterStatuses = {};
    gameState.isGameOver = false;
    gameState.currentGuess = '';

    let targetLength = gameState.letterLengths[gameState.currentMode][gameState.difficulty - 1];

    // Get random item based on mode and difficulty
    switch (gameState.currentMode) {
        case 'title':
            await getRandomTitle(targetLength);
            break;
        case 'actor':
            await getRandomActor(targetLength);
            break;
    }

    // Create empty grid
    createGrid();

    // Update hint
    updateHint();

    // Reset keyboard colors
    resetKeyboard();

    // Update progress bar
    updateProgressBar();

    // Clear input field
    elements.guessInput.value = '';

    // Save game state
    saveGameToStorage();
}

// Get random movie or TV show title
async function getRandomTitle(targetLength) {
    try {
        const mediaType = Math.random() > 0.5 ? 'movie' : 'tv';
        let retries = 5; // Retry up to 5 times
        let validTitles = [];

        while (retries > 0 && validTitles.length === 0) {
            let page = Math.floor(Math.random() * 50) + 1;

            const response = await fetch(`https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`);
            const data = await response.json();

            // Filter results by length, in English
            validTitles = data.results.filter(item => {
                const title = mediaType === 'movie' ? item.title : item.name;
                const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                return cleanTitle.length === targetLength && /^[A-Z0-9]+$/.test(cleanTitle);
            });

            retries--;
        }

        // If no valid titles are found, relax the filter to allow +/- 1 character length
        if (validTitles.length === 0) {
            let page = Math.floor(Math.random() * 50) + 1;

            const response = await fetch(`https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`);
            const data = await response.json();

            validTitles = data.results.filter(item => {
                const title = mediaType === 'movie' ? item.title : item.name;
                const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                return Math.abs(cleanTitle.length - targetLength) <= 1 && /^[A-Z0-9]+$/.test(cleanTitle);
            });
        }

        if (validTitles.length === 0) {
            throw new Error('No valid titles found after retries');
        }

        const randomIndex = Math.floor(Math.random() * validTitles.length);
        const selectedItem = validTitles[randomIndex];

        const title = mediaType === 'movie' ? selectedItem.title : selectedItem.name;
        const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        gameState.answer = cleanTitle;

        // Fetch additional details for runtime or seasons/episodes
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/${mediaType}/${selectedItem.id}?api_key=${apiKey}&language=en-US`);
        const details = await detailsResponse.json();

        gameState.currentHints = {
            type: mediaType === 'movie' ? 'Movie' : 'TV Show',
            year: mediaType === 'movie' ? (selectedItem.release_date || 'Unknown').substring(0, 4) : (selectedItem.first_air_date || 'Unknown').substring(0, 4),
            genre: selectedItem.genre_ids.length > 0 ? await getGenreName(selectedItem.genre_ids[0], mediaType) : 'Unknown',
            rating: selectedItem.vote_average ? selectedItem.vote_average.toFixed(1) : 'N/A',
            runtime: mediaType === 'movie' ? `${details.runtime || 'Unknown'} min` : `${details.number_of_seasons || 'Unknown'} seasons, ${details.number_of_episodes || 'Unknown'} episodes`
            
        };

        console.log("Answer:", gameState.answer);

    } catch (error) {
        console.error("Error fetching title:", error);
        showMessage('Unable to fetch a valid title. Please try again later.', 'error');
        throw error; // Stop execution if no valid titles are found
    }
}

// Get random actor based on difficulty
async function getRandomActor(targetLength) {
    try {
        let page = Math.floor(Math.random() * 20) + 1;
        const response = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=en-US&page=${page}`);
        const data = await response.json();

        const filteredResults = data.results.filter(person => {
            const names = person.name.split(' ');
            return names.length === 2; // Ensure exactly two words (first name and surname)
        });

        if (filteredResults.length === 0) {
            throw new Error('No valid actors found');
        }

        const randomIndex = Math.floor(Math.random() * filteredResults.length);
        const selectedActor = filteredResults[randomIndex];

        gameState.answer = selectedActor.name.toUpperCase();

        const detailResponse = await fetch(`https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${apiKey}&language=en-US`);
        const actorDetails = await detailResponse.json();

        const knownForTitles = selectedActor.known_for.map(item =>
            item.media_type === 'movie' ? item.title : item.name
        );

        gameState.currentHints = {
            knownFor: knownForTitles.slice(0, 3).join(', '),
            birthYear: actorDetails.birthday ? actorDetails.birthday.substring(0, 4) : 'Unknown',
            gender: actorDetails.gender === 1 ? 'Female' : 'Male',
            popularity: selectedActor.popularity.toFixed(1)
        };

        console.log("Answer:", gameState.answer);

    } catch (error) {
        console.error("Error fetching actor:", error);
        throw error; // Stop execution if no valid actors are found
    }
}

// Get genre name by ID
async function getGenreName(genreId, mediaType) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${apiKey}&language=en-US`);
        const data = await response.json();

        const genre = data.genres.find(g => g.id === genreId);
        return genre ? genre.name : 'Unknown';
    } catch (error) {
        console.error("Error fetching genre:", error);
        return 'Unknown';
    }
}

// Create letter grid based on mode and difficulty
function createGrid() {
    // Clear existing grid
    const gridElement = document.getElementById(`${gameState.currentMode}Grid`);
    gridElement.innerHTML = '';

    // Get the length of the answer, including spaces
    const targetLength = gameState.answer.length;
    const rows = gameState.maxAttempts;

    // Create grid dynamically based on the answer length
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'guess-row';
        row.dataset.row = i;

        for (let j = 0; j < targetLength; j++) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.dataset.row = i;
            box.dataset.col = j;

            // Add space indication for spaces in the answer
            if (gameState.answer[j] === ' ') {
                box.classList.add('space');
                box.textContent = ' ';
            }

            row.appendChild(box);
        }

        gridElement.appendChild(row);
    }
}

// Update hint based on mode and difficulty
function updateHint() {
    let hintText = '';

    switch (gameState.currentMode) {
        case 'title':
            hintText = `Type: ${gameState.currentHints.type || 'Unknown'}<br>`;
            hintText += `Year: ${gameState.currentHints.year || 'Unknown'}<br>`;
            hintText += `Genre: ${gameState.currentHints.genre || 'Unknown'}<br>`;
            hintText += `Rating: ${gameState.currentHints.rating || 'N/A'}<br>`;
            hintText += `Runtime: ${gameState.currentHints.runtime || 'Unknown'}<br>`;
            hintText += `Number of Letters: ${gameState.answer.replace(/ /g, '').length}`;
            break;

        case 'actor':
            hintText = `Known For: ${gameState.currentHints.knownFor || 'Unknown'}<br>`;
            hintText += `Birth Year: ${gameState.currentHints.birthYear || 'Unknown'}<br>`;
            hintText += `Gender: ${gameState.currentHints.gender || 'Unknown'}<br>`;
            hintText += `Number of Letters: ${gameState.answer.replace(/ /g, '').length}`;
            break;
    }

    elements.hintContent.innerHTML = hintText;
}

// Reset keyboard colors
function resetKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'partial', 'used');
    });

    gameState.letterStatuses = {};
}

// Handle key press from virtual or physical keyboard
function handleKeyPress(key) {
    if (gameState.isGameOver) return;

    const maxLength = gameState.answer.length; // Dynamically set max length based on the answer

    if (key === 'enter') {
        submitGuess();
    } else if (key === 'backspace') {
        if (gameState.currentGuess.length > 0) {
            gameState.currentGuess = gameState.currentGuess.slice(0, -1);
            elements.guessInput.value = gameState.currentGuess;
            updateCurrentRow();
        }
    } else if (gameState.currentGuess.length < maxLength) {
        // Only add letter if within max length
        gameState.currentGuess += key.toUpperCase();
        elements.guessInput.value = gameState.currentGuess;
        updateCurrentRow();
    }
}

// Update current row with the current guess
function updateCurrentRow() {
    const gridElement = document.getElementById(`${gameState.currentMode}Grid`);
    const currentRow = gridElement.querySelector(`.guess-row[data-row="${gameState.currentAttempt}"]`);

    if (!currentRow) return;

    const boxes = currentRow.querySelectorAll('.letter-box');

    // Clear all boxes first
    boxes.forEach((box, idx) => {
        // Skip space markers for double word mode
        if (box.classList.contains('space')) return;

        if (idx < gameState.currentGuess.length) {
            box.textContent = gameState.currentGuess[idx];
        } else {
            box.textContent = '';
        }
    });
}

// Submit a guess
function submitGuess() {
    if (gameState.isGameOver) return;

    const guess = gameState.currentGuess.trim().toUpperCase();

    // Validate guess length dynamically based on the actual answer length
    const answerLength = gameState.answer.length;

    if (guess.length !== answerLength) {
        showMessage(`Guess must be ${answerLength} characters long!`, 'error');
        return;
    }

    // Store guess
    gameState.guesses.push(guess);

    // Check if guess is correct
    const isCorrect = guess === gameState.answer;

    // Update grid
    updateGridWithGuess(guess, isCorrect);

    if (isCorrect) {
        // Increase streak
        gameState.streak++;

        // Update best streak if needed
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
            localStorage.setItem('bestStreak', gameState.bestStreak);
        }

        // Update stats
        updateStats();

        // Show level complete modal
        elements.completedAnswer.textContent = gameState.answer;
        elements.levelCompleteModal.style.display = 'flex';

        gameState.isGameOver = true;

        // Save game state
        saveGameToStorage();
    } else {
        // Move to next attempt
        gameState.currentAttempt++;

        // Check if out of attempts
        if (gameState.currentAttempt >= gameState.maxAttempts) {
            // Game over
            elements.correctAnswer.textContent = gameState.answer;
            elements.finalStreak.textContent = gameState.streak;
            elements.gameOverModal.style.display = 'flex';

            // Reset streak
            gameState.streak = 0;
            updateStats();

            gameState.isGameOver = true;
        } else {
            // Reset current guess for next attempt
            gameState.currentGuess = '';
            elements.guessInput.value = '';
        }

        // Save game state
        saveGameToStorage();
    }
}

// Update grid with the submitted guess
function updateGridWithGuess(guess, isCorrect) {
    const gridElement = document.getElementById(`${gameState.currentMode}Grid`);
    const currentRow = gridElement.querySelector(`.guess-row[data-row="${gameState.currentAttempt}"]`);

    if (!currentRow) return;

    const boxes = currentRow.querySelectorAll('.letter-box');
    const answer = gameState.answer;

    // Count letter occurrences in answer for proper partial marking
    const letterCounts = {};
    for (let i = 0; i < answer.length; i++) {
        const letter = answer[i];
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    // First pass: Mark correct letters
    for (let i = 0; i < boxes.length; i++) {
        if (i >= guess.length) break;

        const box = boxes[i];
        const letter = guess[i];

        // Skip space markers for double word mode
        if (box.classList.contains('space')) continue;

        box.textContent = letter;

        if (letter === answer[i]) {
            box.classList.add('correct');
            letterCounts[letter]--;

            // Update keyboard status
            gameState.letterStatuses[letter] = 'correct';
            updateKeyboard(letter, 'correct');
        }
    }

    // Second pass: Mark partial matches
    for (let i = 0; i < boxes.length; i++) {
        if (i >= guess.length) break;

        const box = boxes[i];
        const letter = guess[i];

        // Skip space markers and already marked correct
        if (box.classList.contains('space') || box.classList.contains('correct')) continue;

        if (answer.includes(letter) && letterCounts[letter] > 0) {
            box.classList.add('partial');
            letterCounts[letter]--;

            // Update keyboard status if not already correct
            if (gameState.letterStatuses[letter] !== 'correct') {
                gameState.letterStatuses[letter] = 'partial';
                updateKeyboard(letter, 'partial');
            }
        } else {
            box.classList.add('used');

            // Update keyboard status if not already marked
            if (!gameState.letterStatuses[letter]) {
                gameState.letterStatuses[letter] = 'used';
                updateKeyboard(letter, 'used');
            }
        }
    }

    // Apply animation
    boxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.add('flip');
        }, index * 100);
    });
}

// Update keyboard UI
function updateKeyboard(letter, status) {
    const key = document.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);
    if (!key) return;

    // Remove existing status classes
    key.classList.remove('correct', 'partial', 'used');

    // Add new status class
    key.classList.add(status);
}

// Show message to user
function showMessage(text, type = 'info') {
    elements.message.textContent = text;
    elements.message.className = `message ${type}`;
    elements.message.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
        elements.message.style.display = 'none';
    }, 3000);
}

// Move to next level
function nextLevel() {
    // Hide modal
    elements.levelCompleteModal.style.display = 'none';

    // Increase difficulty if not at max
    if (gameState.difficulty < 5) {
        gameState.difficulty++;
    } else {
        // If reached max difficulty, show victory modal and reset to level 1
        gameState.difficulty = 1;
        elements.victoryStreak.textContent = gameState.streak;
        elements.victoryModal.style.display = 'flex';
        return;
    }

    // Update level indicator
    updateLevelIndicator();

    // Start new game
    startNewGame();
}

// Reset game
function resetGame() {
    // Hide all modals
    elements.levelCompleteModal.style.display = 'none';
    elements.gameOverModal.style.display = 'none';
    elements.victoryModal.style.display = 'none';

    // Reset streak
    gameState.streak = 0;

    // Reset difficulty
    gameState.difficulty = 1;

    // Update level indicator
    updateLevelIndicator();

    // Update stats
    updateStats();

    // Start new game
    startNewGame();
}

// Update stats display
function updateStats() {
    elements.currentStreak.textContent = gameState.streak;
    elements.bestStreak.textContent = gameState.bestStreak;
}

// Update level indicator
function updateLevelIndicator() {
    elements.currentLevel.textContent = gameState.difficulty;

    // Update progress bar
    updateProgressBar();
}

// Update progress bar
function updateProgressBar() {
    const percentage = (gameState.difficulty / 5) * 100;
    elements.progressFill.style.width = `${percentage}%`;
}

// Save game state to local storage
function saveGameToStorage() {
    const saveData = {
        currentMode: gameState.currentMode,
        difficulty: gameState.difficulty,
        streak: gameState.streak,
        bestStreak: gameState.bestStreak
    };

    localStorage.setItem('movieWordleState', JSON.stringify(saveData));
}

// Load game state from local storage
function loadGameFromStorage() {
    const savedData = localStorage.getItem('movieWordleState');

    if (savedData) {
        const parsedData = JSON.parse(savedData);

        gameState.currentMode = parsedData.currentMode || 'title';
        gameState.difficulty = parsedData.difficulty || 1;
        gameState.streak = parsedData.streak || 0;
        gameState.bestStreak = parsedData.bestStreak || 0;

        // Update UI accordingly
        elements.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === gameState.currentMode);
        });

        // Hide all game modes
        Object.values(elements.gameModes).forEach(el => {
            el.style.display = 'none';
        });

        // Show selected mode
        elements.gameModes[gameState.currentMode].style.display = 'block';

        // Update level indicator
        updateLevelIndicator();
    }
}

// Submit scores to leaderboard
async function submitScore() {
    try {
        const playerName = localStorage.getItem('playerName') || 'Anonymous';

        const { data, error } = await supabase
            .from('leaderboard')
            .insert([
                {
                    player_name: playerName,
                    score: gameState.streak,
                    mode: gameState.currentMode,
                    max_difficulty: gameState.difficulty
                }
            ]);

        if (error) throw error;

        console.log('Score submitted successfully');
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

// Get leaderboard
async function getLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Display leaderboard
        const leaderboardElement = document.getElementById('leaderboard-list');
        leaderboardElement.innerHTML = '';

        data.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="player">${entry.player_name}</span>
                <span class="score">${entry.score}</span>
                <span class="mode">${entry.mode}</span>
            `;
            leaderboardElement.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

// Set player name
function setPlayerName() {
    const nameInput = document.getElementById('playerNameInput');
    const name = nameInput.value.trim();

    if (name) {
        localStorage.setItem('playerName', name);
        document.getElementById('playerNameModal').style.display = 'none';
    } else {
        showMessage('Please enter a valid name', 'error');
    }
}

// Event listeners for additional buttons
document.addEventListener('DOMContentLoaded', () => {
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            getLeaderboard();
            document.getElementById('leaderboardModal').style.display = 'flex';
        });
    } else {
        console.error("Element with ID 'leaderboardBtn' not found.");
    }

    const closeLeaderboard = document.getElementById('closeLeaderboard');
    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', () => {
            document.getElementById('leaderboardModal').style.display = 'none';
        });
    } else {
        console.error("Element with ID 'closeLeaderboard' not found.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const setNameBtn = document.getElementById('setNameBtn');
    if (setNameBtn) {
        setNameBtn.addEventListener('click', setPlayerName);
    } else {
        console.error("Element with ID 'setNameBtn' not found.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            const playerName = localStorage.getItem('playerName') || '';
            document.getElementById('playerNameInput').value = playerName;
            document.getElementById('playerNameModal').style.display = 'flex';
        });
    } else {
        console.error("Element with ID 'profileBtn' not found.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const closeTutorial = document.getElementById('closeTutorial');
    if (closeTutorial) {
        closeTutorial.addEventListener('click', () => {
            document.getElementById('tutorialModal').style.display = 'none';
        });
    } else {
        console.error("Element with ID 'closeTutorial' not found.");
    }
});

// Check if it's the first run
function checkFirstRun() {
    const hasPlayedBefore = localStorage.getItem('hasPlayedBefore');

    if (!hasPlayedBefore) {
        // Show tutorial or welcome message
        document.getElementById('tutorialModal').style.display = 'flex';

        // Mark as played
        localStorage.setItem('hasPlayedBefore', 'true');
    }
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    checkFirstRun();
});