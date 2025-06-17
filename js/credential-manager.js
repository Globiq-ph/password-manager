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
                    <p>
                        <strong>Password:</strong> 
                        <span class="password-hidden" id="pwd-${this.escapeHtml(cred._id)}">********</span>
                        <button class="btn btn-show" onclick="credentialManager.togglePassword('${this.escapeHtml(cred._id)}')">
                            Show/Hide
                        </button>
                    </p>
                </div>
                <div class="credential-actions">
                    <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${this.escapeHtml(cred._id)}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    togglePassword(id) {
        const pwdElement = document.getElementById(`pwd-${id}`);
        if (!pwdElement) return;

        const credential = this.allCredentials.find(c => c._id === id);
        if (!credential) return;

        if (pwdElement.textContent === '********') {
            pwdElement.textContent = credential.password;
            pwdElement.classList.remove('password-hidden');
            pwdElement.classList.add('password-visible');
        } else {
            pwdElement.textContent = '********';
            pwdElement.classList.remove('password-visible');
            pwdElement.classList.add('password-hidden');
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

    async deleteCredential(id) {
        if (!id) return;

        if (confirm('Are you sure you want to delete this credential?')) {
            try {
                await api.deleteCredential(id);
                await this.loadCredentials(); // Refresh the list
                showAlert('Credential deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting credential:', error);
                showAlert('Failed to delete credential: ' + error.message, 'error');
            }
        }
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
