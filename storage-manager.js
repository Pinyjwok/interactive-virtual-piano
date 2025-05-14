// Class for managing Storage operations (localStorage and IndexedDB)
class StorageManager {
    static DB_NAME = 'PianoRecordingsDB';
    static DB_VERSION = 1;
    static RECORDINGS_STORE = 'recordings';
    static SONGS_STORE = 'songs';
    static SIZE_THRESHOLD = 100 * 1024; // 100KB threshold to use IndexedDB vs localStorage
    static db = null;
    
    // Initialize the database
    static async initDB() {
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported in this browser. Using localStorage only.');
            return false;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
                resolve(false);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB initialized successfully');
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(this.RECORDINGS_STORE)) {
                    db.createObjectStore(this.RECORDINGS_STORE, { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains(this.SONGS_STORE)) {
                    db.createObjectStore(this.SONGS_STORE, { keyPath: 'id' });
                }
            };
        });
    }
    
    // Determine if data should be stored in IndexedDB based on size
    static shouldUseIndexedDB(data) {
        try {
            const size = new Blob([JSON.stringify(data)]).size;
            return size > this.SIZE_THRESHOLD && this.db !== null;
        } catch (e) {
            return false;
        }
    }

    // Save to localStorage (original method)
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`Error saving to localStorage for key ${key}:`, e);
            return false;
        }
    }
    
    // Load from localStorage (original method)
    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error loading from localStorage for key ${key}:`, e);
            return defaultValue;
        }
    }
    
    // Save to IndexedDB
    static saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // If data is an array, save each item separately
            if (Array.isArray(data)) {
                data.forEach(item => {
                    // Ensure each item has an id
                    if (!item.id) {
                        item.id = Date.now() + Math.random().toString(36).substring(2, 10);
                    }
                    store.put(item);
                });
            } else {
                // Ensure single item has an id
                if (!data.id) {
                    data.id = Date.now() + Math.random().toString(36).substring(2, 10);
                }
                store.put(data);
            }
            
            transaction.oncomplete = () => {
                resolve(true);
            };
            
            transaction.onerror = (event) => {
                console.error(`Error saving to IndexedDB for store ${storeName}:`, event.target.error);
                resolve(false);
            };
        });
    }
    
    // Load from IndexedDB
    static loadFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error loading from IndexedDB for store ${storeName}:`, event.target.error);
                resolve(null);
            };
        });
    }
    
    // Enhanced save method that decides whether to use localStorage or IndexedDB
    static async saveToStorage(key, data) {
        // Initialize IndexedDB if not already initialized
        if (this.db === null) {
            await this.initDB();
        }
        
        // Determine if we should use IndexedDB
        if (this.shouldUseIndexedDB(data)) {
            // Map localStorage keys to IndexedDB store names
            let storeName;
            if (key === 'pianoRecordings') {
                storeName = this.RECORDINGS_STORE;
            } else if (key === 'pianoSongs') {
                storeName = this.SONGS_STORE;
            } else {
                // For unknown types, use localStorage
                return this.saveToLocalStorage(key, data);
            }
            
            // Save to IndexedDB
            const success = await this.saveToIndexedDB(storeName, data);
            
            // If IndexedDB failed, fall back to localStorage
            if (!success) {
                return this.saveToLocalStorage(key, data);
            }
            
            // If IndexedDB succeeded, store a flag in localStorage to indicate data is in IndexedDB
            this.saveToLocalStorage(`${key}_inDB`, true);
            return true;
        } else {
            // For small data, use localStorage
            return this.saveToLocalStorage(key, data);
        }
    }
    
    // Enhanced load method that checks both localStorage and IndexedDB
    static async loadFromStorage(key, defaultValue = null) {
        // Initialize IndexedDB if not already initialized
        if (this.db === null) {
            await this.initDB();
        }
        
        // Check if data is stored in IndexedDB
        const inDB = this.loadFromLocalStorage(`${key}_inDB`, false);
        
        if (inDB && this.db) {
            // Map localStorage keys to IndexedDB store names
            let storeName;
            if (key === 'pianoRecordings') {
                storeName = this.RECORDINGS_STORE;
            } else if (key === 'pianoSongs') {
                storeName = this.SONGS_STORE;
            } else {
                // For unknown types, use localStorage
                return this.loadFromLocalStorage(key, defaultValue);
            }
            
            // Load from IndexedDB
            const data = await this.loadFromIndexedDB(storeName);
            
            // If we got data from IndexedDB, return it
            if (data && data.length > 0) {
                return data;
            }
        }
        
        // Fall back to localStorage
        return this.loadFromLocalStorage(key, defaultValue);
    }

    // Specifically for songs
    static async saveSongs(songs) {
        return await this.saveToStorage('pianoSongs', songs);
    }

    static async loadSongs(defaultSongs) {
        return await this.loadFromStorage('pianoSongs', defaultSongs);
    }

    // Specifically for recordings
    static async saveRecordings(recordings) {
        return await this.saveToStorage('pianoRecordings', recordings);
    }

    static async loadRecordings() {
        return await this.loadFromStorage('pianoRecordings', []);
    }
}

// Initialize the database when the script loads
StorageManager.initDB();