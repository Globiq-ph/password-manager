class CredentialManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Save credential form submission
        document.getElementById('saveCredential')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveCredential();
        });

        // Password strength checker
        document.getElementById('password')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Search functionality
        document.getElementById('searchCredentials')?.addEventListener('input', (e) => {
            this.filterCredentials(e.target.value);
        });

        // Filter functionality
        document.getElementById('projectFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('categoryFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        // Initial load
        this.loadCredentials();
    }

    checkPasswordStrength(password) {
        const strengthBar = document.querySelector('.password-strength-bar');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (!strengthBar || !strengthText || !password) {
            return;
        }

        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 20;
        
        // Uppercase check
        if (password.match(/[A-Z]/)) strength += 20;
        
        // Lowercase check
        if (password.match(/[a-z]/)) strength += 20;
        
        // Number check
        if (password.match(/[0-9]/)) strength += 20;
        
        // Special character check
        if (password.match(/[^A-Za-z0-9]/)) strength += 20;

        strengthBar.style.width = strength + '%';
        strengthBar.style.backgroundColor = this.getStrengthColor(strength);

        let strengthLabel = 'Very Weak';
        if (strength > 80) strengthLabel = 'Very Strong';
        else if (strength > 60) strengthLabel = 'Strong';
        else if (strength > 40) strengthLabel = 'Medium';
        else if (strength > 20) strengthLabel = 'Weak';

        strengthText.textContent = `Password Strength: ${strengthLabel}`;
    }

    getStrengthColor(strength) {
        if (strength > 80) return '#4CAF50';
        if (strength > 60) return '#8BC34A';
        if (strength > 40) return '#FFC107';
        if (strength > 20) return '#FF9800';
        return '#f44336';
    }

    async saveCredential() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';

        try {
            const credential = {
                project: document.getElementById('project').value,
                category: document.getElementById('category').value,
                name: document.getElementById('name').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                status: document.getElementById('status').value,
                isAdminOnly: document.getElementById('isAdmin')?.checked || false
            };

            const response = await window.api.createCredential(credential);

            if (response) {
                this.showAlert('Credential saved successfully!', 'success');
                this.resetForm();
                await this.loadCredentials();
            }
        } catch (error) {
            console.error('Error saving credential:', error);
            this.showAlert('Failed to save credential. ' + error.message, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    resetForm() {
        const form = document.querySelector('.add-password-form');
        if (form) {
            form.reset();
            document.querySelector('.password-strength-bar').style.width = '0%';
            document.getElementById('passwordStrengthText').textContent = 'Password Strength: Not Set';
        }
    }

    showAlert(message, type) {
        const alert = document.querySelector('.alert');
        if (!alert) return;

        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'flex';

        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    async loadCredentials() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';

        try {
            const credentials = await window.api.getCredentials();
            this.updateCredentialsList(credentials);
            this.updateFilters(credentials);
        } catch (error) {
            console.error('Error loading credentials:', error);
            this.showAlert('Failed to load credentials. ' + error.message, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    updateCredentialsList(credentials) {
        const passwordList = document.getElementById('passwordList');
        if (!passwordList) return;

        passwordList.innerHTML = '';

        credentials.forEach(cred => {
            const credentialCard = document.createElement('div');
            credentialCard.className = 'credential-card';
            credentialCard.innerHTML = `
                <div class="credential-header">
                    <span class="credential-title">${this.escapeHtml(cred.project)} - ${this.escapeHtml(cred.name)}</span>
                    <div class="credential-actions">
                        <button onclick="credentialManager.deleteCredential('${cred._id}')" class="btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="credential-field">
                    <label>Category:</label>
                    <span>${this.escapeHtml(cred.category)}</span>
                </div>
                <div class="credential-field">
                    <label>Username:</label>
                    <span>${this.escapeHtml(cred.username)}</span>
                </div>
                <div class="credential-field">
                    <label>Password:</label>
                    <span>********</span>
                    <button onclick="credentialManager.togglePassword(this, '${cred._id}')" class="show-btn">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="credential-field">
                    <label>Status:</label>
                    <span>${this.escapeHtml(cred.status)}</span>
                </div>
            `;
            passwordList.appendChild(credentialCard);
        });
    }

    updateFilters(credentials) {
        const projectFilter = document.getElementById('projectFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (projectFilter && categoryFilter) {
            const projects = [...new Set(credentials.map(c => c.project))];
            const categories = [...new Set(credentials.map(c => c.category))];

            projectFilter.innerHTML = '<option value="All">All Projects</option>' +
                projects.map(p => `<option value="${this.escapeHtml(p)}">${this.escapeHtml(p)}</option>`).join('');

            categoryFilter.innerHTML = '<option value="All">All Categories</option>' +
                categories.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('');
        }
    }

    filterCredentials(searchTerm) {
        const projectFilter = document.getElementById('projectFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        const cards = document.querySelectorAll('.credential-card');
        searchTerm = searchTerm.toLowerCase();

        cards.forEach(card => {
            const project = card.querySelector('.credential-title').textContent.split(' - ')[0].toLowerCase();
            const category = card.querySelector('.credential-field span').textContent.toLowerCase();
            const name = card.querySelector('.credential-title').textContent.split(' - ')[1].toLowerCase();

            const matchesSearch = !searchTerm || 
                project.includes(searchTerm) || 
                category.includes(searchTerm) || 
                name.includes(searchTerm);

            const matchesProject = projectFilter === 'All' || project === projectFilter.toLowerCase();
            const matchesCategory = categoryFilter === 'All' || category === categoryFilter.toLowerCase();

            card.style.display = matchesSearch && matchesProject && matchesCategory ? 'block' : 'none';
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchCredentials').value;
        this.filterCredentials(searchTerm);
    }

    async deleteCredential(id) {
        if (!confirm('Are you sure you want to delete this credential?')) {
            return;
        }

        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';

        try {
            await window.api.deleteCredential(id);
            this.showAlert('Credential deleted successfully!', 'success');
            await this.loadCredentials();
        } catch (error) {
            console.error('Error deleting credential:', error);
            this.showAlert('Failed to delete credential. ' + error.message, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async togglePassword(button, id) {
        const passwordSpan = button.previousElementSibling;
        const icon = button.querySelector('i');

        if (passwordSpan.textContent === '********') {
            try {
                const credentials = await window.api.getCredentials();
                const credential = credentials.find(c => c._id === id);
                if (credential) {
                    passwordSpan.textContent = credential.password;
                    icon.className = 'fas fa-eye-slash';
                }
            } catch (error) {
                console.error('Error revealing password:', error);
                this.showAlert('Failed to reveal password. ' + error.message, 'error');
            }
        } else {
            passwordSpan.textContent = '********';
            icon.className = 'fas fa-eye';
        }
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
const credentialManager = new CredentialManager();
window.credentialManager = credentialManager;
