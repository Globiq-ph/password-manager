class Api {
    constructor() {
        this.baseUrl = '/api';
    }

    _getHeaders(extra = {}) {
        // Always generate headers fresh
        let headers = { 'Content-Type': 'application/json' };
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        // Use localStorage for admin state everywhere
        if (userId && userEmail && userName && localStorage.getItem('isAdmin') !== 'true') {
            headers['X-User-Id'] = userId;
            headers['X-User-Email'] = userEmail;
            headers['X-User-Name'] = userName;
        }
        // Add X-Admin header if admin
        if (localStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin'] = 'true';
        }
        return { ...headers, ...extra };
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
        // Only send X-Admin header if admin, do not send user headers for GET
        let headers = { 'Content-Type': 'application/json' };
        if (localStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin'] = 'true';
        }
        const res = await fetch('/api/credentials', { headers });
        if (!res.ok) {
            let errorText = await res.text();
            let errorMsg = `Failed to fetch credentials (HTTP ${res.status}): ${errorText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.error || errorJson.message || errorMsg;
            } catch (e) {
                // Not JSON, keep errorText as is
            }
            throw new Error(errorMsg);
        }
        return res.json();
    }

    async deleteCredential(id) {
        const headers = this._getHeaders();
        if (localStorage.getItem('isAdmin') === 'true') {
            headers['X-Admin'] = 'true';
        }
        const res = await fetch(`/api/credentials/${id}`, {
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
