const API_BASE_URL = 'https://password-manager-p49n.onrender.com/api';

class API {
    static ensureUserContext() {
        console.log('Ensuring user context...');
        
        // Check for existing user context
        const userId = localStorage.getItem('teamsUserId');
        const userName = localStorage.getItem('teamsUserName');
        const userEmail = localStorage.getItem('teamsUserEmail');
        
        // If any user context is missing, set default values
        if (!userId || !userName || !userEmail) {
            console.log('Setting default user context');
            localStorage.setItem('teamsUserId', 'dev-user');
            localStorage.setItem('teamsUserName', 'john doe');
            localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
            localStorage.setItem('isAdmin', 'true');
        }
        
        // Verify user context was set
        const verifyUserId = localStorage.getItem('teamsUserId');
        console.log('Current user context:', {
            userId: verifyUserId,
            userName: localStorage.getItem('teamsUserName'),
            userEmail: localStorage.getItem('teamsUserEmail')
        });
    }

    static getHeaders() {
        this.ensureUserContext();
        
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-Id': localStorage.getItem('teamsUserId'),
            'X-User-Name': localStorage.getItem('teamsUserName'),
            'X-User-Email': localStorage.getItem('teamsUserEmail')
        };
    }

    static async fetchWithAuth(endpoint, options = {}) {
        const headers = this.getHeaders();
        const url = `${API_BASE_URL}${endpoint}`;
        
        console.log(`Fetching ${options.method || 'GET'} ${url}`);
        console.log('Headers:', headers);
        
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers },
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'API request failed');
        }
        
        return data;
    }

    // Credential endpoints
    static async getCredentials() {
        return this.fetchWithAuth('/credentials');
    }

    static async createCredential(credentialData) {
        return this.fetchWithAuth('/credentials', {
            method: 'POST',
            body: JSON.stringify(credentialData)
        });
    }

    static async updateCredential(id, credentialData) {
        return this.fetchWithAuth(`/credentials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(credentialData)
        });
    }

    static async deleteCredential(id) {
        return this.fetchWithAuth(`/credentials/${id}`, {
            method: 'DELETE'
        });
    }
}

window.api = API;
