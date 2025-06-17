const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async getCredentials() {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw new Error('Failed to fetch credentials');
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: credential.name,
                    username: credential.username,
                    password: credential.password
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error adding credential:', error);
            throw new Error('Failed to save credential: ' + error.message);
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
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete credential (${response.status})`);
            }

            return await response.json();
            
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw new Error('Failed to delete credential: ' + error.message);
        }
    }
};

// Make the api object available globally
window.api = api;
