// Main piano application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Create instances
    const piano = new Piano();
    // Make piano available globally
    window.piano = piano;
    const songPlayer = new SongPlayer(piano);
    const recordingManager = new RecordingManager(piano);
    
    // Initialize GuidedPlay if its class exists
    let guidedPlay = null;
    if (typeof GuidedPlay !== 'undefined') {
        guidedPlay = new GuidedPlay(piano);
        window.guidedPlay = guidedPlay; // Make it globally available
    } else {
        console.warn('GuidedPlay class not found - guided play features will be disabled');
    }
    
    // Connect components
    recordingManager.setSongPlayer(songPlayer);
    
    // Initialize menu and navigation functionality
    initializeNavigation(piano, songPlayer, recordingManager, guidedPlay);
    
    // Instead of directly showing the guided play section, show the main menu first
    showSection('mainMenuSection');
    
    // Initialize auto navigation to main menu
    initializeAutoNavigation();
});

// Add a variable to store the auto-navigation timer
let autoNavigationTimer = null;
const AUTO_NAVIGATION_TIMEOUT = 180000; // 3 minutes in milliseconds

// Function to initialize auto-navigation to the main menu
function initializeAutoNavigation() {
    // Auto-navigation disabled as per user request
    console.log('Auto-navigation to main menu has been disabled');
    
    // Clear any existing timer just to be safe
    if (autoNavigationTimer) {
        clearTimeout(autoNavigationTimer);
        autoNavigationTimer = null;
    }
}

// Function to handle navigation between sections
function initializeNavigation(piano, songPlayer, recordingManager, guidedPlay) {
    // Main menu buttons
    const startPianoButton = document.getElementById('startPiano');
    if (startPianoButton) {
        startPianoButton.addEventListener('click', () => {
            console.log('Start Piano button clicked');
            // this.showSection('pianoSection');
            // The 3D animation transition will now handle this transition
        });
    } else {
        console.error('startPiano button not found in the DOM');
    }
    
    // Guided Play button
    const guidedPlayButton = document.getElementById('guidedPlayButton');
    if (guidedPlayButton) {
        guidedPlayButton.addEventListener('click', () => {
            console.log('Guided Play button clicked');
            if (typeof GuidedPlay === 'undefined') {
                alert('Guided Play mode is currently unavailable. Please try again later.');
                return;
            }
            showSection('guidedPlaySection');
            
            // Initialize the guided play section if it hasn't been already
            if (guidedPlay && typeof guidedPlay.initializeGuidedPlay === 'function') {
                guidedPlay.initializeGuidedPlay();
            }
        });
    } else {
        console.error('guidedPlayButton element not found');
    }
    
    // Back to menu from guided play section
    const backToMenuFromGuided = document.getElementById('backToMenuFromGuided');
    if (backToMenuFromGuided) {
        backToMenuFromGuided.addEventListener('click', () => {
            showSection('mainMenuSection');
        });
    }
    
    // Back to menu from piano section
    const backToMenuFromPiano = document.getElementById('backToMenuFromPiano');
    if (backToMenuFromPiano) {
        backToMenuFromPiano.addEventListener('click', () => {
            showSection('mainMenuSection');
        });
    } else {
        console.error('backToMenuFromPiano button not found');
    }
}

// Helper function to show a specific section and hide others
function showSection(sectionId) {
    const sections = ['mainMenuSection', 'pianoSection', 'guidedPlaySection'];
    
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            if (section === sectionId) {
                if (section === 'mainMenuSection') {
                    element.style.display = 'block';
                } else if (section === 'pianoSection') {
                    element.style.display = 'flex';
                } else if (section === 'guidedPlaySection') {
                    element.style.display = 'flex';
                }
            } else {
                element.style.display = 'none';
            }
        }
    });
    
    // If switching to piano section, make sure to reset the focus to capture keyboard input
    if (sectionId === 'pianoSection') {
        document.getElementById(sectionId).focus();
    }
}

// Function to load recordings into the recordings library view
async function loadRecordings() {
    const recordingsList = document.getElementById('recordingsList');
    recordingsList.innerHTML = '';
    
    try {
        // Use the new StorageManager instead of direct localStorage access
        const recordings = await StorageManager.loadRecordings();
        
        if (!recordings || recordings.length === 0) {
            recordingsList.innerHTML = '<div class="no-items">No recordings found. Play the piano and record something!</div>';
            return;
        }
        
        recordings.forEach((recording) => {
            const item = document.createElement('div');
            item.className = 'recording-item';
            
            const title = document.createElement('div');
            title.className = 'recording-item-title';
            title.textContent = recording.title || `Recording ${recording.id}`;
            
            const buttons = document.createElement('div');
            buttons.className = 'recording-item-buttons';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'play-button';
            playBtn.textContent = 'Play';
            playBtn.addEventListener('click', () => {
                // Find the index in the array instead of using the ID directly
                const index = recordings.findIndex(r => r.id === recording.id);
                if (index !== -1) {
                    // Close the library and go to piano view to play the recording
                    document.getElementById('recordingsSelector').value = index;
                    document.getElementById('playSelectedRecording').click();
                    showSection('pianoSection');
                }
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete "${recording.title || `Recording ${recording.id}`}"?`)) {
                    // Find the index in the array
                    const index = recordings.findIndex(r => r.id === recording.id);
                    if (index !== -1) {
                        // Remove the recording
                        recordings.splice(index, 1);
                        
                        // Save back to storage using StorageManager
                        await StorageManager.saveRecordings(recordings);
                        
                        // Refresh the list
                        loadRecordings();
                    }
                }
            });
            
            buttons.appendChild(playBtn);
            buttons.appendChild(deleteBtn);
            
            item.appendChild(title);
            item.appendChild(buttons);
            recordingsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recordings:', error);
        recordingsList.innerHTML = '<div class="no-items">Error loading recordings. Please try refreshing the page.</div>';
    }
}

// Function to load songs into the songs library view
async function loadSongs() {
    const songsList = document.getElementById('songsList');
    songsList.innerHTML = '';
    
    try {
        // Use the StorageManager to load songs asynchronously
        const songs = window.songs || await StorageManager.loadSongs([]);
        
        if (songs.length === 0) {
            songsList.innerHTML = '<div class="no-items">No songs found in the library.</div>';
            return;
        }
        
        songs.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'song-item';
            
            const title = document.createElement('div');
            title.className = 'song-item-title';
            title.textContent = song.name;
            
            const buttons = document.createElement('div');
            buttons.className = 'song-item-buttons';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'play-button';
            playBtn.textContent = 'Play';
            playBtn.addEventListener('click', () => {
                // Close the library and go to piano view to play the song
                document.getElementById('songSelector').value = index;
                document.getElementById('playSong').click();
                showSection('pianoSection');
            });
            
            buttons.appendChild(playBtn);
            
            item.appendChild(title);
            item.appendChild(buttons);
            songsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading songs:', error);
        songsList.innerHTML = '<div class="no-items">Error loading songs. Please try refreshing the page.</div>';
    }
}
