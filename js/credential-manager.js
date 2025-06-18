// Global credential manager object
window.credentialManager = {
    isInitialized: false,
    projects: new Set(['Default']),
    currentProject: 'All',

    initialize() {
        if (this.isInitialized) return this;
        
        console.log('Initializing credential manager');
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.projectFilter = document.getElementById('projectFilter');
        
        // Setup search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }

        // Setup project filter
        if (this.projectFilter) {
            this.projectFilter.addEventListener('change', (e) => {
                this.currentProject = e.target.value;
                this.renderCredentials();
            });
        }
        
        // Set initialized flag
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
            this.passwordList.innerHTML = '<p class="loading">Loading credentials...</p>';
            const credentials = await api.getCredentials();
            
            if (!credentials || credentials.length === 0) {
                this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
                return;
            }

            // Update projects list and filter
            this.projects = new Set(['All', ...new Set(credentials.map(cred => cred.project || 'Default'))]);
            this.updateProjectFilter();

            // Store credentials and render
            this.credentials = credentials;
            this.renderCredentials();

        } catch (error) {
            console.error('Error loading credentials:', error);
            this.passwordList.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
        }
    },

    updateProjectFilter() {
        if (this.projectFilter) {
            this.projectFilter.innerHTML = Array.from(this.projects)
                .map(project => `<option value="${project}">${project}</option>`)
                .join('');
            this.projectFilter.value = this.currentProject;
        }
    },

    renderCredentials() {
        if (!this.credentials || !this.passwordList) return;

        // Filter credentials by project if needed
        let displayCredentials = this.credentials;
        if (this.currentProject !== 'All') {
            displayCredentials = this.credentials.filter(cred => cred.project === this.currentProject);
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

        this.passwordList.innerHTML = html || '<p class="no-results">No credentials found</p>';
        this.addEventListeners();
    },

    renderCredentialItem(cred) {
        const statusIcons = {
            active: '🟢',
            expired: '🔴',
            restricted: '🟡'
        };

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
                    ${!cred.isAdmin ? `<button class="delete-credential btn" data-id="${cred._id}">Delete</button>` : ''}
                </div>
                <div class="credential-footer">
                    <span class="project-tag">${this.escapeHtml(cred.project || 'Default')}</span>
                    <span class="status-tag ${cred.status || 'active'}">${cred.status || 'active'}</span>
                </div>
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
        this.passwordList.querySelectorAll('.delete-credential').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!id) return;
                
                if (confirm('Are you sure you want to delete this credential?')) {
                    try {
                        await api.deleteCredential(id);
                        // Reload all credentials to ensure proper counts and filtering
                        this.loadCredentials();
                    } catch (error) {
                        console.error('Error deleting credential:', error);
                        alert('Failed to delete credential: ' + error.message);
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
        const searchTerm = this.searchInput.value.toLowerCase();
        const items = this.passwordList.querySelectorAll('.credential-item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const username = item.querySelector('p').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm) || username.includes(searchTerm);
            item.style.display = isVisible ? '' : 'none';
            if (isVisible) hasVisibleItems = true;
        });

        // Update category visibility based on visible items
        this.passwordList.querySelectorAll('.category-section').forEach(section => {
            const hasVisibleCredentials = !!section.querySelector('.credential-item[style=""]');
            section.style.display = hasVisibleCredentials ? '' : 'none';
        });
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
