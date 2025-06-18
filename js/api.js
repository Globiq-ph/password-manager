const API_BASE_URL = 'https://password-manager-wab6.onrender.com/api';

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
            // Ensure default values for new fields
            const credentialData = {
                project: 'Default',
                category: 'General',
                status: 'active',
                isAdmin: false,
                ...data
            };

            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentialData)
            });

            if (!response.ok) {
                throw new Error(`Failed to add credential: ${response.status}`);
            }

            return await response.json();
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to update credential: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in updateCredential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
