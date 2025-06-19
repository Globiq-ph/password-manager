class CredentialManager {
    constructor() {
        this.initializeEventListeners();
        this.loadCredentials();
        this.categories = new Set();
        this.projects = new Set();
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

        // Category filter
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Project filter
        document.getElementById('projectFilter')?.addEventListener('change', (e) => {
            this.filterByProject(e.target.value);
        });

        // Clipboard copy
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target.dataset.value);
            }
        });

        // Delete credential
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-credential')) {
                this.deleteCredential(e.target.dataset.id);
            }
        });

        // Share credential
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-credential')) {
                this.showShareDialog(e.target.dataset.id);
            }
        });
    }

    checkPasswordStrength(password) {
        const strengthMeter = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('strengthText');
        
        if (!password) {
            strengthMeter.value = 0;
            strengthText.textContent = '';
            return;
        }

        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 20; // Uppercase
        if (/[a-z]/.test(password)) strength += 20; // Lowercase
        if (/[0-9]/.test(password)) strength += 20; // Numbers
        if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Special characters
        
        strengthMeter.value = strength;
        
        if (strength < 40) strengthText.textContent = 'Weak';
        else if (strength < 70) strengthText.textContent = 'Moderate';
        else strengthText.textContent = 'Strong';
    }

    async loadCredentials() {
        try {
            const response = await fetch('/api/credentials');
            if (!response.ok) throw new Error('Failed to fetch credentials');
            
            const credentials = await response.json();
            this.categories = new Set(credentials.map(c => c.category));
            this.projects = new Set(credentials.map(c => c.project));
            
            this.updateFilters();
            this.displayCredentials(credentials);
        } catch (error) {
            console.error('Error loading credentials:', error);
            this.showError('Failed to load credentials');
        }
    }

    updateFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const projectFilter = document.getElementById('projectFilter');
        
        // Update category filter
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            Array.from(this.categories)
                .sort()
                .map(cat => `<option value="${cat}">${cat}</option>`)
                .join('');
        
        // Update project filter
        projectFilter.innerHTML = '<option value="">All Projects</option>' +
            Array.from(this.projects)
                .sort()
                .map(proj => `<option value="${proj}">${proj}</option>`)
                .join('');
    }

    displayCredentials(credentials) {
        const container = document.getElementById('credentialsContainer');
        if (!container) return;

        container.innerHTML = credentials.length ? '' :
            '<p class="text-center text-gray-500">No credentials found</p>';

        credentials.forEach(cred => {
            const card = this.createCredentialCard(cred);
            container.appendChild(card);
        });
    }

    createCredentialCard(credential) {
        const card = document.createElement('div');
        card.className = 'credential-card bg-white p-4 rounded-lg shadow-md mb-4';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-semibold">${credential.name}</h3>
                <span class="badge ${credential.status === 'active' ? 'badge-success' : 'badge-warning'}">${credential.status}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p class="text-sm text-gray-600">Project</p>
                    <p class="font-medium">${credential.project}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Category</p>
                    <p class="font-medium">${credential.category}</p>
                </div>
            </div>
            <div class="mb-3">
                <p class="text-sm text-gray-600">Username</p>
                <div class="flex items-center gap-2">
                    <p class="font-medium">${credential.username}</p>
                    <button class="copy-btn text-blue-500 hover:text-blue-700" data-value="${credential.username}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-600">Password</p>
                <div class="flex items-center gap-2">
                    <p class="font-medium password-field">********</p>
                    <button class="show-password-btn text-blue-500 hover:text-blue-700" data-password="${credential.password}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="copy-btn text-blue-500 hover:text-blue-700" data-value="${credential.password}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <button class="share-credential btn btn-outline-primary btn-sm" data-id="${credential._id}">
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <button class="edit-credential btn btn-outline-secondary btn-sm" data-id="${credential._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-credential btn btn-outline-danger btn-sm" data-id="${credential._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        return card;
    }

    async saveCredential() {
        const form = document.getElementById('credentialForm');
        const formData = new FormData(form);
        const credential = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credential)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save credential');
            }

            this.showSuccess('Credential saved successfully');
            form.reset();
            this.loadCredentials();
        } catch (error) {
            console.error('Error saving credential:', error);
            this.showError(error.message);
        }
    }

    async deleteCredential(id) {
        if (!confirm('Are you sure you want to delete this credential?')) return;

        try {
            const response = await fetch(`/api/credentials/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete credential');
            
            this.showSuccess('Credential deleted successfully');
            this.loadCredentials();
        } catch (error) {
            console.error('Error deleting credential:', error);
            this.showError('Failed to delete credential');
        }
    }

    async showShareDialog(id) {
        const email = prompt('Enter email address to share with:');
        if (!email) return;

        try {
            const response = await fetch(`/api/credentials/${id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shareWith: email })
            });

            if (!response.ok) throw new Error('Failed to share credential');
            
            this.showSuccess('Credential shared successfully');
        } catch (error) {
            console.error('Error sharing credential:', error);
            this.showError('Failed to share credential');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    filterCredentials(search) {
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

    showSuccess(message) {
        // Implement toast or notification system
        alert(message); // Replace with better UI notification
    }

    showError(message) {
        // Implement toast or notification system
        alert('Error: ' + message); // Replace with better UI notification
    }
}

// Initialize the credential manager
document.addEventListener('DOMContentLoaded', () => {
    window.credentialManager = new CredentialManager();
});
