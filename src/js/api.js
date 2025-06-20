class Api {
    constructor() {
        this.baseUrl = '/api';
        this.setHeaders();
        this.ensureUserContext();
    }

    setHeaders() {
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        this.headers = {
            'Content-Type': 'application/json',
        };
        if (userId && userEmail && userName) {
            this.headers['X-User-Id'] = userId;
            this.headers['X-User-Email'] = userEmail;
            this.headers['X-User-Name'] = userName;
        }
    }

    ensureUserContext() {
        // Only set default user context if not admin
        if (!localStorage.getItem('userId') && sessionStorage.getItem('isAdmin') !== 'true') {
            localStorage.setItem('userId', 'dev-user');
            localStorage.setItem('userEmail', 'dev@globiq.com');
            localStorage.setItem('userName', 'Regular User');
            this.setHeaders();
        }
    }

    clearUserContext() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        this.setHeaders();
    }

    async saveCredential(credentialData) {
        try {
            console.log('Saving credential:', credentialData);
            const response = await fetch(`${this.baseUrl}/credentials`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(credentialData)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Server error:', data);
                throw new Error(data.error || 'Failed to save credential');
            }

            console.log('Credential saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Error saving credential:', error);
            throw new Error(error.message || 'Failed to save credential');
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
        const headers = this._getHeaders();
        // Add admin auth if admin
        if (sessionStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin-Auth'] = 'admin123:adminpassword';
            console.log('Sending X-Admin-Auth header for admin:', headers['X-Admin-Auth']);
        }
        const res = await fetch('/credentials', { headers });
        console.log('GET /credentials response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch credentials');
        return res.json();
    }

    async deleteCredential(id) {
        const headers = this._getHeaders();
        // Add admin auth if admin
        if (sessionStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin-Auth'] = 'admin123:adminpassword';
            console.log('Sending X-Admin-Auth header for admin:', headers['X-Admin-Auth']);
        }
        const res = await fetch(`/credentials/${id}`, {
            method: 'DELETE',
            headers
        });
        console.log('DELETE /credentials response status:', res.status);
        if (!res.ok) throw new Error('Failed to delete credential');
        return res.json();
    }

    async getAllCredentials() {
        // For compatibility with main.js
        return this.getCredentials();
    }

    async getCredentialPassword(id) {
        return this.request(`/credentials/${id}/password`);
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
