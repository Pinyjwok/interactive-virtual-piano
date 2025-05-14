/**
 * Guided Play - A feature for the piano application that allows users to play along
 * with a selected song using a waterfall-style note visualization.
 */

class GuidedPlay {
    constructor(piano) {
        this.piano = piano;
        this.noteCanvas = document.getElementById('noteCanvas');
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            difficulty: 'beginner',
            currentSong: null,
            score: 0,
            accuracy: 0,
            combo: 0,
            maxCombo: 0,
            notesHit: 0,
            notesMissed: 0,
            totalNotes: 0
        };
        
        // Animation properties based on difficulty
        this.difficultySettings = {
            beginner: {
                fallSpeed: 180, // pixels per second
                hitWindow: 250, // milliseconds
                pointsPerNote: 100
            },
            intermediate: {
                fallSpeed: 250,
                hitWindow: 180,
                pointsPerNote: 150
            },
            advanced: {
                fallSpeed: 320,
                hitWindow: 120,
                pointsPerNote: 200
            }
        };
        
        this.activeNotes = [];
        this.scheduledNotes = [];
        this.lastFrameTime = 0;
        this.songStartTime = 0;
        this.animationFrame = null;
        this.timingIndicator = null;
        
        // Check if instructions have been seen before
        this.instructionsSeen = localStorage.getItem('guidedPlayInstructionsSeen') === 'true';
        
        this.bindEvents();
        this.setupKeyMappings();
        this.createTimingIndicator();
        
