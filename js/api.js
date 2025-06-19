const API_BASE_URL = 'https://password-manager-p49n.onrender.com/api';

const api = {
    // Helper to ensure user context exists
    ensureUserContext() {
        console.log('Ensuring user context...');
        if (!localStorage.getItem('teamsUserId') || !localStorage.getItem('teamsUserName') || !localStorage.getItem('teamsUserEmail')) {
            console.log('Setting default user context');
            localStorage.setItem('teamsUserId', 'dev-user');
            localStorage.setItem('teamsUserName', 'john doe');
            localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
            localStorage.setItem('isAdmin', 'true');
        }
        console.log('User context:', {
            userId: localStorage.getItem('teamsUserId'),
            userName: localStorage.getItem('teamsUserName'),
            userEmail: localStorage.getItem('teamsUserEmail')
        });
    },

    // Helper to get auth headers with fallback values
    getAuthHeaders() {
        this.ensureUserContext();
        
        // Get user info from localStorage with fallbacks
        const userId = localStorage.getItem('teamsUserId');
        const userName = localStorage.getItem('teamsUserName');
        const userEmail = localStorage.getItem('teamsUserEmail');

        if (!userId || !userName || !userEmail) {
            console.error('Failed to get user context from localStorage');
            throw new Error('User context not available');
        }

        const headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-Id': userId,
            'X-User-Name': userName,
            'X-User-Email': userEmail,
            'User-Context': userId // legacy header
        });
        
        return headers;
    },async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        // Log request headers for debugging
        const headers = this.getAuthHeaders();
        console.log('Request headers:', headers);
        
        try {
            const data = isJson ? await response.json() : await response.text();
            console.log('Response:', { status: response.status, data });

            if (!response.ok) {
                const error = new Error(
                    typeof data === 'object' ? data.message || response.statusText : response.statusText
                );
                error.status = response.status;
                error.details = data.details || {};
                error.error = data.error;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Response handling error:', error);
            throw error;
        }
    },    async getCredentials() {
        try {
            console.log('Fetching credentials...');
            const headers = this.getAuthHeaders();
            console.log('Request headers:', Object.fromEntries(headers.entries()));
            
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                credentials: 'include'
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in getCredentials:', error);
            throw error;
        }
    },

    async addCredential(data) {
        try {
            console.log('Adding credential...');
            
            // Validate required fields
            if (!data.name || !data.username || !data.password) {
                throw new Error('Missing required fields: name, username, and password are required');
            }

            // Get user context
            const headers = this.getAuthHeaders();
            
            // Prepare the request data
            const requestData = {
                name: data.name,
                username: data.username,
                password: data.password,
                project: data.project || 'Default',
                category: data.category || 'General',
                status: data.status || 'active',
                isAdmin: data.isAdmin || false,
                ownerId: headers['X-User-Id'],
                ownerName: headers['X-User-Name'],
                ownerEmail: headers['X-User-Email']
            };

            console.log('Sending request with data:', {
                ...requestData,
                password: '********'
            });            const headers = this.getAuthHeaders();
            console.log('Request headers:', Object.fromEntries(headers.entries()));
            
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in addCredential:', error);
            throw error;
        }
    },

    async updateCredential(id, data) {
        try {
            console.log('Updating credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                mode: 'cors',
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in updateCredential:', error);
            throw error;
        }
    },

    async deleteCredential(id) {
        try {
            console.log('Deleting credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in deleteCredential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
