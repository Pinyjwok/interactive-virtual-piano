// Class for managing Modal dialogs
class ModalManager {
    constructor() {
        // Initialize modal dialogs
        this.recordingNameModal = document.getElementById('recordingNameModal');
        this.recordingRenameModal = document.getElementById('recordingRenameModal');
        this.songRenameModal = document.getElementById('songRenameModal');
        this.continueIterationModal = document.getElementById('continueIterationModal');
        
        // Modal inputs
        this.recordingNameInput = document.getElementById('recordingNameInput');
        this.recordingRenameInput = document.getElementById('recordingRenameInput');
        this.songRenameInput = document.getElementById('songRenameInput');
        
        this.setupListeners();
    }

    setupListeners() {
        // Setup modal cancel buttons - with null checks
        const cancelRecordingBtn = document.getElementById('cancelRecordingBtn');
        if (cancelRecordingBtn) {
            cancelRecordingBtn.addEventListener('click', 
                () => this.hideModal(this.recordingNameModal));
        }
        
        const cancelRecordingRenameBtn = document.getElementById('cancelRecordingRenameBtn');
        if (cancelRecordingRenameBtn) {
            cancelRecordingRenameBtn.addEventListener('click', 
                () => this.hideModal(this.recordingRenameModal));
        }
        
        const cancelSongRenameBtn = document.getElementById('cancelSongRenameBtn');
        if (cancelSongRenameBtn) {
            cancelSongRenameBtn.addEventListener('click', 
                () => this.hideModal(this.songRenameModal));
        }
        
        const cancelContinueIterationBtn = document.getElementById('cancelContinueIterationBtn');
        if (cancelContinueIterationBtn) {
            cancelContinueIterationBtn.addEventListener('click', 
                () => this.hideModal(this.continueIterationModal));
        }
    }

    showNamingModal(callback) {
        if (!this.recordingNameModal || !this.recordingNameInput) return;
        
        this.showModal(this.recordingNameModal, this.recordingNameInput);
        
        // Remove previous listener if it exists
        const saveBtn = document.getElementById('saveRecordingBtn');
        if (!saveBtn) return;
        
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Add new listener
        newSaveBtn.addEventListener('click', () => {
            const name = this.recordingNameInput.value.trim();
            if (name) {
                callback(name);
            }
            this.hideModal(this.recordingNameModal);
        });
    }

    showRecordingRenameModal(currentName, callback) {
        if (!this.recordingRenameModal || !this.recordingRenameInput) return;
        
        this.recordingRenameInput.value = currentName;
        this.showModal(this.recordingRenameModal, this.recordingRenameInput);
        
        // Remove previous listener if it exists
        const saveBtn = document.getElementById('saveRecordingRenameBtn');
        if (!saveBtn) return;
        
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Add new listener
        newSaveBtn.addEventListener('click', () => {
            const name = this.recordingRenameInput.value.trim();
            if (name) {
                callback(name);
            }
            this.hideModal(this.recordingRenameModal);
        });
    }

    showSongRenameModal(currentName, callback) {
        if (!this.songRenameModal || !this.songRenameInput) return;
        
        this.songRenameInput.value = currentName;
        this.showModal(this.songRenameModal, this.songRenameInput);
        
        // Remove previous listener if it exists
        const saveBtn = document.getElementById('saveSongRenameBtn');
        if (!saveBtn) return;
        
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Add new listener
        newSaveBtn.addEventListener('click', () => {
            const name = this.songRenameInput.value.trim();
            if (name) {
                callback(name);
            }
            this.hideModal(this.songRenameModal);
        });
    }

    showContinueIterationModal(callback) {
        if (!this.continueIterationModal) return;
        
        this.showModal(this.continueIterationModal);
        
        // Remove previous listeners if they exist
        const continueBtn = document.getElementById('continueIterationBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        
        if (!continueBtn || !backToMenuBtn) return;
        
        const newContinueBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        
        const newBackToMenuBtn = backToMenuBtn.cloneNode(true);
        backToMenuBtn.parentNode.replaceChild(newBackToMenuBtn, backToMenuBtn);
        
        // Add new listeners
        newContinueBtn.addEventListener('click', () => {
            callback(true); // User chose to continue
            this.hideModal(this.continueIterationModal);
        });
        
        newBackToMenuBtn.addEventListener('click', () => {
            callback(false); // User chose not to continue
            this.hideModal(this.continueIterationModal);
        });
    }

    showModal(modal, inputElement) {
        if (!modal) return;
        
        modal.style.display = 'block';
        if (inputElement) {
            inputElement.focus();
            inputElement.select();
        }
    }

    hideModal(modal) {
        if (!modal) return;
        
        modal.style.display = 'none';
        // Clear input if there is one
        const input = modal.querySelector('input');
        if (input) {
            input.value = '';
        }
    }
}