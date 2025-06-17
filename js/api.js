const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async getCredentials() {
        try {
            console.log('Fetching credentials...');
            const response = await fetch(`${API_BASE_URL}/credentials`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch credentials: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getCredentials:', error);
            throw error;
        }
    },

    async deleteCredential(id) {
        try {
            console.log('Deleting credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete credential: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error in deleteCredential:', error);
            throw error;
        }
    },

    async addCredential(data) {
        try {
            console.log('Adding credential...');
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to add credential: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in addCredential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
