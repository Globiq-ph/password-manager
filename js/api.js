const API_BASE_URL = '/api';

const api = {    async getCredentials() {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw error;
        }
    },    async addCredential(credential) {
        try {
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credential)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add credential');
            }
            return await response.json();
        } catch (error) {
            console.error('Error adding credential:', error);
            throw error;
        }
    },

    async deleteCredential(id) {
        const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
};
