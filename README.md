# Interactive Virtual Piano

## Description
An interactive web-based piano application that allows users to play musical notes using keyboard input. This project showcases a rich, engaging user experience with a focus on modern web technologies.

**Key Highlights:**
- Immersive 3D piano transition animation for a polished feel.
- User-configurable light and dark themes for personalized viewing.
- Two-octave keyboard with configurable octave shifting.
- Accurate note frequencies using the Web Audio API.
- Visual key highlighting for immediate feedback.
- Keyboard-based note playing for intuitive interaction.
- Comprehensive guided play mode with falling notes.
- Robust song recording, playback, and management system.
- Detailed performance scoring and feedback.
- Persistent leaderboard system to track high scores.

## How to Play

### Standard Piano Mode
- **Octave 3:**
  - White Keys: `Z`, `X`, `C`, `V`, `B`, `N`, `M`
  - Black Keys: `S`, `D`, `G`, `H`, `J`
- **Octave 4:**
  - White Keys: `Q`, `W`, `E`, `R`, `T`, `Y`, `U`
  - Black Keys: `2`, `3`, `5`, `6`, `7`

Use the on-screen controls or designated keys to shift octaves.

### Guided Play Mode
In Guided Play mode, use the same key mappings listed above to play along with the falling notes. Aim to hit the notes as they align with the timing line at the bottom of the play area.

## Features

### General
- **Theme Customization**: Easily switch between light and dark modes via an accessible toggle.
- **Animated Transitions**: Smooth 3D animation when transitioning into piano sections.

### Guided Play Mode
- **Song Selection**: Choose from a predefined list of songs.
- **Difficulty Levels**: Select from Beginner, Intermediate, or Advanced, affecting note speed and timing windows.
- **Falling Notes Gameplay**: Visually intuitive gameplay where notes fall towards the corresponding keys.
- **Pre-Game Countdown**: A "Get Ready!" message and countdown prepare you before each song.
- **Dynamic Scoring**:
    - Points awarded based on timing accuracy (e.g., Perfect, Good, Ok).
    - Combo streaks for consecutive successful hits.
    - Visual feedback for each note hit or missed.
- **Performance Metrics**:
    - Live Score
    - Accuracy Percentage
    - Current and Highest Combo
    - Final Performance Grade (S, A+, A, B+, B, etc.)
- **In-Game Help**: Access an instructions modal explaining how to play.
- **Progress Bar**: Visual indicator of your progress through the current song.

### Recording and Playback
- **Record Performances**: Capture your own piano playing in Standard Piano Mode.
- **Save Recordings**: Store recordings locally in the browser.
    - Assign custom names to your recordings.
- **Manage Recordings**:
    - Rename existing recordings.
    - Delete unwanted recordings.
- **Playback**: Listen to your saved performances at any time.

### Leaderboard System
- **View Top Scores**: Browse high scores across all songs and difficulties.
- **Filter Options**: Filter the leaderboard by specific songs or difficulty levels.
- **Automatic Score Saving**: Scores from Guided Play are automatically submitted.
- **Player Name Input**: Enter your name for personalized leaderboard entries.
- **Persistent Storage**: Scores are saved using IndexedDB for long-term persistence.

## Technologies Used
- **HTML5**: For structuring the web application.
- **CSS3**: For styling, layout, and modern visual effects (variables, flexbox, grid).
- **Vanilla JavaScript (ES6+)**: For all application logic, interactivity, and DOM manipulation.
- **Web Audio API**: For accurate sound synthesis and playback.
- **IndexedDB**: For client-side storage of leaderboard data and recordings.

## Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd piano-vanilla
    ```
3.  **Open `index.html` in a modern web browser** (e.g., Chrome, Firefox, Edge, Safari).
    -   No build step or local server is strictly required for basic functionality, but running it via a local server (e.g., using VS Code's Live Server extension) is recommended for features like module loading if they were to be used.

## Future Improvements
- Additional song library with more variety.
- User-defined custom difficulty settings.
- Multiple instrument sound options.
- Sustain/pedal functionality for more expressive playing.
- Enhanced mobile responsiveness and touch controls.
- MIDI input/output support.

## License
MIT License
