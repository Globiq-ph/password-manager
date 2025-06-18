// Global credential manager object
window.credentialManager = {
    initialize() {
        console.log('Initializing credential manager');
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        
        // Setup search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
        
        // Load initial data
        this.loadCredentials();
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

            const credentialElements = credentials.map(cred => {
                const div = document.createElement('div');
                div.className = 'credential-item';
                div.dataset.id = cred._id;
                
                div.innerHTML = `
                    <h3>${this.escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                    <div class="password-section">
                        <strong>Password:</strong> 
                        <span class="password-value">********</span>
                        <button class="toggle-password btn">Show</button>
                        <button class="delete-credential btn">Delete</button>
                    </div>
                `;

                // Add event listeners directly to the buttons
                const toggleBtn = div.querySelector('.toggle-password');
                const deleteBtn = div.querySelector('.delete-credential');
                const passwordSpan = div.querySelector('.password-value');

                toggleBtn.addEventListener('click', () => {
                    if (passwordSpan.textContent === '********') {
                        passwordSpan.textContent = cred.password;
                        toggleBtn.textContent = 'Hide';
                    } else {
                        passwordSpan.textContent = '********';
                        toggleBtn.textContent = 'Show';
                    }
                });

                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this credential?')) {
                        try {
                            await api.deleteCredential(cred._id);
                            div.remove();
                            // Check if we have any credentials left
                            if (this.passwordList.querySelectorAll('.credential-item').length === 0) {
                                this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
                            }
                        } catch (error) {
                            console.error('Error deleting credential:', error);
                            alert('Failed to delete credential: ' + error.message);
                        }
                    }
                });

                return div;
            });

            // Clear the list and add all credentials
            this.passwordList.innerHTML = '';
            credentialElements.forEach(element => {
                this.passwordList.appendChild(element);
            });

        } catch (error) {
            console.error('Error loading credentials:', error);
            this.passwordList.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
        }
    },

    filterCredentials() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const items = this.passwordList.querySelectorAll('.credential-item');
        
        items.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const username = item.querySelector('p').textContent.toLowerCase();
            item.style.display = (name.includes(searchTerm) || username.includes(searchTerm)) ? '' : 'none';
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
