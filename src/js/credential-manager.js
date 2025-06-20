class CredentialManager {
    constructor() {
        this.api = new Api();
        this.isAdmin = this.getAdminState();
        this.initializeEventListeners();
        this.loadCredentials();
        this.pendingSensitiveAction = null;
    }

    getAdminState() {
        return localStorage.getItem('isAdmin') === 'true';
    }
    setAdminState(isAdmin) {
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
        this.isAdmin = isAdmin;
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

        // Image preview and Remove QR
        const imageInput = document.getElementById('image');
        const removeQRBtn = document.getElementById('removeQRBtn');
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
                        if (removeQRBtn) removeQRBtn.style.display = 'inline-block';
                    };
                    reader.readAsDataURL(this.files[0]);
                } else {
                    if (removeQRBtn) removeQRBtn.style.display = 'none';
                }
            });
        }
        if (removeQRBtn) {
            removeQRBtn.addEventListener('click', function() {
                imageInput.value = '';
                document.getElementById('imagePreview').innerHTML = '';
                removeQRBtn.style.display = 'none';
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

        // Admin login form (View Credentials tab)
        const adminLoginBox = document.getElementById('adminLoginBox');
        const adminLogoutBox = document.getElementById('adminLogoutBox');
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('adminUsername').value.trim();
                const password = document.getElementById('adminPassword').value;
                if (username === 'admin123' && password === 'adminpassword') {
                    this.setAdminState(true);
                    this.showSuccess('Admin login successful!');
                    if (adminLoginBox) adminLoginBox.style.display = 'none';
                    if (adminLogoutBox) adminLogoutBox.style.display = 'block';
                    this.loadCredentials();
                } else {
                    this.setAdminState(false);
                    this.showError('Invalid admin credentials.');
                }
            });
        }
        if (adminLogoutBox) {
            const btn = document.getElementById('adminLogoutBtn');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.setAdminState(false);
                    this.showSuccess('Logged out as admin.');
                    if (adminLoginBox) adminLoginBox.style.display = 'block';
                    if (adminLogoutBox) adminLogoutBox.style.display = 'none';
                    this.loadCredentials();
                });
            }
        }
        // Show/hide admin login/logout UI on tab switch
        const viewTab = document.querySelector('[data-tab="viewCredentials"]');
        if (viewTab) {
            viewTab.addEventListener('click', () => {
                if (this.isAdmin) {
                    if (adminLoginBox) adminLoginBox.style.display = 'none';
                    if (adminLogoutBox) adminLogoutBox.style.display = 'block';
                } else {
                    if (adminLoginBox) adminLoginBox.style.display = 'block';
                    if (adminLogoutBox) adminLogoutBox.style.display = 'none';
                }
            });
        }
    }

    async loadCredentials() {
        try {
            const credentials = await this.api.getCredentials();
            this.displayCredentials(credentials);
        } catch (error) {
            let msg = 'Failed to load credentials';
            if (error && error.message) {
                msg += `: ${error.message}`;
            } else if (typeof error === 'string') {
                msg += `: ${error}`;
            }
            // Try to extract HTTP status if available
            if (error && error.response && error.response.status) {
                msg += ` (HTTP ${error.response.status})`;
            }
            this.showError(msg);
            // Also log to console for developer
            console.error('Error loading credentials (detailed):', error);
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
                    <div class="credential-field"><label>Username:</label> <span>${this.escapeHtml(cred.userName || cred.username)}</span></div>
                    <div class="credential-field"><label>Date Saved:</label> <span>${cred.createdAt ? this.formatDate(cred.createdAt) : ''}</span></div>
                    <div class="credential-field"><label>Password:</label> <span>
                        ${this.isAdmin
                            ? `<span id="pw-plain-${idx}" class="pw-plain">${this.escapeHtml(cred.password)}</span>`
                            : `<i class='fas fa-lock' title='Admin access required'></i> <span style='color:#888;font-size:0.95em;'>(Admin only)</span>`}
                        ${this.isAdmin
                            ? `<button class="view-pw-btn" data-idx="${idx}" aria-label="Show/Hide Password" title="Show/Hide Password"><span class="eye-icon" id="eye-icon-${idx}">&#128065;</span></button>`
                            : ''}
                    </span></div>
                    <div class="credential-actions">
                        <button class="copy-btn" data-value="${this.escapeHtml(cred.userName || cred.username)}" title="Copy Username">📋</button>
                        ${this.isAdmin
                            ? `<button class="delete-btn" data-id="${cred._id}" title="Delete">🗑️</button>`
                            : `<button class="delete-btn" disabled title="Admin access required" style="opacity:0.5;cursor:not-allowed;">🗑️</button>`}
                    </div>
                </div>
            `).join('')}
        </div>`;
        // Add event listeners for copy, view, and delete buttons
        if (this.isAdmin) {
            container.querySelectorAll('.view-pw-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = btn.dataset.idx;
                    const plain = document.getElementById(`pw-plain-${idx}`);
                    if (plain) {
                        plain.style.display = plain.style.display === 'none' ? '' : 'none';
                    }
                });
            });
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.dataset.id;
                    if (id && confirm('Are you sure you want to delete this credential?')) {
                        this.api.deleteCredential(id).then(() => {
                            this.showSuccess('Credential deleted successfully');
                            this.loadCredentials();
                        }).catch(() => {
                            this.showError('Failed to delete credential');
                        });
                    }
                });
            });
        }
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
            const removeQRBtn = document.getElementById('removeQRBtn');
            if (removeQRBtn) removeQRBtn.style.display = 'none';
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
