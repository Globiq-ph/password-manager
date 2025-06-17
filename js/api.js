const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async getCredentials() {
        try {
            console.log('Fetching credentials...');
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Credentials fetched successfully');
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw new Error('Failed to fetch credentials: ' + error.message);
        }
    },

    async addCredential(credential) {
        try {
            console.log('Adding credential...');
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Credential added successfully');
            return data;
        } catch (error) {
            console.error('Error adding credential:', error);
            throw new Error('Failed to add credential: ' + error.message);
        }
    },

    async deleteCredential(id) {
        try {
            console.log('Deleting credential:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Credential deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw new Error('Failed to delete credential: ' + error.message);
        }
    }
};

// Make the api object available globally
window.api = api;
