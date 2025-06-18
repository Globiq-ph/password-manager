const API_BASE_URL = 'https://password-manager-wab6.onrender.com/api';

const api = {
    // Helper to get auth headers with fallback values
    getAuthHeaders() {
        // Get user info from localStorage with fallbacks
        const userId = localStorage.getItem('teamsUserId') || 'dev-user';
        const userName = localStorage.getItem('teamsUserName') || 'Developer';
        const userEmail = localStorage.getItem('teamsUserEmail') || 'dev@globiq.com';

        // Log the headers we're using
        console.log('Using auth headers:', { userId, userName, userEmail });

        return {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-User-Name': userName,
            'X-User-Email': userEmail
        };
    },

    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
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
    },

    async getCredentials() {
        try {
            console.log('Fetching credentials...');
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                headers: this.getAuthHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in getCredentials:', error);
            throw error;
        }
    },

    async deleteCredential(id) {
        try {
            console.log('Deleting credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in deleteCredential:', error);
            throw error;
        }
    },

    async addCredential(data) {
        try {
            console.log('Adding credential...');
            
            // Validate required fields
            const requiredFields = ['name', 'username', 'password'];
            const missingFields = requiredFields.filter(field => !data[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Get user context
            const headers = this.getAuthHeaders();
            const userContext = {
                ownerId: headers['X-User-Id'],
                ownerName: headers['X-User-Name'],
                ownerEmail: headers['X-User-Email']
            };
            
            // Add user context to credential data
            const credentialData = {
                ...data,
                ...userContext,
                project: data.project || 'Default',
                category: data.category || 'General',
                status: data.status || 'active',
                isAdmin: data.isAdmin || false
            };

            console.log('Sending credential data:', {
                ...credentialData,
                password: '********' // Hide password in logs
            });

            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(credentialData)
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
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error in updateCredential:', error);
            throw error;
        }
    },

    async shareCredential(id, userData) {
        try {
            console.log('Sharing credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}/share`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`Failed to share credential: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in shareCredential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
