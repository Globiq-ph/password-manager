class Api {
    constructor() {
        this.baseUrl = '/api';
        this.ensureUserContext();
    }

    _getHeaders(extra = {}) {
        // Always generate headers fresh
        let headers = { 'Content-Type': 'application/json' };
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        if (userId && userEmail && userName && sessionStorage.getItem('isAdmin') !== 'true') {
            headers['X-User-Id'] = userId;
            headers['X-User-Email'] = userEmail;
            headers['X-User-Name'] = userName;
        }
        return { ...headers, ...extra };
    }

    ensureUserContext() {
        // Only set default user context if not admin
        if (!localStorage.getItem('userId') && sessionStorage.getItem('isAdmin') !== 'true') {
            localStorage.setItem('userId', 'dev-user');
            localStorage.setItem('userEmail', 'dev@globiq.com');
            localStorage.setItem('userName', 'Regular User');
        }
    }

    clearUserContext() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = this._getHeaders(options.headers || {});
            const response = await fetch(url, {
                ...options,
                headers
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
        }
        const res = await fetch('/credentials', { headers });
        if (!res.ok) throw new Error('Failed to fetch credentials');
        return res.json();
    }

    async deleteCredential(id) {
        const headers = this._getHeaders();
        // Add admin auth if admin
        if (sessionStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin-Auth'] = 'admin123:adminpassword';
        }
        const res = await fetch(`/credentials/${id}`, {
            method: 'DELETE',
            headers
        });
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
