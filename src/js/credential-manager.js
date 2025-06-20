class CredentialManager {
    constructor() {
        this.api = new Api();
        this.isAdmin = this.getAdminState();
        this.initializeEventListeners();
        this.toggleAdminUI();
        this.pendingSensitiveAction = null;
    }

    getAdminState() {
        // Use localStorage for persistence
        return localStorage.getItem('isAdmin') === 'true';
    }
    setAdminState(isAdmin) {
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
        this.isAdmin = isAdmin;
    }

    toggleAdminUI() {
        const loginBox = document.getElementById('adminLoginBox');
        const passwordList = document.getElementById('passwordList');
        const logoutBox = document.getElementById('adminLogoutBox');
        if (this.isAdmin) {
            if (loginBox) loginBox.style.display = 'none';
            if (logoutBox) logoutBox.style.display = '';
        } else {
            if (loginBox) loginBox.style.display = '';
            if (logoutBox) logoutBox.style.display = 'none';
        }
        this.loadCredentials();
    }

    initializeEventListeners() {
        // Save credential form submission
        const form = document.getElementById('credentialForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveCredential();
            });
        }

        // Image preview
        const imageInput = document.getElementById('image');
        if (imageInput) {
            imageInput.addEventListener('change', function() {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = '';
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.maxWidth = '120px';
                        img.style.maxHeight = '120px';
                        img.style.borderRadius = '8px';
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }

        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchCredentials');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCredentials(e.target.value);
            });
        }

        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('adminUsername').value.trim();
                const password = document.getElementById('adminPassword').value;
                if (username === 'admin123' && password === 'adminpassword') {
                    this.setAdminState(true);
                    this.toggleAdminUI();
                    this.showSuccess('Admin login successful!');
                    // Hide modal
                    const overlay = document.getElementById('adminLoginOverlay');
                    if (overlay) overlay.style.display = 'none';
                    // If there was a pending sensitive action, perform it now
                    if (this.pendingSensitiveAction) {
                        if (this.pendingSensitiveAction.action === 'view') {
                            // Reveal all passwords
                            document.querySelectorAll('.pw-mask').forEach(el => el.style.display = 'none');
                            document.querySelectorAll('.pw-plain').forEach(el => el.style.display = '');
                        } else if (this.pendingSensitiveAction.action === 'delete') {
                            const id = this.pendingSensitiveAction.id;
                            this.api.deleteCredential(id).then(() => {
                                this.showSuccess('Credential deleted successfully');
                                this.loadCredentials();
                            }).catch(() => {
                                this.showError('Failed to delete credential');
                            });
                        }
                        this.pendingSensitiveAction = null;
                    }
                } else {
                    this.setAdminState(false);
                    this.toggleAdminUI();
                    this.showError('Invalid admin credentials.');
                }
            });
        }
        // Admin logout button
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', async () => {
                this.setAdminState(false);
                this.toggleAdminUI();
                this.showSuccess('Logged out as admin.');
            });
        }
    }

    async loadCredentials() {
        try {
            const credentials = await this.api.getCredentials();
            this.displayCredentials(credentials);
        } catch (error) {
            console.error('Error loading credentials:', error);
            this.showError('Failed to load credentials');
        }
    }

    displayCredentials(credentials) {
        const container = document.getElementById('passwordList');
        if (!container) return;
        if (!credentials || credentials.length === 0) {
            container.innerHTML = '<p class="no-credentials">No credentials found</p>';
            return;
        }
        container.innerHTML = `<div class="credentials-grid">
            ${credentials.map((cred, idx) => `
                <div class="credential-card">
                    <div class="credential-header">
                        <span class="credential-title">${this.escapeHtml(cred.name)}</span>
                        <span class="credential-date" title="Saved on ${cred.createdAt ? new Date(cred.createdAt).toLocaleString() : ''}">
                            <i class="fas fa-calendar-alt"></i> ${cred.createdAt ? this.formatDate(cred.createdAt) : ''}
                        </span>
                    </div>
                    <div class="credential-field"><label>Project:</label> <span>${this.escapeHtml(cred.project)}</span></div>
                    <div class="credential-field"><label>Category:</label> <span>${this.escapeHtml(cred.category)}</span></div>
                    <div class="credential-field"><label>Username:</label> <span>${this.escapeHtml(cred.userName || cred.username)}</span></div>
                    <div class="credential-field"><label>Password:</label> <span>
                        <span id="pw-mask-${idx}" class="pw-mask" style="${this.isAdmin ? 'display:none;' : ''}">${this.isAdmin ? '' : '<i class=\'fas fa-lock\' title=\'Hidden\'></i>'}</span>
                        <span id="pw-plain-${idx}" class="pw-plain" style="${this.isAdmin ? '' : 'display:none;'}">${this.escapeHtml(cred.password)}</span>
                        <button class="view-pw-btn" data-idx="${idx}" aria-label="Show/Hide Password" title="Show/Hide Password">
                            <span class="eye-icon" id="eye-icon-${idx}">&#128065;</span>
                        </button>
                    </span></div>
                    <div class="credential-field"><label>Notes:</label> <span>${this.escapeHtml(cred.notes || '')}</span></div>
                    <div class="credential-field">
                        ${cred.image ? `<img src="${cred.image}" alt="Credential Image" class="credential-img" style="max-width:48px;max-height:48px;border-radius:6px;box-shadow:0 1px 4px #0002;" />` : ''}
                    </div>
                    <div class="credential-actions">
                        <button class="copy-btn" data-value="${this.escapeHtml(cred.userName || cred.username)}" title="Copy Username">📋</button>
                        <button class="copy-btn" data-value="${this.escapeHtml(cred.password)}" title="Copy Password">🔑</button>
                        ${this.isAdmin ? `<button class="delete-btn" data-id="${cred._id}" title="Delete">🗑️</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>`;
        // Add event listeners for copy, view, and delete buttons
        container.querySelectorAll('.view-pw-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = btn.dataset.idx;
                if (!this.isAdmin) {
                    this.showAdminLoginModal('view');
                    return;
                }
                const mask = document.getElementById(`pw-mask-${idx}`);
                const plain = document.getElementById(`pw-plain-${idx}`);
                if (mask && plain) {
                    if (mask.style.display === 'none') {
                        mask.style.display = '';
                        plain.style.display = 'none';
                    } else {
                        mask.style.display = 'none';
                        plain.style.display = '';
                    }
                }
            });
        });
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isAdmin) {
                    this.showAdminLoginModal('delete', btn.dataset.id);
                    return;
                }
                const id = btn.dataset.id;
                if (confirm('Are you sure you want to delete this credential?')) {
                    this.api.deleteCredential(id).then(() => {
                        this.showSuccess('Credential deleted successfully');
                        this.loadCredentials();
                    }).catch(() => {
                        this.showError('Failed to delete credential');
                    });
                }
            });
        });
        container.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.copyToClipboard(btn.dataset.value);
            });
        });
    }

    showAdminLoginModal(action, id) {
        // Show the admin login modal and store the pending action
        const overlay = document.getElementById('adminLoginOverlay');
        if (overlay) overlay.style.display = 'flex';
        this.pendingSensitiveAction = { action, id };
    }

    async saveCredential() {
        try {
            const formData = {
                project: document.getElementById('project').value,
                category: document.getElementById('category').value,
                name: document.getElementById('name').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                notes: document.getElementById('notes').value || '',
                createdAt: new Date().toISOString() // Store timestamp
            };
            // Handle image
            const imageInput = document.getElementById('image');
            if (imageInput && imageInput.files && imageInput.files[0]) {
                const file = imageInput.files[0];
                formData.image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            // Validate required fields
            if (!formData.project || !formData.category || !formData.name || !formData.username || !formData.password) {
                this.showError('Please fill in all required fields');
                return;
            }
            await this.api.saveCredential(formData);
            document.getElementById('credentialForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            await this.loadCredentials();
            this.showSuccess('Credential saved successfully');
        } catch (error) {
            console.error('Error saving credential:', error);
            this.showError(error.message || 'Failed to save credential');
        }
    }

    async deleteCredential(id) {
        try {
            await window.api.deleteCredential(id);
            await this.loadCredentials();
            this.showSuccess('Credential deleted successfully');
        } catch (error) {
            console.error('Error deleting credential:', error);
            this.showError('Failed to delete credential');
        }
    }

    // Helper methods
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        this.showAlert(alert);
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        this.showAlert(alert);
    }

    showAlert(alertElement) {
        let container = document.querySelector('.alert-container');
        if (!container) {
            container = document.body;
        }
        // Remove any existing alerts first
        const existing = container.querySelectorAll('.alert');
        existing.forEach(el => el.remove());
        alertElement.style.pointerEvents = 'auto';
        container.appendChild(alertElement);
        setTimeout(() => {
            alertElement.remove();
        }, 3000);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard');
        } catch (error) {
            this.showError('Failed to copy to clipboard');
        }
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) {
            strength += 1;
        } else {
            feedback.push('at least 8 characters');
        }

        // Contains number
        if (/\d/.test(password)) {
            strength += 1;
        } else {
            feedback.push('a number');
        }

        // Contains lowercase
        if (/[a-z]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('a lowercase letter');
        }

        // Contains uppercase
        if (/[A-Z]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('an uppercase letter');
        }

        // Contains special char
        if (/[^A-Za-z0-9]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('a special character');
        }

        const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
        const strengthClass = ['very-weak', 'weak', 'fair', 'good', 'strong'][strength];

        strengthIndicator.textContent = strengthText;
        strengthIndicator.className = `password-strength-indicator ${strengthClass}`;
        
        if (feedback.length > 0) {
            strengthIndicator.title = `Add ${feedback.join(', ')}`;
        }
    }    filterCredentials(search) {
        const credentials = document.querySelectorAll('.credential-card');
        const searchLower = search.toLowerCase();

        credentials.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(searchLower) ? '' : 'none';
        });
    }

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    showAdminLoginModal(action, id) {
        // Show the admin login modal and store the pending action
        const overlay = document.getElementById('adminLoginOverlay');
        if (overlay) overlay.style.display = 'flex';
        this.pendingSensitiveAction = { action, id };
    }
}

// Initialize the credential manager
document.addEventListener('DOMContentLoaded', () => {
    window.credentialManager = new CredentialManager();
});
