// Credential management functionality
class CredentialManager {
    constructor() {
        this.searchInput = document.getElementById('searchCredentials');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        this.selectedCount = document.getElementById('selectedCount');
        this.passwordList = document.getElementById('passwordList');
        
        this.selectedCredentials = new Set();
        this.allCredentials = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', () => this.filterCredentials());
        
        // Select all functionality
        this.selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        
        // Delete selected functionality
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
    }

    async loadCredentials() {
        try {
            this.allCredentials = await api.getCredentials();
            this.renderCredentials(this.allCredentials);
        } catch (error) {
            console.error('Failed to load credentials:', error);
            this.passwordList.innerHTML = '<p class="no-results">Error loading credentials</p>';
        }
    }

    renderCredentials(credentials) {
        if (credentials.length === 0) {
            this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
            return;
        }

        this.passwordList.innerHTML = credentials.map(cred => `            <div class="password-item credential-item" data-id="${cred._id}">
                <input type="checkbox" class="credential-checkbox" data-id="${cred._id}">
                <div class="credential-content">
                    <h3>${this.highlightSearch(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.highlightSearch(cred.username)}</p>
                    <p>
                        <strong>Password:</strong> 
                        <span class="password-hidden" id="pwd-${cred._id}">********</span>
                    </p>
                    <div class="password-actions">
                        <button class="btn btn-show" onclick="credentialManager.togglePassword('${cred._id}', '${cred.password}')">
                            <i class="fas fa-eye"></i> Show
                        </button>
                        <button class="btn btn-delete" onclick="credentialManager.deleteCredential('${cred._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Setup checkbox listeners
        this.setupCheckboxListeners();
    }

    highlightSearch(text) {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    filterCredentials() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        const filtered = this.allCredentials.filter(cred => 
            cred.website.toLowerCase().includes(searchTerm) ||
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

    async deleteCredential(id) {
        if (!confirm('Are you sure you want to delete this credential?')) {
            return;
        }

        try {
            await api.deleteCredential(id);
            this.selectedCredentials.delete(id);
            await this.loadCredentials();
            this.updateUI();
        } catch (error) {
            alert('Failed to delete credential');
            console.error('Delete error:', error);
        }
    }

    togglePassword(id, password) {
        const pwdSpan = document.getElementById(`pwd-${id}`);
        const btn = pwdSpan.parentElement.nextElementSibling.querySelector('.btn-show');
        
        if (pwdSpan.textContent === '********') {
            pwdSpan.textContent = password;
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        } else {
            pwdSpan.textContent = '********';
            btn.innerHTML = '<i class="fas fa-eye"></i> Show';
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
}

// Initialize the credential manager
let credentialManager;
