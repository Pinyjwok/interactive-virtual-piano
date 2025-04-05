// Audio context for playing sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Mapping of keyboard keys to notes
const keyToNoteMap = {
    'a': 'C4', 
    's': 'D4', 
    'd': 'E4', 
    'f': 'F4', 
    'g': 'G4', 
    'h': 'A4', 
    'j': 'B4',
    'w': 'C#4', 
    'e': 'D#4', 
    't': 'F#4', 
    'y': 'G#4', 
    'u': 'A#4',
    // New octave mappings
    'k': 'C5',
    'l': 'D5', 
    ';': 'E5', 
    "'": 'F5', 
    'o': 'G5', 
    'p': 'A5', 
    '[': 'B5',
    'i': 'C#5', 
    'r': 'D#5', 
    ']': 'F#5', 
    '\\': 'G#5', 
    '=': 'A#5'
};

// Function to generate a tone
function playTone(frequency, duration = 0.5) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// Frequency mapping for notes
const noteFrequencies = {
    'A3': 220.00, 'A#3': 233.08, 
    'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 
    'D4': 293.66, 'D#4': 311.13,
    'E4': 329.63, 
    'F4': 349.23, 'F#4': 369.99,
    'G4': 392.00, 'G#4': 415.30,
    'A4': 440.00, 'A#4': 466.16,
    'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37,
    'D5': 587.33, 'D#5': 622.25,
    'E5': 659.25,
    'F5': 698.46, 'F#5': 739.99,
    'G5': 783.99, 'G#5': 830.61,
    'A5': 880.00, 'A#5': 932.33,
    'B5': 987.77
};

// Function to handle key press
function playNote(note) {
    const key = document.querySelector(`.key[data-note="${note}"]`);
    if (key && noteFrequencies[note]) {
        playTone(noteFrequencies[note]);
        key.classList.add('active');
        setTimeout(() => key.classList.remove('active'), 200);
    }
}

// Mouse click event listeners
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = key.getAttribute('data-note');
        playNote(note);
    });
});

// Keyboard key press event listener
document.addEventListener('keydown', (event) => {
    const note = keyToNoteMap[event.key.toLowerCase()];
    if (note) {
        playNote(note);
    }
});
