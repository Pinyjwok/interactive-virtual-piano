/**
 * Leaderboard Manager
 * Manages the leaderboard UI and interactions
 */

class LeaderboardManager {
    constructor() {
        this.modal = document.getElementById('leaderboardModal');
        this.tableBody = document.getElementById('leaderboardTableBody');
        this.songFilter = document.getElementById('leaderboardSongFilter');
        this.difficultyFilter = document.getElementById('leaderboardDifficultyFilter');
        
        this.bindEvents();
        this.loadSongs();
    }
    
    bindEvents() {
        // Close button
        document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
            this.hideLeaderboard();
        });
        
        // Clear button (with confirmation)
        document.getElementById('clearLeaderboardBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all leaderboard data? This cannot be undone.')) {
                this.clearLeaderboard();
            }
        });
        
        // Filter changes
        this.songFilter.addEventListener('change', () => this.refreshLeaderboard());
        this.difficultyFilter.addEventListener('change', () => this.refreshLeaderboard());
        
        // Add a button to the main guided play controls
        const controlsSection = document.querySelector('.guided-play-controls');
        if (controlsSection) {
            const leaderboardBtn = document.createElement('button');
            leaderboardBtn.id = 'showLeaderboardBtn';
            leaderboardBtn.className = 'leaderboard-button';
            leaderboardBtn.innerHTML = '<i class="fas fa-trophy"></i> Leaderboard';
            leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
            
            // Add to the playback controls
            const playbackControls = document.querySelector('.playback-controls');
            if (playbackControls) {
                playbackControls.appendChild(leaderboardBtn);
            } else {
                controlsSection.appendChild(leaderboardBtn);
            }
        }
    }
    
    loadSongs() {
        // Clear existing options (except All Songs)
        while (this.songFilter.options.length > 1) {
            this.songFilter.remove(1);
        }
        
        // Add songs from the window.PIANO_SONGS array
        if (window.PIANO_SONGS && window.PIANO_SONGS.length > 0) {
            window.PIANO_SONGS.forEach((song, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.text = song.title;
                this.songFilter.add(option);
            });
        }
    }
    
    async showLeaderboard() {
        this.modal.style.display = 'block';
        await this.refreshLeaderboard();
    }
    
    hideLeaderboard() {
        this.modal.style.display = 'none';
    }
    
    async refreshLeaderboard() {
        // Get filter values
        const songId = this.songFilter.value !== 'all' ? parseInt(this.songFilter.value) : undefined;
        const difficulty = this.difficultyFilter.value !== 'all' ? this.difficultyFilter.value : undefined;
        
        try {
            // Get scores from the database
            const scores = await window.leaderboardDB.getTopScores(songId, difficulty, 100);
            
            // Clear existing table rows
            this.tableBody.innerHTML = '';
            
            if (scores.length === 0) {
                // Show empty state
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="7" class="empty-leaderboard">No scores found. Play some songs to see your scores here!</td>`;
                this.tableBody.appendChild(emptyRow);
                return;
            }
            
            // Add scores to the table
            scores.forEach((score, index) => {
                const rank = index + 1;
                const row = document.createElement('tr');
                
                // Add special class for top 3 ranks
                if (rank <= 3) {
                    row.classList.add(`rank-${rank}`);
                }
                
                // Get song title from song ID
                let songTitle = 'Unknown Song';
                if (window.PIANO_SONGS && score.songId !== undefined) {
                    const song = window.PIANO_SONGS[score.songId];
                    if (song) {
                        songTitle = song.title;
                    }
                }
                
                // Format date
                const date = new Date(score.date);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                // Add row content
                row.innerHTML = `
                    <td>${rank}</td>
                    <td>${score.playerName || 'Anonymous'}</td>
                    <td>${score.score.toLocaleString()}</td>
                    <td>${score.accuracy}%</td>
                    <td>${songTitle}</td>
                    <td>${score.difficulty.charAt(0).toUpperCase() + score.difficulty.slice(1)}</td>
                    <td>${formattedDate}</td>
                `;
                
                this.tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
            this.tableBody.innerHTML = `<tr><td colspan="7" class="empty-leaderboard">Error loading leaderboard data: ${error.message}</td></tr>`;
        }
    }
    
    async clearLeaderboard() {
        try {
            await window.leaderboardDB.clearLeaderboard();
            this.refreshLeaderboard();
        } catch (error) {
            console.error('Error clearing leaderboard:', error);
            alert('Error clearing leaderboard: ' + error.message);
        }
    }
    
    async addScore(scoreData) {
        try {
            await window.leaderboardDB.addScore(scoreData);
            console.log('Score added to leaderboard successfully');
        } catch (error) {
            console.error('Error adding score to leaderboard:', error);
        }
    }
}

// Initialize the leaderboard manager when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
});