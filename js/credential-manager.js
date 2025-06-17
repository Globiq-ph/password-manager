// Credential management functionality
class CredentialManager {    constructor() {
        this.searchInput = document.getElementById('searchCredentials');
        this.passwordList = document.getElementById('passwordList');
        this.allCredentials = [];
        this.selectedCredentials = new Set();
        this.setupEventListeners();
    }    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', () => this.filterCredentials());
    }    async loadCredentials() {
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
    }renderCredentials(credentials) {
        console.log('Rendering credentials:', credentials);
        
        if (!Array.isArray(credentials) || credentials.length === 0) {
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
                        <span class="password-hidden" id="pwd-${id}">********</span>
                    </p>
                    <div class="password-actions">
                        <button class="btn btn-show" onclick="credentialManager.togglePassword('${id}', '${this.escapeHtml(cred.password)}')">
                            <i class="fas fa-eye"></i> Show
                        </button>
                        <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Setup checkbox listeners
        this.setupCheckboxListeners();
    }

    highlightSearch(text) {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }    filterCredentials() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        const filtered = this.allCredentials.filter(cred => 
            cred.name.toLowerCase().includes(searchTerm) ||
            cred.username.toLowerCase().includes(searchTerm)
        );
        this.renderCredentials(filtered);
    }

    setupCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.credential-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    this.selectedCredentials.add(id);
                } else {
                    this.selectedCredentials.delete(id);
                }
                this.updateUI();
            });
        });
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.credential-checkbox');
        const allSelected = this.selectedCredentials.size === checkboxes.length;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
            const id = checkbox.dataset.id;
            if (!allSelected) {
                this.selectedCredentials.add(id);
            } else {
                this.selectedCredentials.delete(id);
            }
        });
        
        this.updateUI();
    }

    async deleteSelected() {
        if (!confirm(`Are you sure you want to delete ${this.selectedCredentials.size} credentials?`)) {
            return;
        }

        try {
            const promises = Array.from(this.selectedCredentials).map(id => 
                api.deleteCredential(id)
            );
            await Promise.all(promises);
            this.selectedCredentials.clear();
            await this.loadCredentials();
            this.updateUI();
        } catch (error) {
            alert('Failed to delete some credentials');
            console.error('Delete error:', error);
        }
    }

    async togglePassword(credentialId) {
        const passwordSpan = document.getElementById(`pwd-${credentialId}`);
        const credential = this.allCredentials.find(c => c._id === credentialId);
        
        if (!credential) return;

        if (passwordSpan.textContent === '********') {
            passwordSpan.textContent = credential.password;
        } else {
            passwordSpan.textContent = '********';
        }
    }

    async deleteCredential(credentialId) {
        if (!confirm('Are you sure you want to delete this credential?')) {
            return;
        }

        try {
            await api.deleteCredential(credentialId);
            await this.loadCredentials(); // Reload the list
        } catch (error) {
            console.error('Error deleting credential:', error);
            alert('Failed to delete credential');
        }
    }

    updateUI() {
        this.deleteSelectedBtn.disabled = this.selectedCredentials.size === 0;
        this.selectedCount.textContent = `(${this.selectedCredentials.size})`;
        this.selectAllBtn.innerHTML = this.isAllSelected() 
            ? '<i class="fas fa-square"></i> Deselect All'
            : '<i class="fas fa-check-square"></i> Select All';
    }

    isAllSelected() {
        const checkboxes = document.querySelectorAll('.credential-checkbox');
        return this.selectedCredentials.size === checkboxes.length && checkboxes.length > 0;
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
