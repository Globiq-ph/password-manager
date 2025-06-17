// Credential management functionality
const credentialManager = {
    init: function() {
        this.passwordList = document.getElementById('passwordList');
        this.searchInput = document.getElementById('searchCredentials');
        this.loadCredentials();
        
        // Setup search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterCredentials());
        }
    },

    async loadCredentials() {
        if (!this.passwordList) return;

        try {
            this.passwordList.innerHTML = '<p class="loading">Loading credentials...</p>';
            const credentials = await api.getCredentials();
            
            if (!credentials || credentials.length === 0) {
                this.passwordList.innerHTML = '<p class="no-results">No credentials found</p>';
                return;
            }

            const credentialsHtml = credentials.map(cred => `
                <div class="credential-item" data-id="${cred._id}">
                    <div class="credential-content">
                        <h3>${this.escapeHtml(cred.name)}</h3>
                        <p><strong>Username:</strong> ${this.escapeHtml(cred.username)}</p>
                        <div class="password-field">
                            <strong>Password:</strong>
                            <span class="password-value" id="pwd-${cred._id}" data-password="${this.escapeHtml(cred.password)}">********</span>
                            <button class="toggle-password" data-id="${cred._id}">Show</button>
                        </div>
                        <button class="delete-credential" data-id="${cred._id}">Delete</button>
                    </div>
                </div>
            `).join('');

            this.passwordList.innerHTML = credentialsHtml;

            // Attach event listeners
            this.attachEventListeners();

        } catch (error) {
            console.error('Failed to load credentials:', error);
            this.passwordList.innerHTML = '<p class="error">Error loading credentials</p>';
        }
    },

    attachEventListeners() {
        // Password toggle buttons
        this.passwordList.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const pwdSpan = document.getElementById(`pwd-${id}`);
                const password = pwdSpan.dataset.password;
                
                if (pwdSpan.textContent === '********') {
                    pwdSpan.textContent = password;
                    e.target.textContent = 'Hide';
                } else {
                    pwdSpan.textContent = '********';
                    e.target.textContent = 'Show';
                }
            });
        });

        // Delete buttons
        this.passwordList.querySelectorAll('.delete-credential').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this credential?')) {
                    try {
                        await api.deleteCredential(id);
                        // Reload the credentials list
                        this.loadCredentials();
                    } catch (error) {
                        console.error('Error deleting credential:', error);
                        alert('Failed to delete credential');
                    }
                }
            });
        });
    },

    filterCredentials() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const items = this.passwordList.querySelectorAll('.credential-item');
        
        items.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const username = item.querySelector('p').textContent.toLowerCase();
            if (name.includes(searchTerm) || username.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    escapeHtml(unsafe) {
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    credentialManager.init();
});
