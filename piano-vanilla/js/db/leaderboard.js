/**
 * Leaderboard Database Module
 * Handles storing and retrieving leaderboard entries using IndexedDB
 */

class LeaderboardDB {
    constructor() {
        this.dbName = 'PianoLeaderboardDB';
        this.dbVersion = 1;
        this.storeName = 'leaderboard';
        this.db = null;
        this.initializeDB();
    }

    async initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create the leaderboard object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    
                    // Create indexes for easy querying
                    store.createIndex('songId', 'songId', { unique: false });
                    store.createIndex('difficulty', 'difficulty', { unique: false });
                    store.createIndex('score', 'score', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    
                    console.log('Leaderboard database created successfully');
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Leaderboard database initialized successfully');
                resolve(this.db);
            };
            
            request.onerror = (event) => {
                console.error('Error initializing leaderboard database:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async addScore(entry) {
        // Make sure the database is initialized
        if (!this.db) {
            await this.initializeDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Add timestamp to the entry
            entry.date = new Date().toISOString();
            
            const request = store.add(entry);
            
            request.onsuccess = (event) => {
                console.log('Score added to leaderboard:', event.target.result);
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error('Error adding score to leaderboard:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getTopScores(songId, difficulty, limit = 10) {
        // Make sure the database is initialized
        if (!this.db) {
            await this.initializeDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            // Create a range for the song ID and difficulty
            let range = null;
            let index = null;
            
            if (songId !== undefined && difficulty !== undefined) {
                // We'll need to use a cursor for compound filtering
                index = store.index('songId');
                range = IDBKeyRange.only(songId);
            } else if (songId !== undefined) {
                index = store.index('songId');
                range = IDBKeyRange.only(songId);
            } else if (difficulty !== undefined) {
                index = store.index('difficulty');
                range = IDBKeyRange.only(difficulty);
            } else {
                index = store.index('score');
            }
            
            const scores = [];
            
            const request = index.openCursor(range, 'prev'); // 'prev' for descending order by score
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    // If we have a compound filter, check the other condition
                    if (songId !== undefined && difficulty !== undefined) {
                        if (cursor.value.difficulty === difficulty) {
                            scores.push(cursor.value);
                        }
                    } else {
                        scores.push(cursor.value);
                    }
                    
                    if (scores.length < limit) {
                        cursor.continue();
                    } else {
                        resolve(scores);
                    }
                } else {
                    // Sort by score in descending order
                    scores.sort((a, b) => b.score - a.score);
                    resolve(scores);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error retrieving scores from leaderboard:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async clearLeaderboard() {
        // Make sure the database is initialized
        if (!this.db) {
            await this.initializeDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('Leaderboard cleared successfully');
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error clearing leaderboard:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}

// Create and export a singleton instance
window.leaderboardDB = new LeaderboardDB();