// Credential management functionality
class CredentialManager {
    constructor() {
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.allCredentials = [];
        
        // Setup search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }

        // Bind methods to this instance
        this.togglePassword = this.togglePassword.bind(this);
        this.deleteCredential = this.deleteCredential.bind(this);

        // Make methods globally accessible for event handlers
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

        this.passwordList.innerHTML = credentials.map(cred => `
            <div class="credential-item" data-id="${this.escapeHtml(cred._id)}">
                <div class="credential-content">
                    <h3>${this.escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                    <p class="password-field">
                        <strong>Password:</strong> 
                        <span class="password-field-content">
                            <span class="password-hidden" id="pwd-${this.escapeHtml(cred._id)}">********</span>
                            <button class="btn btn-show" onclick="credentialManager.togglePassword('${this.escapeHtml(cred._id)}', event)">
                                Show/Hide
                            </button>
                        </span>
                    </p>
                    <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${this.escapeHtml(cred._id)}', event)">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers after rendering
        this.addEventListeners();
    }

    addEventListeners() {
        // Add any additional event listeners if needed
        document.querySelectorAll('.btn-show').forEach(button => {
            button.addEventListener('click', (event) => {
                const credId = event.target.closest('.credential-item').dataset.id;
                this.togglePassword(credId, event);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (event) => {
                const credId = event.target.closest('.credential-item').dataset.id;
                this.deleteCredential(credId, event);
            });
        });
    }

    async togglePassword(credentialId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const passwordSpan = document.getElementById(`pwd-${credentialId}`);
        if (!passwordSpan) {
            console.error('Password span not found');
            return;
        }

        try {
            if (passwordSpan.classList.contains('password-hidden')) {
                // Fetch the actual password
                const credential = this.allCredentials.find(c => c._id === credentialId);
                if (credential) {
                    passwordSpan.textContent = credential.password;
                    passwordSpan.classList.remove('password-hidden');
                }
            } else {
                passwordSpan.textContent = '********';
                passwordSpan.classList.add('password-hidden');
            }
        } catch (error) {
            console.error('Error toggling password:', error);
            alert('Failed to toggle password visibility');
        }
    }

    async deleteCredential(credentialId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!confirm('Are you sure you want to delete this credential?')) {
            return;
        }

        try {
            await api.deleteCredential(credentialId);
            const element = document.querySelector(`[data-id="${credentialId}"]`);
            if (element) {
                element.remove();
            }
            // Refresh the credentials list
            await this.loadCredentials();
        } catch (error) {
            console.error('Error deleting credential:', error);
            alert('Failed to delete credential: ' + error.message);
        }
    }

    filterCredentials() {
        if (!this.searchInput || !Array.isArray(this.allCredentials)) return;

        const searchTerm = this.searchInput.value.toLowerCase();
        const filtered = this.allCredentials.filter(cred => 
            (cred.name && cred.name.toLowerCase().includes(searchTerm)) || 
            (cred.username && cred.username.toLowerCase().includes(searchTerm))
        );
        this.renderCredentials(filtered);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
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
let credentialManager = new CredentialManager();
credentialManager.loadCredentials();
