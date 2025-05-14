// Class for recording functionality
class RecordingManager {
    constructor(piano) {
        this.piano = piano;
        this.recordings = [];
        this.isRecording = false;
        this.recordedNotes = [];
        this.recordingStartTime = 0;
        this.modalManager = new ModalManager();
        
        // Get UI elements
        this.recordButton = document.getElementById('recordButton');
        this.stopButton = document.getElementById('stopButton');
        this.playRecordingButton = document.getElementById('playRecordingButton');
        this.clearRecordingButton = document.getElementById('clearRecordingButton');
        this.recordingsSelector = document.getElementById('recordingsSelector');
        this.playSelectedRecordingButton = document.getElementById('playSelectedRecording');
        this.deleteRecordingButton = document.getElementById('deleteRecording');
        this.renameRecordingButton = document.getElementById('renameRecording');
        
        // Load recordings from storage
        this.loadRecordings();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async loadRecordings() {
        try {
            // Get recordings from window object or storage (now async)
            this.recordings = window.PIANO_RECORDINGS || await StorageManager.loadRecordings();
            this.updateRecordingsSelector();
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.recordings = [];
            this.updateRecordingsSelector();
        }
    }
    
    updateRecordingsSelector() {
        if (!this.recordingsSelector) return;
        
        // Clear existing options
        this.recordingsSelector.innerHTML = '<option value="">Select a Recording</option>';
        
        // Add recordings
        this.recordings.forEach((recording, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = recording.title;
            this.recordingsSelector.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Record button
        if (this.recordButton) {
            this.recordButton.addEventListener('click', () => this.startRecording());
        }
        
        // Stop button
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stopRecording());
            this.stopButton.disabled = true;
        }
        
        // Play recording button
        if (this.playRecordingButton) {
            this.playRecordingButton.addEventListener('click', () => this.playCurrentRecording());
            this.playRecordingButton.disabled = true;
        }
        
        // Clear recording button
        if (this.clearRecordingButton) {
            this.clearRecordingButton.addEventListener('click', () => this.clearRecording());
        }
        
        // Play selected recording button
        if (this.playSelectedRecordingButton) {
            this.playSelectedRecordingButton.addEventListener('click', () => this.playSelectedRecording());
        }
        
        // Delete recording button
        if (this.deleteRecordingButton) {
            this.deleteRecordingButton.addEventListener('click', () => this.deleteRecording());
        }
        
        // Rename recording button
        if (this.renameRecordingButton) {
            this.renameRecordingButton.addEventListener('click', () => this.handleRenameRecordingClick());
        }
        
        // Listen for piano note events
        document.addEventListener('notePlayed', (event) => {
            if (this.isRecording) {
                const { note, timestamp } = event.detail;
                this.recordNote(note, timestamp);
            }
        });
    }
    
    startRecording() {
        // Clear previous recording
        this.recordedNotes = [];
        this.recordingStartTime = Date.now();
        this.isRecording = true;
        
        // Update UI
        this.recordButton.disabled = true;
        this.stopButton.disabled = false;
        this.playRecordingButton.disabled = true;
    }
    
    stopRecording() {
        this.isRecording = false;
        
        // Update UI
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
        
        // Show naming modal if we recorded notes
        if (this.recordedNotes.length > 0) {
            this.modalManager.showNamingModal((name) => {
                this.saveRecording(name);
            });
        } else {
            this.playRecordingButton.disabled = true;
        }
    }
    
    recordNote(note, timestamp) {
        const relativeTime = (timestamp - this.recordingStartTime) / 1000;
        this.recordedNotes.push({
            note: note,
            timestamp: relativeTime
        });
    }
    
    async saveRecording(name) {
        // Create recording object
        const newRecording = {
            id: Date.now(),
            title: name,
            notes: this.recordedNotes
        };
        
        // Add to recordings
        this.recordings.push(newRecording);
        
        // Save to storage (now async)
        try {
            await StorageManager.saveRecordings(this.recordings);
            
            // Update UI
            this.updateRecordingsSelector();
            this.playRecordingButton.disabled = false;
            
            // Select the new recording
            this.recordingsSelector.value = this.recordings.length - 1;
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('There was an error saving your recording. Please try again.');
        }
    }
    
    playCurrentRecording() {
        if (this.recordedNotes.length === 0) return;
        
        this.songPlayer.playSong(this.recordedNotes);
    }
    
    playSelectedRecording() {
        const index = parseInt(this.recordingsSelector.value, 10);
        
        if (!isNaN(index) && index >= 0 && this.recordings[index]) {
            this.songPlayer.playSong(this.recordings[index].notes);
        }
    }
    
    clearRecording() {
        this.recordedNotes = [];
        this.playRecordingButton.disabled = true;
    }
    
    async deleteRecording() {
        const index = parseInt(this.recordingsSelector.value, 10);
        
        if (!isNaN(index) && index >= 0) {
            // Remove recording
            this.recordings.splice(index, 1);
            
            // Save to storage (now async)
            try {
                await StorageManager.saveRecordings(this.recordings);
                
                // Update UI
                this.updateRecordingsSelector();
            } catch (error) {
                console.error('Error deleting recording:', error);
                alert('There was an error deleting your recording. Please try again.');
            }
        }
    }
    
    async handleRenameRecordingClick() {
        const index = parseInt(this.recordingsSelector.value, 10);
        
        if (!isNaN(index) && index >= 0 && this.recordings[index]) {
            this.modalManager.showRecordingRenameModal(
                this.recordings[index].title,
                async (newName) => {
                    // Update recording title
                    this.recordings[index].title = newName;
                    
                    // Save and update UI (now async)
                    try {
                        await StorageManager.saveRecordings(this.recordings);
                        this.updateRecordingsSelector();
                        this.recordingsSelector.value = index;
                    } catch (error) {
                        console.error('Error renaming recording:', error);
                        alert('There was an error renaming your recording. Please try again.');
                    }
                }
            );
        }
    }
    
    // Set SongPlayer reference for playback
    setSongPlayer(songPlayer) {
        this.songPlayer = songPlayer;
    }
}