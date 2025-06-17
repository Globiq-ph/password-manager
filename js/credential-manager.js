// Credential management functionality
class CredentialManager {
    constructor() {
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.allCredentials = [];

        // Initialize search
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

        const html = credentials.map(cred => `
            <div class="credential-item" data-id="${cred._id}">
                <div class="credential-content">
                    <h3>${this.escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                    <div class="password-section">
                        <strong>Password:</strong> 
                        <span class="password-hidden" id="pwd-${cred._id}">********</span>
                        <button class="btn btn-show" onclick="credentialManager.togglePassword('${cred._id}', '${this.escapeHtml(cred.password)}')">
                            Show
                        </button>
                    </div>
                    <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${cred._id}')">Delete</button>
                </div>
            </div>
        `).join('');

        this.passwordList.innerHTML = html;
    }

    async togglePassword(credentialId, password) {
        const passwordSpan = document.getElementById(`pwd-${credentialId}`);
        const button = passwordSpan.nextElementSibling;

        if (!passwordSpan || !button) {
            console.error('Password elements not found');
            return;
        }

        if (passwordSpan.textContent === '********') {
            passwordSpan.textContent = password;
            button.textContent = 'Hide';
        } else {
            passwordSpan.textContent = '********';
            button.textContent = 'Show';
        }
    }

    async deleteCredential(credentialId) {
        if (!confirm('Are you sure you want to delete this credential?')) {
            return;
        }

        try {
            await api.deleteCredential(credentialId);
            await this.loadCredentials(); // Reload the full list
        } catch (error) {
            console.error('Error deleting credential:', error);
            alert('Failed to delete credential: ' + error.message);
        }
    }

    filterCredentials() {
        if (!this.searchInput) return;
        
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

// Initialize the credential manager when the page loads
window.credentialManager = new CredentialManager();
document.addEventListener('DOMContentLoaded', () => {
    window.credentialManager.loadCredentials();
});
