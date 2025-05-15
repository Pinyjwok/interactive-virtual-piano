// Class for song playback functionality
class SongPlayer {
    constructor(piano) {
        this.piano = piano;
        this.songs = [];
        this.currentSongTimeouts = [];
        this.modalManager = new ModalManager();
        this.countdownInterval = null;
        this.songEndTime = 0;
        
        // Get UI elements
        this.songSelector = document.getElementById('songSelector');
        this.playButton = document.getElementById('playSong');
        this.renameSongButton = document.getElementById('renameSong');
        this.durationElement = document.getElementById('songDuration');
        
        // Load songs from storage
        this.loadSongs();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async loadSongs() {
        try {
            // Get songs from window object or storage (now async)
            this.songs = window.PIANO_SONGS || await StorageManager.loadSongs([]);
            this.updateSongSelector();
        } catch (error) {
            console.error('Error loading songs:', error);
            this.songs = [];
            this.updateSongSelector();
        }
    }
    
    updateSongSelector() {
        if (!this.songSelector) return;
        
        // Clear existing options
        this.songSelector.innerHTML = '<option value="">Select a Song</option>';
        
        // Add songs
        this.songs.forEach(song => {
            const option = document.createElement('option');
            option.value = song.id;
            option.textContent = song.title;
            this.songSelector.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Play button
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.handlePlayButtonClick());
        }
        
        // Rename button
        if (this.renameSongButton) {
            this.renameSongButton.addEventListener('click', () => this.handleRenameSongClick());
        }
        
        // Song selection change
        if (this.songSelector) {
            this.songSelector.addEventListener('change', () => this.updateSongDuration());
        }
    }
    
    handlePlayButtonClick() {
        // If already playing, stop
        if (this.playButton.textContent === 'Stop') {
            this.stopCurrentSong();
            return;
        }
        
        // Otherwise play the selected song
        const songId = parseInt(this.songSelector.value, 10);
        if (!isNaN(songId)) {
            const selectedSong = this.songs.find(song => song.id === songId);
            if (selectedSong) {
                this.playSong(selectedSong.notes);
            }
        }
    }
    
    async handleRenameSongClick() {
        const songId = parseInt(this.songSelector.value, 10);
        
        if (!isNaN(songId)) {
            const selectedSong = this.songs.find(song => song.id === songId);
            if (selectedSong) {
                this.modalManager.showSongRenameModal(selectedSong.title, async (newName) => {
                    // Update song title
                    selectedSong.title = newName;
                    
                    try {
                        // Update UI and save (now async)
                        this.updateSongSelector();
                        this.songSelector.value = songId;
                        await StorageManager.saveSongs(this.songs);
                    } catch (error) {
                        console.error('Error saving songs:', error);
                        alert('There was an error saving the song name. Please try again.');
                    }
                });
            }
        }
    }
    
    playSong(notes) {
        // Stop any current playback
        this.stopCurrentSong();
        
        // Update button
        this.playButton.textContent = 'Stop';
        
        if (notes.length > 0) {
            // Calculate total duration using the same logic as calculateSongDuration
            const totalDuration = Math.max(...notes.map(note => note.timestamp + (note.duration || 0.5)));
            
            // Start countdown timer
            this.startCountdownTimer(totalDuration);
            
            // Play each note at its timestamp
            notes.forEach(noteObj => {
                const delay = noteObj.timestamp * 1000;
                const noteDuration = noteObj.duration || 0.5; // Use note duration or default to 0.5
                const timeout = setTimeout(() => {
                    this.piano.playNote(noteObj.note, noteDuration);
                    this.piano.highlightKey(noteObj.note);
                }, delay);
                this.currentSongTimeouts.push(timeout);
            });
            
            // Reset button after song ends
            const songEndTime = totalDuration * 1000 + 200; // Add 200ms buffer
            const resetTimeout = setTimeout(() => {
                this.resetPlayButton();
                this.stopCountdownTimer();
                this.updateSongDuration(); // Reset duration display to original
            }, songEndTime);
            this.currentSongTimeouts.push(resetTimeout);
        }
    }
    
    stopCurrentSong() {
        // Clear all timeouts
        this.currentSongTimeouts.forEach(timeout => clearTimeout(timeout));
        this.currentSongTimeouts = [];
        this.resetPlayButton();
        this.stopCountdownTimer();
        this.updateSongDuration(); // Reset duration display to original
    }
    
    resetPlayButton() {
        if (this.playButton) {
            this.playButton.textContent = 'Play';
        }
    }
    
    calculateSongDuration(notes) {
        if (!notes || notes.length === 0) return 0;
        
        // Find the note that ends last (timestamp + duration)
        return Math.max(...notes.map(note => note.timestamp + (note.duration || 0.5)));
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    updateSongDuration() {
        const songId = parseInt(this.songSelector.value, 10);
        
        if (!this.durationElement || isNaN(songId)) {
            if (this.durationElement) {
                this.durationElement.style.display = 'none';
            }
            return;
        }
        
        const selectedSong = this.songs.find(song => song.id === songId);
        if (selectedSong) {
            const duration = this.calculateSongDuration(selectedSong.notes);
            this.durationElement.textContent = `Duration: ${this.formatDuration(duration)}`;
            this.durationElement.style.display = 'block';
        } else {
            this.durationElement.style.display = 'none';
        }
    }
    
    startCountdownTimer(totalDuration) {
        // Clear any existing interval
        this.stopCountdownTimer();
        
        // Set end time
        this.songEndTime = Date.now() + (totalDuration * 1000);
        
        // Update immediately
        this.updateCountdown();
        
        // Update every 500ms (half a second)
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 500);
    }
    
    stopCountdownTimer() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    updateCountdown() {
        if (!this.durationElement) return;
        
        const currentTime = Date.now();
        const timeRemaining = Math.max(0, this.songEndTime - currentTime) / 1000;
        
        if (timeRemaining <= 0) {
            this.stopCountdownTimer();
            this.durationElement.textContent = "Duration: 0:00";
        } else {
            this.durationElement.textContent = `Remaining: ${this.formatDuration(timeRemaining)}`;
        }
    }
}