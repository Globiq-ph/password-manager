// Global credential manager object
window.credentialManager = {
    isInitialized: false,
    currentRole: 'user',
    projects: new Set(['Default']),
    categories: new Set(['General']),
    isAdmin: false,
    isLoading: false,

    initialize() {
        if (this.isInitialized) return this;
        
        console.log('Initializing credential manager');
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.projectFilter = document.getElementById('projectFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.roleSelector = document.getElementById('roleSelector');
        
        // Setup search and filters
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
        if (this.projectFilter) {
            this.projectFilter.addEventListener('input', () => this.filterCredentials());
        }
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('input', () => this.filterCredentials());
        }

        // Setup role selector if user is admin
        if (this.roleSelector && this.isAdmin) {
            this.roleSelector.style.display = 'flex';
            this.roleSelector.querySelectorAll('.role-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const role = e.target.dataset.role;
                    this.switchRole(role);
                });
            });
        }
        
        this.isInitialized = true;
        
        // Load initial data if we're on the view credentials tab
        const viewTab = document.querySelector('.tab[data-tab="viewCredentials"]');
        if (viewTab && viewTab.classList.contains('active')) {
            this.loadCredentials();
        }
        
        return this;
    },

    async loadCredentials() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('Loading credentials...');
            // Show loading state
            if (this.passwordList) {
                this.passwordList.innerHTML = '<div class="loading">Loading credentials...</div>';
            }
            
            const headers = {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('teamsUserId') || 'dev-user',
                'x-user-name': localStorage.getItem('teamsUserName') || 'Developer',
                'x-user-email': localStorage.getItem('teamsUserEmail') || 'dev@globiq.com'
            };
            
            // Add legacy header for backward compatibility
            headers['user-context'] = headers['x-user-id'];
            
            // Use appropriate endpoint based on admin status
            const endpoint = localStorage.getItem('isAdmin') === 'true' 
                ? '/api/credentials' 
                : '/api/credentials/user';
            
            console.log('Fetching from endpoint:', endpoint);
            const response = await fetch(endpoint, { headers });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const credentials = await response.json();
            console.log('Credentials loaded:', credentials.length);
            
            // Update projects and categories
            credentials.forEach(cred => {
                if (cred.project) this.projects.add(cred.project);
                if (cred.category) this.categories.add(cred.category);
            });
            
            // Update filter dropdowns
            this.updateFilterOptions();
            
            // Render credentials
            this.renderCredentials(credentials);
        } catch (error) {
            console.error('Error loading credentials:', error);
            if (this.passwordList) {
                this.passwordList.innerHTML = '<div class="error">Error loading credentials. Please try again.</div>';
            }
            showMessage('Failed to load credentials: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
        }
    },
    
    renderCredentials(credentials) {
        if (!this.passwordList) return;
        
        if (!credentials.length) {
            this.passwordList.innerHTML = '<div class="no-credentials">No credentials found</div>';
            return;
        }
        
        const html = credentials.map(cred => `
            <div class="credential-item" data-id="${cred._id}">
                <div class="credential-header">
                    <h3>${cred.name || 'Unnamed Credential'}</h3>
                    <span class="credential-project">${cred.project || 'No Project'}</span>
                </div>
                <div class="credential-details">
                    <div class="credential-field">
                        <label>Username:</label>
                        <span>${cred.username}</span>
                    </div>
                    <div class="credential-field">
                        <label>Category:</label>
                        <span>${cred.category || 'Uncategorized'}</span>
                    </div>
                    <div class="credential-field">
                        <label>Status:</label>
                        <span class="status-badge status-${cred.status || 'active'}">${cred.status || 'Active'}</span>
                    </div>
                </div>
                <div class="credential-actions">
                    <button onclick="credentialManager.viewCredential('${cred._id}')" class="action-btn view-btn">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                        <button onclick="credentialManager.deleteCredential('${cred._id}')" class="action-btn delete-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        this.passwordList.innerHTML = html;
    }
};
