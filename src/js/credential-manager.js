class CredentialManager {
    constructor() {
        this.api = new Api();
        this.initializeEventListeners();
        this.loadCredentials();
        this.categories = new Set();
        this.projects = new Set();
        this.setupAdminFeatures();
    }

    async setupAdminFeatures() {
        try {
            const isAdmin = await this.api.isAdmin();
            const adminTab = document.getElementById('adminTab');
            if (adminTab) {
                adminTab.style.display = isAdmin ? 'block' : 'none';
            }
            if (isAdmin) {
                this.loadAdminDashboard();
            }
        } catch (error) {
            console.error('Error setting up admin features:', error);
        }
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

        const table = document.createElement('table');
        table.className = 'credentials-table modern-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Image</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${credentials.map((cred, idx) => `
                    <tr>
                        <td>${this.escapeHtml(cred.project)}</td>
                        <td>${this.escapeHtml(cred.category)}</td>
                        <td>${this.escapeHtml(cred.name)}</td>
                        <td>${this.escapeHtml(cred.username)}</td>
                        <td class="pw-cell">
                            <span id="pw-mask-${idx}" class="pw-mask">********</span>
                            <span id="pw-plain-${idx}" class="pw-plain" style="display:none;">${this.escapeHtml(cred.password)}</span>
                            <button class="view-pw-btn" data-idx="${idx}" aria-label="Show/Hide Password" title="Show/Hide Password">
                                <span class="eye-icon" id="eye-icon-${idx}">&#128065;</span>
                            </button>
                        </td>
                        <td>
                            ${cred.image ? `<img src="${cred.image}" alt="Credential Image" class="credential-img" style="max-width:48px;max-height:48px;border-radius:6px;box-shadow:0 1px 4px #0002;" />` : ''}
                        </td>
                        <td>
                            <button class="copy-btn" data-value="${this.escapeHtml(cred.username)}" title="Copy Username">📋</button>
                            <button class="copy-btn" data-value="${this.escapeHtml(cred.password)}" title="Copy Password">🔑</button>
                            <button class="delete-btn" data-id="${cred._id}" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        // Add event listeners for copy, view, and delete buttons
        table.addEventListener('click', async (e) => {
            if (e.target.classList.contains('copy-btn')) {
                await this.copyToClipboard(e.target.dataset.value);
            } else if (e.target.classList.contains('delete-btn')) {
                await this.deleteCredential(e.target.dataset.id);
            } else if (
                e.target.classList.contains('view-pw-btn') ||
                (e.target.classList.contains('eye-icon') && e.target.parentElement.classList.contains('view-pw-btn'))
            ) {
                // Support clicking the button or the icon
                const btn = e.target.classList.contains('view-pw-btn') ? e.target : e.target.parentElement;
                const idx = btn.dataset.idx;
                const mask = document.getElementById(`pw-mask-${idx}`);
                const plain = document.getElementById(`pw-plain-${idx}`);
                const eye = document.getElementById(`eye-icon-${idx}`);
                console.log('View Password clicked:', { idx, mask, plain, eye });
                if (!plain || !mask) {
                    this.showError('Password not available for this credential.');
                    return;
                }
                if (mask.style.display === 'none') {
                    mask.style.display = '';
                    plain.style.display = 'none';
                    btn.setAttribute('aria-label', 'Show Password');
                    btn.title = 'Show Password';
                    if (eye) eye.style.opacity = '0.5';
                } else {
                    mask.style.display = 'none';
                    plain.style.display = '';
                    btn.setAttribute('aria-label', 'Hide Password');
                    btn.title = 'Hide Password';
                    if (eye) eye.style.opacity = '1';
                }
            }
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    async saveCredential() {
        try {
            const formData = {
                project: document.getElementById('project').value,
                category: document.getElementById('category').value,
                name: document.getElementById('name').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                notes: document.getElementById('notes').value || ''
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

    filterByCategory(category) {
        const credentials = document.querySelectorAll('.credential-card');
        
        credentials.forEach(card => {
            const cardCategory = card.querySelector('[data-category]')?.dataset.category;
            card.style.display = !category || cardCategory === category ? '' : 'none';
        });
    }

    filterByProject(project) {
        const credentials = document.querySelectorAll('.credential-card');
        
        credentials.forEach(card => {
            const cardProject = card.querySelector('[data-project]')?.dataset.project;
            card.style.display = !project || cardProject === project ? '' : 'none';
        });
    }
}

// Initialize the credential manager
document.addEventListener('DOMContentLoaded', () => {
    window.credentialManager = new CredentialManager();
});
