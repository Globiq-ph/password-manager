const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async handleResponse(response) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const jsonResponse = await response.json();
            if (!response.ok) {
                throw new Error(jsonResponse.message || `HTTP error! status: ${response.status}`);
            }
            return jsonResponse;
        } else {
            const textResponse = await response.text();
            if (!response.ok) {
                throw new Error(textResponse || `HTTP error! status: ${response.status}`);
            }
            return textResponse;
        }
    },

    async getCredentials() {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw new Error(`Failed to fetch credentials: ${error.message}`);
        }
    },

    async addCredential(credential) {
        try {
            if (!credential.name || !credential.username || !credential.password) {
                throw new Error('Missing required fields');
            }

            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(credential)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error adding credential:', error);
            throw new Error(`Failed to add credential: ${error.message}`);
        }
    },

    async deleteCredential(id) {
        try {
            if (!id) {
                throw new Error('Credential ID is required');
            }

            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw new Error(`Failed to delete credential: ${error.message}`);
        }
    }
};

// Make the api object available globally
window.api = api;
