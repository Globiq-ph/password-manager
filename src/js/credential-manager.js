class CredentialManager {
    constructor() {
        this.credentials = [];
        this.isLoading = false;
        this.initialized = false;
    }

    initialize() {
        console.log('Initializing credential manager...');
        
        if (this.initialized) {
            console.log('Already initialized');
            return;
        }

        // Ensure API is available
        if (!window.api) {
            throw new Error('API not initialized');
        }

        // Initialize user context
        window.api.ensureUserContext();

        // Get DOM elements
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.projectFilter = document.getElementById('projectFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadCredentials();
        
        this.initialized = true;
        console.log('Credential manager initialized');
    }

    setupEventListeners() {
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }

        // Project filter
        if (this.projectFilter) {
            this.projectFilter.addEventListener('change', () => this.filterCredentials());
        }

        // Category filter
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', () => this.filterCredentials());
        }

        // Add credential form
        const addForm = document.getElementById('addCredentialForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.handleAddCredential(e));
        }
    }

    async loadCredentials() {
        try {
            console.log('Loading credentials...');
            this.isLoading = true;
            this.showLoading();

            const response = await window.api.getCredentials();
            console.log('Loaded credentials:', response);

            this.credentials = response.data;
            this.renderCredentials();
            this.updateFilters();

        } catch (error) {
            console.error('Error loading credentials:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    showLoading() {
        if (this.passwordList) {
            this.passwordList.innerHTML = '<div class="loading">Loading credentials...</div>';
        }
    }

    showError(message) {
        if (this.passwordList) {
            this.passwordList.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    renderCredentials(credentials = this.credentials) {
        if (!this.passwordList) return;

        if (!credentials.length) {
            this.passwordList.innerHTML = '<div class="no-credentials">No credentials found</div>';
            return;
        }

        const html = credentials.map(credential => `
            <div class="credential-card" data-id="${credential._id}">
                <div class="credential-header">
                    <h3>${credential.name || 'Unnamed'}</h3>
                    <span class="credential-status ${credential.status || 'active'}">${credential.status || 'Active'}</span>
                </div>
                <div class="credential-body">
                    <div class="credential-field">
                        <label>Username</label>
                        <span>${credential.username}</span>
                    </div>
                    <div class="credential-field">
                        <label>Project</label>
                        <span>${credential.project || 'N/A'}</span>
                    </div>
                    <div class="credential-field">
                        <label>Category</label>
                        <span>${credential.category || 'N/A'}</span>
                    </div>
                    <div class="credential-actions">
                        <button onclick="credentialManager.viewCredential('${credential._id}')" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="credentialManager.editCredential('${credential._id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="credentialManager.deleteCredential('${credential._id}')" class="btn-icon">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.passwordList.innerHTML = html;
    }

    updateFilters() {
        // Update project filter
        if (this.projectFilter) {
            const projects = [...new Set(this.credentials.map(c => c.project || 'Default'))];
            this.projectFilter.innerHTML = `
                <option value="">All Projects</option>
                ${projects.map(p => `<option value="${p}">${p}</option>`).join('')}
            `;
        }

        // Update category filter
        if (this.categoryFilter) {
            const categories = [...new Set(this.credentials.map(c => c.category || 'General'))];
            this.categoryFilter.innerHTML = `
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            `;
        }
    }

    filterCredentials() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase() : '';
        const projectFilter = this.projectFilter ? this.projectFilter.value : '';
        const categoryFilter = this.categoryFilter ? this.categoryFilter.value : '';

        const filtered = this.credentials.filter(credential => {
            const matchesSearch = !searchTerm || 
                credential.name.toLowerCase().includes(searchTerm) ||
                credential.username.toLowerCase().includes(searchTerm) ||
                (credential.project && credential.project.toLowerCase().includes(searchTerm));

            const matchesProject = !projectFilter || credential.project === projectFilter;
            const matchesCategory = !categoryFilter || credential.category === categoryFilter;

            return matchesSearch && matchesProject && matchesCategory;
        });

        this.renderCredentials(filtered);
    }

    async handleAddCredential(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const credential = {
                name: formData.get('name'),
                username: formData.get('username'),
                password: formData.get('password'),
                project: formData.get('project'),
                category: formData.get('category'),
                url: formData.get('url'),
                notes: formData.get('notes')
            };

            const response = await window.api.createCredential(credential);
            console.log('Credential created:', response);

            // Refresh credentials list
            await this.loadCredentials();

            // Reset form
            event.target.reset();

            // Show success message
            alert('Credential added successfully');

        } catch (error) {
            console.error('Error adding credential:', error);
            alert(`Error adding credential: ${error.message}`);
        }
    }

    async viewCredential(id) {
        // Implement credential viewing logic
        alert(`Viewing credential ${id}`);
    }

    async editCredential(id) {
        // Implement credential editing logic
        alert(`Editing credential ${id}`);
    }

    async deleteCredential(id) {
        if (confirm('Are you sure you want to delete this credential?')) {
            try {
                await window.api.deleteCredential(id);
                await this.loadCredentials();
                alert('Credential deleted successfully');
            } catch (error) {
                console.error('Error deleting credential:', error);
                alert(`Error deleting credential: ${error.message}`);
            }
        }
    }
}

// Initialize global credential manager
window.credentialManager = new CredentialManager();
