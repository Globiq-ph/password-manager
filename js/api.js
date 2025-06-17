const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async getCredentials() {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw error;
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
                credentials: 'include',
                body: JSON.stringify(credential)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding credential:', error);
            throw error;
        }
    },

    async deleteCredential(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw error;
        }
    },

    // Helper method to handle response errors
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
};

// Make the api object available globally
window.api = api;
