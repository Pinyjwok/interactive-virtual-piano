class Piano {
    constructor() {
        // Current octave offset (can be shifted up or down)
        this.octaveOffset = 0;
        
        this.keyToNoteMap = {
            // Octave 3 - white keys
            'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
            // Octave 3 - black keys
            's': 'C#3', 'd': 'D#3', 'g': 'F#3', 'h': 'G#3', 'j': 'A#3',
            
            // Octave 4 - white keys
            'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4',
            // Octave 4 - black keys
            '2': 'C#4', '3': 'D#4', '5': 'F#4', '6': 'G#4', '7': 'A#4',
        };
        
        // Define the octave shift keys (use Z/X instead of comma/period)
        this.octaveShiftKeys = {
            ',': -2, // shift down by 2 octaves
            '.': 2,  // shift up by 2 octaves
            '<': -2, // shift down by 2 octaves (alternative key)
            '>': 2   // shift up by 2 octaves (alternative key)
        };
        
        // Frequency mapping for notes
        this.noteToFreq = {
            'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20,
            'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00,
            'A#1': 58.27, 'B1': 61.74,
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41,
            'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00,
            'A#2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 
            'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 
            'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 
            'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 
            'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46, 
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 
            'B5': 987.77, 'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 
            'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 
            'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
        };
        
        // Initialize Web Audio API
        this.initializeAudio();
        
        // Available piano types
        this.pianoTypes = {
            'grand': {
                name: 'Grand Piano',
                settings: {
                    waveform: 'sine',
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.8,
                    release: 0.8,
                    harmonics: [1, 0.5, 0.25]
                }
            },
            'rhodes': {
                name: 'Rhodes Piano',
                settings: {
                    waveform: 'triangle',
                    attack: 0.02,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 1.2,
                    harmonics: [1]
                }
            },
            'toy': {
                name: 'Toy Piano',
                settings: {
                    waveform: 'square',
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.5,
                    release: 0.3,
                    harmonics: [1]
                }
            },
            'synth': {
                name: 'Synth Piano',
                settings: {
                    waveform: 'sawtooth',
                    attack: 0.03,
                    decay: 0.2,
                    sustain: 0.6,
                    release: 1.5,
                    harmonics: [1]
                }
            },
            'upright': {
                name: 'Upright Piano',
                settings: {
                    waveform: 'sine',
                    attack: 0.015,
                    decay: 0.1,
                    sustain: 0.7,
                    release: 0.6,
                    harmonics: [1, 0.4, 0.2, 0.1]
                }
            }
        };
        
        // Set default piano type
        this.currentPianoType = 'grand';
        
        // Set default volume
        this.volume = 0.5;
        this.setVolume(this.volume);
        
        // Track mouse drag state
        this.isDragging = false;

        // Keep track of which mode we're in
        this.isInGuidedPlayMode = false;
        
        // Currently active notes (for polyphony handling)
        this.activeNotes = new Map();
        
        // Setup UI handling
        this.setupEventListeners();
    }
    
    // Initialize Web Audio API
    initializeAudio() {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Create master gain node for volume control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        console.log('Web Audio API initialized');
    }
    
    // Create an oscillator for a specific note
    createOscillator(frequency, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }
    
    // Create an ADSR envelope using gain nodes
    createEnvelope(attackTime, decayTime, sustainLevel, releaseTime) {
        const envelope = this.audioContext.createGain();
        const now = this.audioContext.currentTime;
        
        // Start at zero
        envelope.gain.setValueAtTime(0, now);
        
        // Attack phase
        envelope.gain.linearRampToValueAtTime(1, now + attackTime);
        
        // Decay phase
        envelope.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        
        return envelope;
    }
    
    // Release the envelope
    releaseEnvelope(envelope, releaseTime) {
        const now = this.audioContext.currentTime;
        const currentValue = envelope.gain.value;
        
        // Cancel scheduled values and set current value
        envelope.gain.cancelScheduledValues(now);
        envelope.gain.setValueAtTime(currentValue, now);
        
        // Release phase
        envelope.gain.linearRampToValueAtTime(0, now + releaseTime);
        
        // Stop oscillator after release
        return now + releaseTime;
    }
    
    // Create additive synthesis for harmonics
    createAdditiveOscillator(frequency, harmonics, type) {
        const gain = this.audioContext.createGain();
        gain.gain.value = 1.0 / harmonics.length; // Normalize volume
        
        // Create and connect oscillators for each harmonic
        const oscillators = harmonics.map((relativeAmplitude, index) => {
            const harmonicFrequency = frequency * (index + 1);
            const oscillator = this.createOscillator(harmonicFrequency, type);
            
            const harmonicGain = this.audioContext.createGain();
            harmonicGain.gain.value = relativeAmplitude;
            
            oscillator.connect(harmonicGain);
            harmonicGain.connect(gain);
            
            return oscillator;
        });
        
        return { oscillators, output: gain };
    }
    
    // Change the piano type
    setPianoType(type) {
        if (this.pianoTypes[type]) {
            this.currentPianoType = type;
            
            // Save the preference to localStorage
            localStorage.setItem('preferredPianoType', type);
            
            // Update piano visual appearance by changing classes
            const pianos = document.querySelectorAll('.piano');
            pianos.forEach(piano => {
                // Remove all piano type classes
                piano.classList.remove('grand', 'rhodes', 'toy', 'synth', 'upright');
                // Add the new class
                piano.classList.add(type);
            });
            
            // Update the piano brand name
            const pianoTypeSettings = this.pianoTypes[type];
            pianos.forEach(piano => {
                const beforeStyle = window.getComputedStyle(piano, '::before');
                if (beforeStyle) {
                    // This doesn't directly work for pseudo-elements, but this is the concept
                    // You would need to use a data attribute or class to influence the ::before content
                    piano.setAttribute('data-piano-type', pianoTypeSettings.name);
                }
            });
            
            console.log(`Piano type changed to ${pianoTypeSettings.name}`);
            return true;
        }
        return false;
    }
    
    // Set guided play mode
    setGuidedPlayMode(isEnabled) {
        console.log('Setting guided play mode:', isEnabled);
        this.isInGuidedPlayMode = isEnabled;
    }
    
    // Set the volume level (0-1)
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        // Set the gain value directly
        this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }

    // Play a note with Web Audio API
    playNote(note, duration = 0.5, fromGuidedPlay = false) {
        // Check if the note is valid
        console.log('playNote called:', { note, duration, fromGuidedPlay, isInGuidedPlayMode: this.isInGuidedPlayMode });
        
        const key = document.querySelector(`.key[data-note="${note}"]`);
        
        if (key && this.pianoTypes[this.currentPianoType]) {
            // Skip automated note playing in guided play mode
            // unless explicitly requested by the guided play controller
            if (this.isInGuidedPlayMode && !fromGuidedPlay) {
                console.log('Skipping note in guided mode (not from guided play)');
                return;
            }
            
            // Make sure audio context is running
            if (this.audioContext.state !== 'running') {
                this.audioContext.resume();
            }
            
            console.log('Actually playing the note:', note);
            
            // Get frequency for the note
            const frequency = this.noteToFreq[note];
            if (!frequency) {
                console.error('Unknown note:', note);
                return;
            }
            
            // Get piano type settings
            const pianoSettings = this.pianoTypes[this.currentPianoType].settings;
            
            // Create oscillator with appropriate harmonics
            const { oscillators, output } = this.createAdditiveOscillator(
                frequency, 
                pianoSettings.harmonics, 
                pianoSettings.waveform
            );
            
            // Create envelope
            const envelope = this.createEnvelope(
                pianoSettings.attack,
                pianoSettings.decay,
                pianoSettings.sustain,
                pianoSettings.release
            );
            
            // Connect the oscillator to the envelope and then to the master gain
            output.connect(envelope);
            envelope.connect(this.masterGain);
            
            // Start all oscillators
            const now = this.audioContext.currentTime;
            oscillators.forEach(osc => osc.start(now));
            
            // Store note in active notes map
            this.activeNotes.set(note, {
                oscillators: oscillators,
                envelope: envelope,
                startTime: now,
                duration: duration
            });
            
            // Visual feedback
            key.classList.add('active');
            
            // Add the feint highlight animation to track keyboard position
            this.addKeyHighlight(key);
            
            // Schedule note stop after duration
            if (duration > 0) {
                const stopTime = this.releaseEnvelope(envelope, pianoSettings.release);
                
                setTimeout(() => {
                    // Stop oscillators
                    oscillators.forEach(osc => {
                        try {
                            osc.stop();
                            osc.disconnect();
                        } catch (e) {
                            // Oscillator might already be stopped
                        }
                    });
                    
                    // Remove from active notes
                    this.activeNotes.delete(note);
                    
                    // Remove visual feedback
                    key.classList.remove('active');
                }, (stopTime - now) * 1000);
            }
            
            // Trigger note played event for recording
            const event = new CustomEvent('notePlayed', { 
                detail: { note, timestamp: Date.now() } 
            });
            document.dispatchEvent(event);
        }
    }
    
    // Stop a specific note
    stopNote(note) {
        if (this.activeNotes.has(note)) {
            const noteData = this.activeNotes.get(note);
            const pianoSettings = this.pianoTypes[this.currentPianoType].settings;
            
            // Apply release envelope
            const stopTime = this.releaseEnvelope(noteData.envelope, pianoSettings.release);
            
            // Schedule oscillator stop
            const now = this.audioContext.currentTime;
            setTimeout(() => {
                // Stop oscillators
                noteData.oscillators.forEach(osc => {
                    try {
                        osc.stop();
                        osc.disconnect();
                    } catch (e) {
                        // Oscillator might already be stopped
                    }
                });
                
                this.activeNotes.delete(note);
            }, (stopTime - now) * 1000);
            
            // Remove visual feedback
            const key = document.querySelector(`.key[data-note="${note}"]`);
            if (key) {
                key.classList.remove('active');
                // Note: we don't remove the key-highlight class here as it should fade out naturally
            }
        }
    }
    
    // Add the highlight animation to track keyboard position
    addKeyHighlight(key) {
        // Remove any existing key highlights
        document.querySelectorAll('.key-highlight').forEach(highlightedKey => {
            if (highlightedKey !== key) {
                highlightedKey.classList.remove('key-highlight');
            }
        });
        
        // Add the highlight class to the current key
        key.classList.add('key-highlight');
        
        // Get the octave from the data-note attribute
        const note = key.getAttribute('data-note');
        if (note) {
            const octave = note.match(/\d+/)[0];
            // Highlight the corresponding octave indicator
            this.highlightOctaveIndicator(octave);
        }
        
        // Remove the highlight class after the animation completes
        setTimeout(() => {
            // Only remove if not actively playing
            if (!key.classList.contains('active')) {
                key.classList.remove('key-highlight');
            }
        }, 1500); // Match this to the CSS animation duration
    }
    
    // Highlight the octave indicator
    highlightOctaveIndicator(octave) {
        // Remove active class from all octave indicators
        document.querySelectorAll('.octave-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Add active class to the corresponding octave indicator
        const octaveIndicator = document.querySelector(`.octave-indicator[data-octave="${octave}"]`);
        if (octaveIndicator) {
            octaveIndicator.classList.add('active');
            
            // Remove the active class after 1.5 seconds
            setTimeout(() => {
                octaveIndicator.classList.remove('active');
            }, 1500);
        }
    }
    
    setupEventListeners() {
        // Volume control
        const volumeControl = document.getElementById('volumeControlPiano');
        if (volumeControl) {
            volumeControl.addEventListener('input', (event) => {
                this.setVolume(parseFloat(event.target.value));
            });
        }
        
        // Piano type selection
        const pianoTypeSelector = document.getElementById('pianoTypeSelector');
        if (pianoTypeSelector) {
            // Load saved preference if it exists
            const savedType = localStorage.getItem('preferredPianoType');
            if (savedType && this.pianoTypes[savedType]) {
                this.currentPianoType = savedType;
                pianoTypeSelector.value = savedType;
            }
            
            pianoTypeSelector.addEventListener('change', (event) => {
                this.setPianoType(event.target.value);
            });
        }
        
        // Piano keys mouse events
        document.querySelectorAll('.key').forEach(key => {
            // Mouse down
            key.addEventListener('mousedown', () => {
                // Skip if in guided play mode - let the GuidedPlay class handle it
                if (this.isInGuidedPlayMode) return;
                
                this.isDragging = true;
                const note = key.getAttribute('data-note');
                this.playNote(note);
            });
            
            // Mouse up
            key.addEventListener('mouseup', () => {
                if (this.isInGuidedPlayMode) return;
                
                const note = key.getAttribute('data-note');
                // If we're implementing proper note release:
                this.stopNote(note);
            });
            
            // Mouse over (for dragging)
            key.addEventListener('mouseover', () => {
                // Skip if in guided play mode
                if (this.isInGuidedPlayMode) return;
                
                if (this.isDragging) {
                    const note = key.getAttribute('data-note');
                    this.playNote(note);
                }
            });
        });
        
        // Stop dragging on mouse up
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // Stop dragging if mouse leaves piano
        document.querySelector('.piano').addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // Keyboard input
        document.addEventListener('keydown', (event) => {
            // Skip if key is already pressed (prevents repeat events)
            if (event.repeat) return;
            
            console.log('Piano keydown event detected:', event.key, 'isInGuidedPlayMode:', this.isInGuidedPlayMode);
            
            // Skip keyboard handlers when in guided play mode
            if (this.isInGuidedPlayMode) {
                console.log('Skipping keyboard event in guided mode');
                return;
            }
            
            // Handle octave shift keys (comma/period and </> keys)
            const key = event.key;
            if (this.octaveShiftKeys.hasOwnProperty(key)) {
                this.octaveOffset += this.octaveShiftKeys[key];
                console.log('Octave shifted to:', this.octaveOffset);
                
                // Update key mappings based on the new octave offset
                this.updateKeyMappings();
                
                // Update visual feedback for the current octave
                const currentOctaveDisplay = document.getElementById('currentOctaveDisplay');
                if (currentOctaveDisplay) {
                    currentOctaveDisplay.textContent = `Current Octave: ${this.octaveOffset >= 0 ? '+' : ''}${this.octaveOffset}`;
                    currentOctaveDisplay.style.opacity = '1';
                    
                    // Hide the display after 2 seconds
                    setTimeout(() => {
                        currentOctaveDisplay.style.opacity = '0';
                    }, 2000);
                }
                
                // Apply a highlight to all keys to indicate the octave shift
                document.querySelectorAll('.key').forEach(k => {
                    k.classList.add('octave-shifted');
                    setTimeout(() => {
                        k.classList.remove('octave-shifted');
                    }, 300);
                });
                
                return;
            }
            
            const lowerKey = event.key.toLowerCase();
            const note = this.keyToNoteMap[lowerKey];
            if (note) {
                console.log('Playing note from keyboard:', note);
                this.playNote(note);
            }
        });
        
        // Handle key up events for proper note release
        document.addEventListener('keyup', (event) => {
            if (this.isInGuidedPlayMode) return;
            
            const lowerKey = event.key.toLowerCase();
            const note = this.keyToNoteMap[lowerKey];
            if (note) {
                console.log('Stopping note from keyboard:', note);
                this.stopNote(note);
            }
        });
    }
    
    // Remap a note to a different octave
    remapOctave(note, offset) {
        const match = note.match(/^([A-G]#?)(\d)$/);
        if (match) {
            const baseNote = match[1];
            const octave = parseInt(match[2], 10) + offset;
            // Check if the resulting note is within range
            const adjustedNote = `${baseNote}${octave}`;
            if (this.noteToFreq[adjustedNote]) {
                return adjustedNote;
            } else if (octave < 1) {
                return `${baseNote}1`; // Lowest octave
            } else if (octave > 6) {
                return `${baseNote}6`; // Highest octave
            }
        }
        return note;
    }
    
    // Update all keyboard mappings based on current octave offset
    updateKeyMappings() {
        // Store the original mappings if we don't have them yet
        if (!this.originalKeyToNoteMap) {
            this.originalKeyToNoteMap = { ...this.keyToNoteMap };
        }
        
        // Reset to original mappings
        this.keyToNoteMap = { ...this.originalKeyToNoteMap };
        
        // Apply octave offset to all mappings
        if (this.octaveOffset !== 0) {
            for (const [key, note] of Object.entries(this.keyToNoteMap)) {
                this.keyToNoteMap[key] = this.remapOctave(note, this.octaveOffset);
            }
        }
        
        console.log('Updated key mappings with octave offset:', this.octaveOffset);
    }
}