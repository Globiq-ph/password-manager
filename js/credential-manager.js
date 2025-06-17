// Credential management functionality
class CredentialManager {
    constructor() {
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.allCredentials = [];
        
        // Bind methods to this instance
        this.togglePassword = this.togglePassword.bind(this);
        this.deleteCredential = this.deleteCredential.bind(this);
        this.filterCredentials = this.filterCredentials.bind(this);
        
        // Setup search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.filterCredentials);
        }

        // Make instance globally available
        window.credentialManager = this;
    }

    async loadCredentials() {
        if (!this.passwordList) return;

        try {
            this.passwordList.innerHTML = '<p class="loading">Loading credentials...</p>';
            
            const credentials = await api.getCredentials();
            this.allCredentials = Array.isArray(credentials) ? credentials : [];
            
            this.renderCredentials(this.allCredentials);
        } catch (error) {
            console.error('Failed to load credentials:', error);
            this.passwordList.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
        }
    }

    renderCredentials(credentials) {
        if (!this.passwordList) return;

        if (!credentials || credentials.length === 0) {
            this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
            return;
        }

        const html = credentials.map(cred => {
            const id = this.escapeHtml(cred._id);
            const name = this.escapeHtml(cred.name);
            const username = this.escapeHtml(cred.username);
            const password = cred.password || '';

            return `
                <div class="credential-item" data-id="${id}">
                    <div class="credential-content">
                        <h3>${name}</h3>
                        <p><strong>Username:</strong> ${username}</p>
                        <div class="password-container">
                            <strong>Password:</strong> 
                            <span class="password-field">
                                <span class="password-text" id="pwd-${id}">********</span>
                                <button class="btn btn-show" data-id="${id}" data-password="${this.escapeHtml(password)}">
                                    Show
                                </button>
                            </span>
                        </div>
                        <button class="btn btn-delete" data-id="${id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        this.passwordList.innerHTML = html;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add show/hide password button listeners
        this.passwordList.querySelectorAll('.btn-show').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const password = e.target.dataset.password;
                const passwordText = document.getElementById(`pwd-${id}`);
                const isHidden = passwordText.textContent === '********';
                
                passwordText.textContent = isHidden ? password : '********';
                e.target.textContent = isHidden ? 'Hide' : 'Show';
            });
        });

        // Add delete button listeners
        this.passwordList.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this credential?')) {
                    try {
                        await api.deleteCredential(id);
                        const item = e.target.closest('.credential-item');
                        if (item) {
                            item.remove();
                        }
                        // Reload credentials to ensure sync
                        await this.loadCredentials();
                    } catch (error) {
                        console.error('Error deleting credential:', error);
                        alert('Failed to delete credential: ' + error.message);
                    }
                }
            });
        });
    }

    filterCredentials() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const filtered = this.allCredentials.filter(cred => 
            cred.name.toLowerCase().includes(searchTerm) || 
            cred.username.toLowerCase().includes(searchTerm)
        );
        this.renderCredentials(filtered);
    }

    escapeHtml(unsafe) {
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the credential manager
document.addEventListener('DOMContentLoaded', () => {
    const credManager = new CredentialManager();
    credManager.loadCredentials();
});
