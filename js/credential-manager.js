// Credential management functionality
class CredentialManager {
    constructor() {
        this.searchInput = document.getElementById('searchCredentials');
        this.passwordList = document.getElementById('passwordList');
        this.allCredentials = [];
        this.selectedCredentials = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
    }

    async loadCredentials() {
        try {
            console.log('Starting to load credentials...');
            this.passwordList.innerHTML = '<p class="loading">Loading credentials...</p>';
            
            this.allCredentials = await api.getCredentials();
            console.log('Loaded credentials:', this.allCredentials);
            
            if (!this.allCredentials || !Array.isArray(this.allCredentials)) {
                console.error('Invalid credentials data received:', this.allCredentials);
                this.passwordList.innerHTML = '<p class="error">Error: Invalid data received from server</p>';
                return;
            }
            
            this.renderCredentials(this.allCredentials);
        } catch (error) {
            console.error('Failed to load credentials:', error);
            this.passwordList.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
        }
    }

    renderCredentials(credentials) {
        console.log('Rendering credentials:', credentials);
        
        if (!Array.isArray(credentials)) {
            console.error('Invalid credentials format:', credentials);
            this.passwordList.innerHTML = '<p class="error">Error: Invalid credentials format</p>';
            return;
        }

        if (credentials.length === 0) {
            this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
            return;
        }

        this.passwordList.innerHTML = credentials.map(cred => {
            const id = cred._id || cred.id;
            return `
            <div class="password-item credential-item" data-id="${id}">
                <div class="credential-content">
                    <h3>${this.escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                    <p>
                        <strong>Password:</strong> 
                        <span class="password-field">
                            <span class="password-hidden" id="pwd-${id}">********</span>
                            <button class="btn btn-show" onclick="credentialManager.togglePassword('${id}', '${this.escapeHtml(cred.password)}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </span>
                    </p>
                </div>
                <div class="credential-actions">
                    <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    togglePassword(id, password) {
        const pwdElement = document.getElementById(`pwd-${id}`);
        if (pwdElement) {
            if (pwdElement.textContent === '********') {
                pwdElement.textContent = password;
                pwdElement.classList.remove('password-hidden');
                pwdElement.classList.add('password-visible');
            } else {
                pwdElement.textContent = '********';
                pwdElement.classList.remove('password-visible');
                pwdElement.classList.add('password-hidden');
            }
        }
    }

    async deleteCredential(id) {
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
