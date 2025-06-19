class Api {
    constructor() {
        this.baseUrl = '/api';
        this.setHeaders();
    }

    setHeaders() {
        // Get user information
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        if (!userId || !userEmail) {
            console.warn('User context not found, using default development credentials');
        }

        this.headers = {
            'Content-Type': 'application/json',
            'X-User-Id': userId || 'dev-user',
            'X-User-Email': userEmail || 'dev@globiq.com',
            'X-User-Name': userName || 'john doe'
        };
    }

    async saveCredential(credentialData) {
        try {
            const response = await fetch(`${this.baseUrl}/credentials`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(credentialData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save credential');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving credential:', error);
            throw error;
        }
    }

    static ensureUserContext() {
        console.log('Ensuring user context...');
        // Check for existing user context
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        
        // If any user context is missing, set default values
        if (!userId || !userName || !userEmail) {
            console.log('Setting default user context');
            localStorage.setItem('userId', 'dev-user');
            localStorage.setItem('userName', 'john doe');
            localStorage.setItem('userEmail', 'dev@globiq.com');
            localStorage.setItem('isAdmin', 'true');
        }
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Credential management
    async saveCredential(credential) {
        return this.request('/credentials', {
            method: 'POST',
            body: JSON.stringify(credential)
        });
    }

    async getCredentials() {
        return this.request('/credentials');
    }

    async deleteCredential(id) {
        return this.request(`/credentials/${id}`, {
            method: 'DELETE'
        });
    }

    // Admin operations
    async isAdmin() {
        try {
            const response = await this.request('/admin/check');
            return response.isAdmin;
        } catch (error) {
            console.error('Admin check failed:', error);
            return false;
        }
    }

    async getUsers() {
        return this.request('/admin/users');
    }

    async getSystemStats() {
        return this.request('/admin/stats');
    }
}

// Create a global API instance
window.api = new Api();
