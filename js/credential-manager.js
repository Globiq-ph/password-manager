// Global credential manager object
window.credentialManager = {    async initialize() {
        console.log('Initializing credential manager');
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        await this.loadCredentials();
        
        // Setup search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
    },

    async loadCredentials() {
        if (!this.passwordList) {
            console.error('Password list element not found');
            return;
        }

        try {
            console.log('Loading credentials...');
            this.passwordList.innerHTML = '<p class="loading">Loading credentials...</p>';
            const credentials = await api.getCredentials();
            console.log(`Loaded ${credentials.length} credentials`);
            
            if (!credentials || credentials.length === 0) {
                this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
                return;
            }

            // Create HTML for each credential
            const html = credentials.map(cred => `
                <div class="credential-item" data-id="${cred._id}">
                    <h3>${this.escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                    <div class="password-section">
                        <strong>Password:</strong> 
                        <span class="password-value" data-id="${cred._id}">********</span>
                        <button class="toggle-password btn" data-id="${cred._id}" data-password="${this.escapeHtml(cred.password)}">
                            Show
                        </button>
                        <button class="delete-credential btn" data-id="${cred._id}">Delete</button>
                    </div>
                </div>
            `).join('');

            this.passwordList.innerHTML = html;
            this.addEventListeners();

        } catch (error) {
            console.error('Error loading credentials:', error);
            this.passwordList.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
        }
    },

    addEventListeners() {
        console.log('Adding event listeners');
        
        // Toggle password buttons
        this.passwordList.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Toggle password clicked');
                const id = e.target.dataset.id;
                const password = e.target.dataset.password;
                const passwordSpan = this.passwordList.querySelector(`.password-value[data-id="${id}"]`);
                
                if (passwordSpan.textContent === '********') {
                    passwordSpan.textContent = password;
                    e.target.textContent = 'Hide';
                } else {
                    passwordSpan.textContent = '********';
                    e.target.textContent = 'Show';
                }
            });
        });

        // Delete buttons
        this.passwordList.querySelectorAll('.delete-credential').forEach(button => {
            button.addEventListener('click', async (e) => {
                console.log('Delete button clicked');
                const id = e.target.dataset.id;
                const item = e.target.closest('.credential-item');
                
                if (!id || !item) {
                    console.error('Missing credential ID or item element');
                    return;
                }

                if (confirm('Are you sure you want to delete this credential?')) {
                    try {
                        console.log('Deleting credential:', id);
                        await api.deleteCredential(id);
                        console.log('Credential deleted successfully');
                        // Reload all credentials to ensure sync
                        await this.loadCredentials();
                    } catch (error) {
                        console.error('Error deleting credential:', error);
                        alert('Failed to delete credential: ' + error.message);
                    }
                }
            });
        });
    },

    filterCredentials() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const items = this.passwordList.querySelectorAll('.credential-item');
        
        items.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const username = item.querySelector('p').textContent.toLowerCase();
            if (name.includes(searchTerm) || username.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing credential manager');
    credentialManager.init();
});