        // Show instructions if they haven't been seen or dismissed
        if (!this.instructionsSeen) {
            this.showInstructions();
        }
    }
    
    // Add the missing initializeGuidedPlay method
    initializeGuidedPlay() {
        // Populate the song selector
        this.populateSongSelector();
        
        // Reset game state
        this.resetGameState();
        
        // Set default difficulty
        this.setDifficulty('beginner');
        
        console.log('Guided Play mode initialized successfully');
    }
    
    // Method to populate the song selector dropdown
    populateSongSelector() {
        const songSelector = document.getElementById('guidedPlaySongSelector');
        
        // Clear existing options
        while (songSelector.options.length > 1) {
            songSelector.remove(1);
        }
        
        // Add songs from the window.PIANO_SONGS array
        if (window.PIANO_SONGS && window.PIANO_SONGS.length > 0) {
            window.PIANO_SONGS.forEach((song, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.text = song.title;
                songSelector.add(option);
            });
        }
    }
    
    // Method to reset the game state
    resetGameState() {
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            difficulty: 'beginner',
            currentSong: null,
            score: 0,
            accuracy: 0,
            combo: 0,
            maxCombo: 0,
            notesHit: 0,
            notesMissed: 0,
            totalNotes: 0
        };
        
        // Update UI to reflect reset state
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('currentAccuracy').textContent = '0%';
        document.getElementById('currentCombo').textContent = '0';
        document.getElementById('currentTime').textContent = '0:00';
        document.getElementById('totalTime').textContent = '0:00';
        document.getElementById('progressFill').style.width = '0%';
        
        // Clear any active notes from the canvas
        this.activeNotes = [];
        this.scheduledNotes = [];
        this.noteCanvas.innerHTML = '';
        
        // Update button states
        document.getElementById('startGuidedPlay').disabled = true;
        document.getElementById('pauseGuidedPlay').disabled = true;
        document.getElementById('restartGuidedPlay').disabled = true;
    }
    
    // Create a timing indicator that shows how precise the timing was
    createTimingIndicator() {
        // Create the timing indicator container if it doesn't exist yet
        if (!document.getElementById('timingIndicator')) {
            const container = document.createElement('div');
            container.id = 'timingIndicator';
            container.className = 'timing-indicator';
            
            // Create the timing zones (perfect, good, ok)
            const perfectZone = document.createElement('div');
            perfectZone.className = 'timing-zone perfect-zone';
            perfectZone.innerHTML = '<span>PERFECT</span>';
            
            const goodZoneLeft = document.createElement('div');
            goodZoneLeft.className = 'timing-zone good-zone good-zone-left';
            goodZoneLeft.innerHTML = '<span>GOOD</span>';
            
            const goodZoneRight = document.createElement('div');
            goodZoneRight.className = 'timing-zone good-zone good-zone-right';
            goodZoneRight.innerHTML = '<span>GOOD</span>';
            
            const okZoneLeft = document.createElement('div');
            okZoneLeft.className = 'timing-zone ok-zone ok-zone-left';
            okZoneLeft.innerHTML = '<span>OK</span>';
            
            const okZoneRight = document.createElement('div');
            okZoneRight.className = 'timing-zone ok-zone ok-zone-right';
            okZoneRight.innerHTML = '<span>OK</span>';
            
            // Create the timing marker (will move when a note is hit)
            const marker = document.createElement('div');
            marker.className = 'timing-marker';
            
            // Add all elements to the container
            container.appendChild(okZoneLeft);
            container.appendChild(goodZoneLeft);
            container.appendChild(perfectZone);
            container.appendChild(goodZoneRight);
            container.appendChild(okZoneRight);
            container.appendChild(marker);
            
            // Insert the timing indicator above the timing line
            const timingLine = document.querySelector('.timing-line');
            timingLine.parentNode.insertBefore(container, timingLine);
            
            this.timingIndicator = marker;
        }
    }
    
    bindEvents() {
        // Song selection
        document.getElementById('guidedPlaySongSelector').addEventListener('change', (e) => {
            this.selectSong(e.target.value);
        });
        
        // Difficulty buttons
        document.getElementById('beginnerMode').addEventListener('click', () => this.setDifficulty('beginner'));
        document.getElementById('intermediateMode').addEventListener('click', () => this.setDifficulty('intermediate'));
        document.getElementById('advancedMode').addEventListener('click', () => this.setDifficulty('advanced'));
        
        // Playback controls
        document.getElementById('startGuidedPlay').addEventListener('click', () => this.startGame());
        document.getElementById('pauseGuidedPlay').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartGuidedPlay').addEventListener('click', () => this.restartGame());
        
        // Game over modal buttons
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            document.getElementById('backToMenuFromGuided').click();
        });
        
        // Help button for instructions
        document.getElementById('showHelpButton').addEventListener('click', () => {
            this.showInstructions();
        });
    }
    
    setupKeyMappings() {
        // Set up key mappings for the piano
        this.keyToNoteMap = {};
        const pianoKeys = document.querySelectorAll('#guidedPlaySection .piano-keys .key');
        
        pianoKeys.forEach(key => {
            const keyLabel = key.textContent.trim();
            const noteName = key.getAttribute('data-note');
            
            if (keyLabel && noteName) {
                this.keyToNoteMap[keyLabel.toLowerCase()] = noteName;
            }
        });
        
        // Key press handler
        document.addEventListener('keydown', (e) => {
            if (!this.gameState.isPlaying || this.gameState.isPaused) return;
            
            const key = e.key.toLowerCase();
            if (this.keyToNoteMap[key]) {
                this.handleKeyPress(this.keyToNoteMap[key]);
            }
        });
        
        // Mouse click handler for piano keys
        pianoKeys.forEach(key => {
            key.addEventListener('mousedown', () => {
                if (!this.gameState.isPlaying || this.gameState.isPaused) return;
                
                const noteName = key.getAttribute('data-note');
                if (noteName) {
                    this.handleKeyPress(noteName);
                }
            });
        });
    }
    
    selectSong(songIndex) {
        if (songIndex === '') {
            this.gameState.currentSong = null;
            this.updateStartButtonState();
            return;
        }
        
        const song = window.PIANO_SONGS[parseInt(songIndex)];
        if (song) {
            this.gameState.currentSong = {
                index: parseInt(songIndex),
                name: song.title,
                notes: this.convertSongNotes(song.notes),
                duration: this.calculateSongDuration(this.convertSongNotes(song.notes))
            };
            
            // Update the total time display
            document.getElementById('totalTime').textContent = this.formatTime(this.gameState.currentSong.duration);
            this.updateStartButtonState();
        }
    }
    
    // Convert song notes from timestamp property to time property for consistency
    convertSongNotes(notes) {
        if (!notes || notes.length === 0) return [];
        
        return notes.map(note => {
            return {
                note: note.note,
                time: note.timestamp !== undefined ? note.timestamp : note.time,
                duration: note.duration || 0.5
            };
        });
    }
    
    calculateSongDuration(notes) {
        if (!notes || notes.length === 0) return 0;
        
        // Find the last note's time
        let lastNoteTime = 0;
        notes.forEach(note => {
            const noteEndTime = note.time + (note.duration || 0.5);
            if (noteEndTime > lastNoteTime) {
                lastNoteTime = noteEndTime;
            }
        });
        
        return lastNoteTime + 2; // Add 2 seconds buffer at the end
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    setDifficulty(level) {
        // Update active button
        document.querySelectorAll('.difficulty-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${level}Mode`).classList.add('active');
        
        this.gameState.difficulty = level;
    }
    
    updateStartButtonState() {
        const startButton = document.getElementById('startGuidedPlay');
        startButton.disabled = !this.gameState.currentSong;
    }
    
    startGame() {
        if (!this.gameState.currentSong) {
            console.warn('Cannot start game: no song selected');
            return;
        }
        
        if (this.gameState.isPaused) {
            // Resume the game
            this.gameState.isPaused = false;
            document.getElementById('pauseGuidedPlay').textContent = 'Pause';
            this.animate();
            return;
        }
        
        // Reset game state but keep the current song
        const currentSong = this.gameState.currentSong;
        this.resetGameState();
        this.gameState.currentSong = currentSong;
        
        // Prepare the note schedule
        const success = this.prepareNoteSchedule();
        
        if (!success) {
            console.error('Failed to prepare notes. Cannot start game.');
            return;
        }
        
        // Start countdown
        this.showCountdown(() => {
            // Start the game
            this.gameState.isPlaying = true;
            this.songStartTime = performance.now();
            this.lastFrameTime = this.songStartTime;
            
            // Enable pause and restart buttons
            document.getElementById('pauseGuidedPlay').disabled = false;
            document.getElementById('restartGuidedPlay').disabled = false;
            document.getElementById('startGuidedPlay').disabled = true;
            
            // Start animation
            this.animate();
        });
    }
    
    prepareNoteSchedule() {
        if (!this.gameState.currentSong || !this.gameState.currentSong.notes) {
            console.error('Cannot prepare note schedule: no song or notes available');
            return false;
        }
        
        try {
            // Get the timing line element and its exact position
            const timingLine = document.querySelector('.timing-line');
            if (!timingLine) {
                console.error('Cannot find timing line element');
                return false;
            }
            
            const canvasRect = this.noteCanvas.getBoundingClientRect();
            const timingLineRect = timingLine.getBoundingClientRect();
            
            // Calculate the exact position of the timing line relative to the canvas
            const timingLinePosition = timingLineRect.top - canvasRect.top;
            
            // Verify that we have a valid position
            if (isNaN(timingLinePosition) || timingLinePosition <= 0) {
                console.error('Invalid timing line position:', timingLinePosition);
                // Use a default value as fallback
                this.timingLinePosition = this.noteCanvas.clientHeight;
                console.log('Using fallback timing line position:', this.timingLinePosition);
            } else {
                // Store this for use in other methods
                this.timingLinePosition = timingLinePosition;
                console.log('Timing line position set to:', timingLinePosition);
            }
            
            // Get the piano keys container for accurate positioning
            const pianoKeysContainer = document.querySelector('#guidedPlaySection .piano-keys');
            const pianoRect = pianoKeysContainer.getBoundingClientRect();
            
            // Calculate the offset for aligning notes with keys
            const offsetX = pianoRect.left - canvasRect.left;
            
            // Store all key positions once for better performance
            const keyPositions = {};
            const pianoKeys = document.querySelectorAll('#guidedPlaySection .piano-keys .key');
            
            pianoKeys.forEach(key => {
                const noteName = key.getAttribute('data-note');
                if (noteName) {
                    const keyRect = key.getBoundingClientRect();
                    const isBlack = key.classList.contains('black');
                    const noteWidth = isBlack ? 20 : 32; // Match the key widths
                    
                    // Calculate the center position of the key relative to the canvas
                    const left = keyRect.left - canvasRect.left + (keyRect.width - noteWidth) / 2;
                    
                    keyPositions[noteName] = {
                        left: left,
                        width: noteWidth,
                        isBlack: isBlack
                    };
                }
            });
            
            // Count the total number of notes for statistics
            this.gameState.totalNotes = this.gameState.currentSong.notes.length;
            
            // Prepare each note
            this.scheduledNotes = this.gameState.currentSong.notes.map((note, index) => {
                // Check if we have position data for this note
                if (!keyPositions[note.note]) {
                    console.warn(`No position data for note: ${note.note}`);
                    return null;
                }
                
                const keyInfo = keyPositions[note.note];
                
                return {
                    id: `note-${index}`,
                    note: note.note,
                    time: note.time,
                    duration: note.duration || 0.5,
                    left: keyInfo.left,
                    width: keyInfo.width,
                    isBlack: keyInfo.isBlack,
                    height: Math.max(30, (note.duration || 0.5) * this.difficultySettings[this.gameState.difficulty].fallSpeed),
                    element: null,
                    active: false,
                    hit: false,
                    missed: false
                };
            }).filter(note => note !== null);
            
            console.log(`Prepared ${this.scheduledNotes.length} notes out of ${this.gameState.totalNotes} total notes`);
            return this.scheduledNotes.length > 0;
        } catch (error) {
            console.error('Error preparing note schedule:', error);
            return false;
        }
    }
    
    findKeyElement(noteName) {
        return document.querySelector(`#guidedPlaySection .piano-keys .key[data-note="${noteName}"]`);
    }
    
    showCountdown(callback) {
        // Create countdown overlay
        const overlay = document.createElement('div');
        overlay.className = 'countdown-overlay';
        document.querySelector('.guided-play-container').appendChild(overlay);
        
        let count = 3;
        
        const updateCount = () => {
            overlay.innerHTML = `<div class="countdown-number">${count}</div>`;
            count--;
            
            if (count >= 0) {
                setTimeout(updateCount, 1000);
            } else {
                // Remove overlay and start the game
                overlay.remove();
                callback();
            }
        };
        
        updateCount();
    }
    
    animate() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        // If currentSong is null, stop the animation to prevent error spam
        if (!this.gameState.currentSong) {
            console.error('Animation loop running with null currentSong. Stopping animation.');
            this.stopGame();
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Calculate elapsed time since song start
        const elapsedTime = (currentTime - this.songStartTime) / 1000; // Convert to seconds
        
        // Update progress bar and time display
        this.updateProgress(elapsedTime);
        
        // Add new notes that should now be visible
        this.addNewNotes(elapsedTime);
        
        // Move existing notes
        this.moveNotes(deltaTime);
        
        // Check for missed notes
        this.checkMissedNotes(elapsedTime);
        
        // Check if song is complete
        if (this.isSongComplete(elapsedTime)) {
            this.endGame();
            return;
        }
        
        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    addNewNotes(currentTime) {
        // Use the precisely measured timing line position stored during prepareNoteSchedule
        const timingLinePosition = this.timingLinePosition;
        
        // If timingLinePosition is undefined, we need to handle it
        if (!timingLinePosition || isNaN(timingLinePosition)) {
            console.error('Invalid timing line position in addNewNotes:', timingLinePosition);
            
            // Try to fix the timing line position if possible
            if (this.noteCanvas) {
                // Use a reasonable default fallback: 70% of the canvas height
                this.timingLinePosition = this.noteCanvas.clientHeight * 0.7;
                console.log('Using fallback timing line position in addNewNotes:', this.timingLinePosition);
            } else {
                // If we can't even get the canvas, we have bigger problems
                console.error('noteCanvas is not available');
                return;
            }
        }
        
        // Calculate travel time using the timing line position
        const fallSpeed = this.difficultySettings[this.gameState.difficulty].fallSpeed;
        let travelTime = this.timingLinePosition / fallSpeed;
        
        if (isNaN(travelTime)) {
            console.error('Travel time calculation resulted in NaN. Using fallback value.');
            // Use a reasonable default fallback
            travelTime = 3; // 3 seconds is a reasonable default
        }
        
        // Log for debugging
        console.log('Current time:', currentTime, 'Travel time for notes:', travelTime, 'seconds', 'Timing line position:', this.timingLinePosition);
        
        // Only process if we have scheduled notes
        if (!this.scheduledNotes || !this.scheduledNotes.length) {
            console.warn('No scheduled notes available');
            return;
        }
        
        // Find notes that should be visible now (their time - travelTime <= currentTime)
        this.scheduledNotes.forEach(note => {
            if (!note.active && !note.element && note.time - travelTime <= currentTime) {
                this.createNoteElement(note);
                note.active = true;
                this.activeNotes.push(note);
                console.log('Created note element for note:', note.note, 'at time:', note.time);
            }
        });
    }
    
    createNoteElement(note) {
        // Create note element
        const noteElement = document.createElement('div');
        noteElement.className = `falling-note ${note.isBlack ? 'black-note' : 'white-note'}`;
        noteElement.id = note.id;
        noteElement.style.width = `${note.width}px`;
        noteElement.style.height = `${note.height}px`;
        noteElement.style.left = `${note.left}px`;
        noteElement.style.top = `-${note.height}px`; // Start above the visible area
        
        // Make sure the note is visible with explicit styling
        if (note.isBlack) {
            noteElement.style.background = 'linear-gradient(to bottom, #333, #000)';
            noteElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.7)';
            noteElement.style.border = '1px solid rgba(0, 0, 0, 0.8)';
        } else {
            noteElement.style.background = 'linear-gradient(to bottom, #fff, #f0f0f0)';
            noteElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.6)';
            noteElement.style.border = '1px solid rgba(0, 0, 0, 0.4)';
        }
        
        // Debug information directly on the note - we'll remove this later
        noteElement.innerHTML = `<span style="color: ${note.isBlack ? 'white' : 'black'}; font-size: 8px;">${note.note}</span>`;
        
        // Set z-index to ensure notes are visible
        noteElement.style.zIndex = "10";
        
        this.noteCanvas.appendChild(noteElement);
        note.element = noteElement;
        
        // Verify the note was added to the DOM
        console.log('Created note element:', note.id, 'for note:', note.note, 'DOM added:', this.noteCanvas.contains(noteElement));
    }
    
    moveNotes(deltaTime) {
        const fallSpeed = this.difficultySettings[this.gameState.difficulty].fallSpeed;
        const distance = fallSpeed * deltaTime;
        
        this.activeNotes.forEach(note => {
            if (note.element) {
                const currentTop = parseFloat(note.element.style.top || 0);
                note.element.style.top = `${currentTop + distance}px`;
            }
        });
    }
    
    checkMissedNotes(currentTime) {
        console.log('Checking for missed notes at time:', currentTime);
        
        // Calculate the miss window - once a note is this far past its time, it's considered missed
        const missWindow = this.difficultySettings[this.gameState.difficulty].hitWindow / 1000;
        
        // Keep a count for logging
        let missedCount = 0;
        
        this.activeNotes.forEach(note => {
            if (!note.hit && !note.missed && note.time + missWindow < currentTime) {
                missedCount++;
                console.log('Found missed note:', note.note, 'at time:', note.time, 'current time:', currentTime);
                this.missNote(note);
            }
        });
        
        if (missedCount > 0) {
            console.log(`Total ${missedCount} notes marked as missed`);
        }
    }
    
    isSongComplete(currentTime) {
        // Check if currentSong exists before trying to access its properties
        if (!this.gameState.currentSong) {
            console.warn('Cannot check if song is complete: currentSong is null');
            return false;
        }
        
        return currentTime >= this.gameState.currentSong.duration &&
               this.activeNotes.length === 0 &&
               this.scheduledNotes.every(note => note.hit || note.missed);
    }
    
    handleKeyPress(noteName) {
        console.log('GuidedPlay handleKeyPress called:', noteName);
        
        if (!this.gameState.isPlaying || this.gameState.isPaused) {
            console.log('Game not playing or paused, ignoring key press');
            return;
        }
        
        const currentTime = (performance.now() - this.songStartTime) / 1000;
        const hitWindow = this.difficultySettings[this.gameState.difficulty].hitWindow / 1000;
        
        console.log('Current game time:', currentTime, 'Hit window:', hitWindow);
        
        // Find the closest active note matching this key
        let closestNote = null;
        let smallestTimeDiff = Infinity;
        
        this.activeNotes.forEach(note => {
            if (note.note === noteName && !note.hit && !note.missed) {
                const timeDiff = Math.abs(note.time - currentTime);
                console.log('Found active note:', note.note, 'Time diff:', timeDiff);
                if (timeDiff < smallestTimeDiff) {
                    smallestTimeDiff = timeDiff;
                    closestNote = note;
                }
            }
        });
        
        if (closestNote) {
            console.log('Closest matching note found:', closestNote.note, 'Time diff:', smallestTimeDiff);
        } else {
            console.log('No matching note found');
        }
        
        // If found a note within the hit window, mark it as hit
        if (closestNote && smallestTimeDiff <= hitWindow) {
            console.log('Hit window satisfied, hitting note');
            this.hitNote(closestNote, smallestTimeDiff);
        } else {
            // Play the note anyway, but no points (wrong timing)
            console.log('No valid note to hit, just playing sound with fromGuidedPlay=true');
            this.piano.playNote(noteName, 0.5, true);
        }
    }
    
    hitNote(note, timeDiff) {
        console.log('hitNote called:', { note: note.note, timeDiff });
        note.hit = true;
        
        // Determine hit quality based on timing
        const hitWindow = this.difficultySettings[this.gameState.difficulty].hitWindow / 1000;
        const perfectWindow = hitWindow / 3;
        const goodWindow = hitWindow * 2 / 3;
        
        let hitQuality = 'perfect';
        let hitPoints = this.difficultySettings[this.gameState.difficulty].pointsPerNote;
        
        if (timeDiff <= perfectWindow) {
            hitQuality = 'perfect';
            // Perfect hit gets full points
        } else if (timeDiff <= goodWindow) {
            hitQuality = 'good';
            hitPoints = Math.floor(hitPoints * 0.8); // 80% of points for good hit
        } else {
            hitQuality = 'ok';
            hitPoints = Math.floor(hitPoints * 0.5); // 50% of points for ok hit
        }
        
        console.log('Hit quality:', hitQuality, 'Points:', hitPoints);
        
        // Apply combo multiplier
        const comboMultiplier = 1 + Math.min(0.5, this.gameState.combo * 0.01); // Max 50% bonus
        hitPoints = Math.floor(hitPoints * comboMultiplier);
        
        // Update game state
        this.gameState.score += hitPoints;
        this.gameState.notesHit++;
        this.gameState.combo++;
        if (this.gameState.combo > this.gameState.maxCombo) {
            this.gameState.maxCombo = this.gameState.combo;
        }
        
        // Calculate accuracy
        this.gameState.accuracy = Math.round((this.gameState.notesHit / (this.gameState.notesHit + this.gameState.notesMissed)) * 100);
        
        // Update displays - Force direct DOM updates to ensure UI refresh
        document.getElementById('currentScore').textContent = this.gameState.score.toLocaleString();
        document.getElementById('currentAccuracy').textContent = this.gameState.accuracy;
        document.getElementById('currentCombo').textContent = this.gameState.combo;
        
        if (this.gameState.combo > 0) {
            document.getElementById('currentCombo').classList.add('combo-highlight');
            setTimeout(() => {
                document.getElementById('currentCombo').classList.remove('combo-highlight');
            }, 300);
        }
        
        // Apply visual feedback
        if (note.element) {
            note.element.classList.add(hitQuality);
        }
        
        // Find the corresponding key and apply hit animation
        const keyElement = this.findKeyElement(note.note);
        if (keyElement) {
            // First remove any existing hit classes to ensure animation plays again
            keyElement.classList.remove('perfect-hit', 'good-hit', 'ok-hit', 'missed-note');
            
            // Force a reflow to ensure animation restarts
            void keyElement.offsetWidth;
            
            // Add the hit class
            keyElement.classList.add(`${hitQuality}-hit`);
            
            // Clean up classes after animation completes
            setTimeout(() => {
                keyElement.classList.remove(`${hitQuality}-hit`);
            }, 300);
        }
        
        // Play the note with appropriate volume based on hit quality
        // Use the fromGuidedPlay parameter to allow this note to play even in guided mode
        const volume = hitQuality === 'perfect' ? 1.0 : 
                     hitQuality === 'good' ? 0.85 : 0.7;
        console.log('Playing note from hitNote with fromGuidedPlay=true:', note.note);
        this.piano.playNote(note.note, volume, true);
        
        // Show timing indicator feedback
        this.showTimingFeedback(timeDiff, hitWindow);
        
        // Show score popup
        this.showScorePopup(note, hitPoints, hitQuality);
    }
    
    showTimingFeedback(timeDiff, hitWindow) {
        if (!this.timingIndicator) return;
        
        // Calculate position based on time difference
        // 0 time difference = center
        // max time difference = edge
        const normalizedDiff = timeDiff / hitWindow; // 0 to 1
        
        // Calculate the position (from -50 to 50)
        // 0 is perfect (center), -50 is early (left), 50 is late (right)a
        let position = (timeDiff < 0 ? -1 : 1) * (Math.abs(normalizedDiff) * 50);
        
        // Clamp between -50 and 50
        position = Math.max(-50, Math.min(50, position));
        
        // Set the marker position
        this.timingIndicator.style.transform = `translateX(${position}%)`;
        
        // Add appropriate class
        this.timingIndicator.className = 'timing-marker';
        if (Math.abs(normalizedDiff) <= 1/3) {
            this.timingIndicator.classList.add('perfect-timing');
        } else if (Math.abs(normalizedDiff) <= 2/3) {
            this.timingIndicator.classList.add('good-timing');
        } else {
            this.timingIndicator.classList.add('ok-timing');
        }
        
        // Reset after animation
        setTimeout(() => {
            if (this.timingIndicator) {
                this.timingIndicator.className = 'timing-marker';
                this.timingIndicator.style.transform = 'translateX(0)';
            }
        }, 500);
    }
    
    missNote(note) {
        note.missed = true;
        
        // Update game state
        this.gameState.combo = 0;
        this.gameState.notesMissed++;
        
        // Calculate accuracy
        this.gameState.accuracy = Math.round((this.gameState.notesHit / (this.gameState.notesHit + this.gameState.notesMissed)) * 100);
        
        // Update displays - Direct DOM updates for reliability
        document.getElementById('currentAccuracy').textContent = this.gameState.accuracy;
        document.getElementById('currentCombo').textContent = this.gameState.combo;
        
        // Apply visual feedback
        if (note.element) {
            note.element.classList.add('missed');
        }
        
        // Find the corresponding key and apply missed animation
        const keyElement = this.findKeyElement(note.note);
        if (keyElement) {
            // First remove any existing hit classes to ensure animation plays again
            keyElement.classList.remove('perfect-hit', 'good-hit', 'ok-hit', 'missed-note');
            
            // Force a reflow to ensure animation restarts
            void keyElement.offsetWidth;
            
            // Add the missed class
            keyElement.classList.add('missed-note');
            
            // Clean up after animation completes
            setTimeout(() => {
                keyElement.classList.remove('missed-note');
            }, 300);
        }
        
        // Show miss popup
        this.showScorePopup(note, 0, 'miss');
        
        // NOTE: We intentionally don't play the note sound for missed notes to avoid 
        // automatic key presses that the user didn't make
    }
    
    showScorePopup(note, points, quality) {
        if (!note.element) return;
        
        const popup = document.createElement('div');
        popup.className = `score-popup ${quality}`;
        
        if (quality === 'miss') {
            popup.textContent = 'MISS';
        } else {
            popup.textContent = `+${points} ${quality.toUpperCase()}`;
        }
        
        // Position popup near the note
        const noteRect = note.element.getBoundingClientRect();
        const canvasRect = this.noteCanvas.getBoundingClientRect();
        
        popup.style.left = `${noteRect.left - canvasRect.left + (noteRect.width / 2)}px`;
        popup.style.top = `${noteRect.top - canvasRect.top}px`;
        
        this.noteCanvas.appendChild(popup);
        
        // Remove popup after animation
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1000);
    }
    
    updateProgress(currentTime) {
        // Check if currentSong exists before trying to access its properties
        if (!this.gameState.currentSong) {
            console.warn('Cannot update progress: currentSong is null');
            return;
        }
        
        const percentage = (currentTime / this.gameState.currentSong.duration) * 100;
        document.getElementById('progressFill').style.width = `${Math.min(100, percentage)}%`;
        document.getElementById('currentTime').textContent = this.formatTime(currentTime);
    }
    
    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.gameState.score.toLocaleString();
    }
    
    updateAccuracyDisplay() {
        document.getElementById('currentAccuracy').textContent = this.gameState.accuracy;
    }
    
    updateComboDisplay(highlight = false) {
        const comboElement = document.getElementById('currentCombo');
        comboElement.textContent = this.gameState.combo;
        
        if (highlight && this.gameState.combo > 0) {
            comboElement.classList.add('combo-highlight');
            setTimeout(() => {
                comboElement.classList.remove('combo-highlight');
            }, 300);
        }
    }
    
    pauseGame() {
        if (!this.gameState.isPlaying) return;
        
        if (this.gameState.isPaused) {
            // Resume
            this.gameState.isPaused = false;
            document.getElementById('pauseGuidedPlay').textContent = 'Pause';
            this.lastFrameTime = performance.now();
            this.animate();
        } else {
            // Pause
            this.gameState.isPaused = true;
            document.getElementById('pauseGuidedPlay').textContent = 'Resume';
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    restartGame() {
        // Stop current game
        this.stopGame();
        
        // Start a new game
        this.startGame();
    }
    
    stopGame() {
        // Mark the game as not playing and not paused
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;
        
        // Cancel the animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Reset timing line position and clear travel time to fix issues on restart
        this.timingLinePosition = null;
        
        // Reset UI elements
        document.getElementById('pauseGuidedPlay').disabled = true;
        document.getElementById('restartGuidedPlay').disabled = true;
        document.getElementById('startGuidedPlay').disabled = !this.gameState.currentSong;
        
        // Clear any notes from the canvas
        this.noteCanvas.innerHTML = '';
        this.activeNotes = [];
        this.scheduledNotes = [];
        
        console.log('Game stopped and all resources cleaned up');
    }
    
    endGame() {
        this.stopGame();
        
        // Calculate final statistics
        const finalAccuracy = this.gameState.accuracy;
        let grade = 'F';
        
        if (finalAccuracy >= 95) grade = 'S';
        else if (finalAccuracy >= 90) grade = 'A+';
        else if (finalAccuracy >= 85) grade = 'A';
        else if (finalAccuracy >= 80) grade = 'B+';
        else if (finalAccuracy >= 75) grade = 'B';
        else if (finalAccuracy >= 70) grade = 'C+';
        else if (finalAccuracy >= 65) grade = 'C';
        else if (finalAccuracy >= 60) grade = 'D+';
        else if (finalAccuracy >= 55) grade = 'D';
        else grade = 'F';
        
        // Update game over modal
        document.getElementById('finalScore').textContent = this.gameState.score.toLocaleString();
        document.getElementById('finalAccuracy').textContent = `${finalAccuracy}%`;
        document.getElementById('highestCombo').textContent = this.gameState.maxCombo;
        document.getElementById('notesHit').textContent = `${this.gameState.notesHit}/${this.gameState.totalNotes}`;
        document.getElementById('performanceGrade').textContent = grade;
        
        // Show Continue Iteration Modal instead of game over modal immediately
        if (window.modalManager) {
            window.modalManager.showContinueIterationModal((continueIteration) => {
                if (continueIteration) {
                    // User chose to continue with the same song
                    this.restartGame();
                } else {
                    // User chose not to continue, show game over modal
                    this.showGameOverModal();
                    
                    // Auto-navigate to main menu after 30 seconds of inactivity
                    this.setupAutoReturnToMenu();
                }
            });
        } else {
            // Fallback to showing game over modal directly if modal manager isn't available
            this.showGameOverModal();
            
            // Auto-navigate to main menu after 30 seconds of inactivity
            this.setupAutoReturnToMenu();
        }
    }
    
    // Function to automatically return to the main menu after performance results
    setupAutoReturnToMenu() {
        // Clear any existing timers
        if (this.returnToMenuTimer) {
            clearTimeout(this.returnToMenuTimer);
        }
        
        // Set timeout for 30 seconds
        this.returnToMenuTimer = setTimeout(() => {
            this.hideGameOverModal();
            // Use the showSection function from piano.js to navigate back to main menu
            if (typeof showSection === 'function') {
                showSection('mainMenuSection');
                console.log('Auto-navigating to main menu after performance results');
            } else {
                // Fallback method if showSection isn't available
                document.getElementById('backToMenuFromGuided').click();
            }
        }, 30000); // 30 seconds
        
        // Cancel the auto-return if user interacts with the modal
        const modal = document.getElementById('gameOverModal');
        
        // Clear event listeners to avoid duplicates
        const modalClone = modal.cloneNode(true);
        modal.parentNode.replaceChild(modalClone, modal);
        
        // Set up new event listeners
        const tryAgainBtn = document.getElementById('tryAgainBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        
        tryAgainBtn.addEventListener('click', () => {
            if (this.returnToMenuTimer) {
                clearTimeout(this.returnToMenuTimer);
                this.returnToMenuTimer = null;
            }
            this.hideGameOverModal();
            this.restartGame();
        });
        
        backToMenuBtn.addEventListener('click', () => {
            if (this.returnToMenuTimer) {
                clearTimeout(this.returnToMenuTimer);
                this.returnToMenuTimer = null;
            }
            this.hideGameOverModal();
            document.getElementById('backToMenuFromGuided').click();
        });
        
        // Also clear the timer on any user interaction with the modal
        modalClone.addEventListener('click', () => {
            if (this.returnToMenuTimer) {
                clearTimeout(this.returnToMenuTimer);
                // Restart the timer
                this.setupAutoReturnToMenu();
            }
        });
    }
    
    showGameOverModal() {
        document.getElementById('gameOverModal').style.display = 'block';
    }
    
    hideGameOverModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }
    
    // Show instructions for the guided play mode
    showInstructions() {
        const modal = document.getElementById('instructionsModal');
        if (modal) {
            modal.style.display = 'block';
            // This function will be called by piano.js when needed
            function stopGuidedPlay() {
                if (window.guidedPlay) {
                    window.guidedPlay.stopGame();
                    
                    // Ensure guided play mode is disabled on the piano
                    if (window.piano) {
                        window.piano.setGuidedPlayMode(false);
                    }
                }
            }            
            // Set up event listener for the Got it button
            document.getElementById('showInstructionsButton').addEventListener('click', () => {
                this.hideInstructions();
                
                // Check if "don't show again" is checked
                const dontShowAgain = document.getElementById('dontShowAgain').checked;
                if (dontShowAgain) {
                    this.instructionsSeen = true;
                    localStorage.setItem('guidedPlayInstructionsSeen', 'true');
                }
            });
        }
    }
    
    // Hide the instructions modal
    hideInstructions() {
        const modal = document.getElementById('instructionsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Function to load songs into the guided play song selector
function loadGuidedPlaySongs() {
    const songSelector = document.getElementById('guidedPlaySongSelector');
    songSelector.innerHTML = '<option value="">Select a Song</option>';
    
    // Use window.PIANO_SONGS which is where songs are actually stored
    const songs = window.PIANO_SONGS || [];
    
    if (songs.length === 0) {
        songSelector.innerHTML += '<option disabled>No songs available</option>';
        return;
    }
    
    songs.forEach((song, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = song.title; // Change 'name' to 'title' to match songs.js structure
        songSelector.appendChild(option);
    });
}

// Function to stop the guided play if active
function stopGuidedPlay() {
    if (window.guidedPlay) {
        window.guidedPlay.stopGame();
        
        // Ensure guided play mode is disabled on the piano
        if (window.piano) {
            window.piano.setGuidedPlayMode(false);
        }
    }
}