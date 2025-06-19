// Global credential manager object
window.credentialManager = {
    credentials: [],
    isLoading: false,

    initialize() {
        console.log('Initializing credential manager...');
        
        // Ensure user context exists
        api.ensureUserContext();
        
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.projectFilter = document.getElementById('projectFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        
        // Set up event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
        if (this.projectFilter) {
            this.projectFilter.addEventListener('change', () => this.filterCredentials());
        }
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', () => this.filterCredentials());
        }

        // Initial load
        this.loadCredentials();
    },

    async loadCredentials() {
        try {
            this.isLoading = true;
            this.showLoading();

            const response = await fetch(`${window.location.origin}/api/credentials`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('teamsUserId') || 'dev-user',
                    'x-user-name': localStorage.getItem('teamsUserName') || 'Developer',
                    'x-user-email': localStorage.getItem('teamsUserEmail') || 'dev@globiq.com',
                    'user-context': localStorage.getItem('teamsUserId') || 'dev-user'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.credentials = await response.json();
            this.renderCredentials();
            this.updateFilters();
        } catch (error) {
            console.error('Error loading credentials:', error);
            this.showError('Failed to load credentials');
        } finally {
            this.isLoading = false;
        }
    },

    showLoading() {
        if (this.passwordList) {
            this.passwordList.innerHTML = '<div class="loading">Loading credentials...</div>';
        }
    },

    showError(message) {
        if (this.passwordList) {
            this.passwordList.innerHTML = `<div class="error">${message}</div>`;
        }
    },

    renderCredentials() {
        if (!this.passwordList) return;

        if (!this.credentials.length) {
            this.passwordList.innerHTML = '<div class="no-credentials">No credentials found</div>';
            return;
        }

        const html = this.credentials.map(credential => `
            <div class="credential-card">
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
                </div>
                <div class="credential-actions">
                    <button onclick="credentialManager.viewCredential('${credential._id}')" class="btn btn-view">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                        <button onclick="credentialManager.deleteCredential('${credential._id}')" class="btn btn-delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.passwordList.innerHTML = html;
    },

    updateFilters() {
        const projects = new Set();
        const categories = new Set();

        this.credentials.forEach(cred => {
            if (cred.project) projects.add(cred.project);
            if (cred.category) categories.add(cred.category);
        });

        if (this.projectFilter) {
            const currentValue = this.projectFilter.value;
            this.projectFilter.innerHTML = `
                <option value="">All Projects</option>
                ${[...projects].sort().map(p => `<option value="${p}"${p === currentValue ? ' selected' : ''}>${p}</option>`).join('')}
            `;
        }

        if (this.categoryFilter) {
            const currentValue = this.categoryFilter.value;
            this.categoryFilter.innerHTML = `
                <option value="">All Categories</option>
                ${[...categories].sort().map(c => `<option value="${c}"${c === currentValue ? ' selected' : ''}>${c}</option>`).join('')}
            `;
        }
    },

    filterCredentials() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase() : '';
        const projectFilter = this.projectFilter ? this.projectFilter.value : '';
        const categoryFilter = this.categoryFilter ? this.categoryFilter.value : '';

        const filtered = this.credentials.filter(cred => {
            const matchesSearch = !searchTerm || 
                cred.name?.toLowerCase().includes(searchTerm) ||
                cred.username?.toLowerCase().includes(searchTerm) ||
                cred.project?.toLowerCase().includes(searchTerm) ||
                cred.category?.toLowerCase().includes(searchTerm);

            const matchesProject = !projectFilter || cred.project === projectFilter;
            const matchesCategory = !categoryFilter || cred.category === categoryFilter;

            return matchesSearch && matchesProject && matchesCategory;
        });

        this.renderFilteredCredentials(filtered);
    },

    renderFilteredCredentials(filtered) {
        if (!this.passwordList) return;

        if (!filtered.length) {
            this.passwordList.innerHTML = '<div class="no-credentials">No matching credentials found</div>';
            return;
        }

        const html = filtered.map(credential => `
            <div class="credential-card">
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
                </div>
                <div class="credential-actions">
                    <button onclick="credentialManager.viewCredential('${credential._id}')" class="btn btn-view">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                        <button onclick="credentialManager.deleteCredential('${credential._id}')" class="btn btn-delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.passwordList.innerHTML = html;
    }
};
