// Store user recordings in local storage
window.PIANO_RECORDINGS = [];

// Load existing recordings from localStorage
function loadRecordingsFromStorage() {
    const savedRecordings = localStorage.getItem('pianoRecordings');
    if (savedRecordings) {
        try {
            window.PIANO_RECORDINGS = JSON.parse(savedRecordings);
        } catch (e) {
            console.error('Error parsing saved recordings:', e);
            window.PIANO_RECORDINGS = [];
        }
    }
}

// Save recordings to localStorage
function saveRecordingsToStorage() {
    localStorage.setItem('pianoRecordings', JSON.stringify(window.PIANO_RECORDINGS));
}

// Initialize recordings on load
document.addEventListener('DOMContentLoaded', loadRecordingsFromStorage);