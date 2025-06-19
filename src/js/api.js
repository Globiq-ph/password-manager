const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://password-manager-p49n.onrender.com/api';

class Api {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json',
            'X-User-Id': localStorage.getItem('userId') || '',
            'X-User-Email': localStorage.getItem('userEmail') || '',
            'X-User-Name': localStorage.getItem('userName') || ''
        };
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
        
        // Verify user context was set
        const verifyUserId = localStorage.getItem('userId');
        console.log('Current user context:', {            userId: verifyUserId,
            userName: localStorage.getItem('userName'),
            userEmail: localStorage.getItem('userEmail')
        });
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
            console.error('API Error:', error);
            throw error;
        }
    }

    // Credential endpoints
    async getCredentials() {
        return this.request('/credentials');
    }

    async createCredential(data) {
        return this.request('/credentials', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCredential(id, data) {
        return this.request(`/credentials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCredential(id) {
        return this.request(`/credentials/${id}`, {
            method: 'DELETE'
        });
    }

    async shareCredential(id, email) {
        return this.request(`/credentials/${id}/share`, {
            method: 'POST',
            body: JSON.stringify({ shareWith: email })
        });
    }

    // Admin endpoints
    async getAdminStatus() {
        return this.request('/admin/status');
    }

    async getActivityLogs() {
        return this.request('/admin/activity-logs');
    }

    async getAdminUsers() {
        return this.request('/admin/users');
    }

    async updateAdminUser(userId, data) {
        return this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async adminLogout() {
        return this.request('/admin/logout', {
            method: 'POST'
        });
    }
}

// Create a global API instance
window.api = new Api();
