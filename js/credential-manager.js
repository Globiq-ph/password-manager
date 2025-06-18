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
        if (!this.passwordList) {
            console.error('Password list element not found');
            return;
        }

        try {
            this.setLoading(true);
            const credentials = await api.getCredentials();
            
            if (!credentials || credentials.length === 0) {
                this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
                return;
            }

            // Filter credentials based on role
            const filteredCredentials = this.currentRole === 'admin' 
                ? credentials 
                : credentials.filter(cred => !cred.isAdmin);

            // Update projects and categories sets
            this.projects = new Set(['All', ...new Set(filteredCredentials.map(cred => cred.project || 'Default'))]);
            this.categories = new Set(['All', ...new Set(filteredCredentials.map(cred => cred.category || 'General'))]);

            // Store credentials and render
            this.credentials = filteredCredentials;
            this.renderCredentials();

        } catch (error) {
            console.error('Error loading credentials:', error);
            this.passwordList.innerHTML = `
                <div class="error-container">
                    <p class="error">Error loading credentials: ${error.message}</p>
                    <button onclick="window.credentialManager.loadCredentials()">Retry</button>
                </div>
            `;
        } finally {
            this.setLoading(false);
        }
    },

    setLoading(isLoading) {
        this.isLoading = isLoading;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
        
        // Disable/enable interactive elements
        const inputs = document.querySelectorAll('input, button, select');
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
    },

    switchRole(role) {
        // Update UI
        document.querySelectorAll('.role-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.role === role);
        });
        document.body.classList.toggle('admin-mode', role === 'admin');

        // Update state and reload
        this.currentRole = role;
        this.loadCredentials();
    },

    renderCredentials() {
        if (!this.credentials || !this.passwordList) return;

        // Apply filters
        let displayCredentials = this.credentials;
        const projectFilter = this.projectFilter?.value.toLowerCase();
        const categoryFilter = this.categoryFilter?.value.toLowerCase();
        const searchTerm = this.searchInput?.value.toLowerCase();

        if (projectFilter) {
            displayCredentials = displayCredentials.filter(cred => 
                (cred.project || 'Default').toLowerCase().includes(projectFilter));
        }

        if (categoryFilter) {
            displayCredentials = displayCredentials.filter(cred => 
                (cred.category || 'General').toLowerCase().includes(categoryFilter));
        }

        if (searchTerm) {
            displayCredentials = displayCredentials.filter(cred => 
                cred.name.toLowerCase().includes(searchTerm) ||
                cred.username.toLowerCase().includes(searchTerm));
        }

        // Group credentials by category
        const categories = {};
        displayCredentials.forEach(cred => {
            const category = cred.category || 'General';
            if (!categories[category]) categories[category] = [];
            categories[category].push(cred);
        });

        // Create HTML for each category
        const html = Object.entries(categories).map(([category, creds]) => `
            <div class="category-section">
                <div class="category-header" data-category="${category}">
                    <h2>${category} <span class="credential-count">(${creds.length})</span></h2>
                    <button class="toggle-category" data-category="${category}">▼</button>
                </div>
                <div class="category-content" data-category="${category}">
                    ${creds.map(cred => this.renderCredentialItem(cred)).join('')}
                </div>
            </div>
        `).join('');

        // Add admin mode indicator if in admin view
        const adminIndicator = this.currentRole === 'admin' 
            ? '<div class="admin-mode-indicator">Admin View Mode</div>' 
            : '';

        this.passwordList.innerHTML = adminIndicator + (html || '<p class="no-results">No credentials found</p>');
        this.addEventListeners();
    },

    renderCredentialItem(cred) {
        const statusIcons = {
            active: '🟢',
            expired: '🔴',
            restricted: '🟡'
        };

        const canDelete = this.currentRole === 'admin' || !cred.isAdmin;

        return `
            <div class="credential-item ${cred.status}" data-id="${cred._id}">
                <div class="credential-header">
                    <h3>
                        ${statusIcons[cred.status || 'active']} 
                        ${this.escapeHtml(cred.name)}
                    </h3>
                    ${cred.isAdmin ? '<span class="admin-badge">Admin View</span>' : ''}
                </div>
                <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                <div class="password-section">
                    <strong>Password:</strong> 
                    <span class="password-value" data-id="${cred._id}">********</span>
                    <button class="toggle-password btn" data-id="${cred._id}" data-password="${this.escapeHtml(cred.password)}">
                        Show
                    </button>
                </div>
                <div class="credential-footer">
                    <span class="project-tag">${this.escapeHtml(cred.project || 'Default')}</span>
                    <span class="status-tag ${cred.status || 'active'}">${cred.status || 'active'}</span>
                </div>
                ${canDelete ? `
                    <div class="credential-actions">
                        <button class="delete-button" data-id="${cred._id}">
                            Delete Credential
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    addEventListeners() {
        // Toggle password buttons
        this.passwordList.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const password = e.target.dataset.password;
                const passwordSpan = this.passwordList.querySelector(`.password-value[data-id="${id}"]`);
                
                if (passwordSpan.textContent === '********') {
                    passwordSpan.textContent = password;
                    e.target.textContent = 'Hide';
                } else {
                    passwordSpan.textContent = '********';
                    e.target.textContent = 'Show';
                }
            });
        });

        // Delete buttons
        this.passwordList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!id) return;
                
                if (confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
                    try {
                        await api.deleteCredential(id);
                        // Reload all credentials to ensure proper counts and filtering
                        this.loadCredentials();
                        showMessage('Credential deleted successfully', 'success');
                    } catch (error) {
                        console.error('Error deleting credential:', error);
                        showMessage('Failed to delete credential: ' + error.message, 'error');
                    }
                }
            });
        });

        // Category toggle buttons
        this.passwordList.querySelectorAll('.toggle-category').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                const content = this.passwordList.querySelector(`.category-content[data-category="${category}"]`);
                const isExpanded = content.style.display !== 'none';
                
                content.style.display = isExpanded ? 'none' : 'block';
                e.target.textContent = isExpanded ? '▶' : '▼';
            });
        });
    },

    filterCredentials() {
        const searchTerm = this.searchInput?.value.toLowerCase() ?? '';
        const projectFilter = this.projectFilter?.value.toLowerCase() ?? '';
        const categoryFilter = this.categoryFilter?.value.toLowerCase() ?? '';
        
        // Re-render with current filters
        this.renderCredentials();
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
