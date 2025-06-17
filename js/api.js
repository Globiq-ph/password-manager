const API_BASE_URL = 'https://password-manager-for-teams.onrender.com/api';

const api = {
    async getCredentials() {
        try {
            console.log('Fetching credentials from:', `${API_BASE_URL}/credentials`);
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Fetched credentials:', data);
            
            if (!Array.isArray(data)) {
                console.error('Invalid data format received:', data);
                throw new Error('Invalid data format received from server');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw error;
        }
    },

    async addCredential(credential) {
        try {
            console.log('Adding credential:', credential);
            if (!credential.name || !credential.username || !credential.password) {
                throw new Error('All fields are required (Name, Username, and Password)');
            }
            
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: credential.name,
                    username: credential.username,
                    password: credential.password
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Failed to add credential: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Credential added successfully:', result);
            return result;
        } catch (error) {
            console.error('Error adding credential:', error);
            throw error;
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
                },
                credentials: 'include',
                mode: 'cors'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete credential: ${errorText}`);
            }

            const result = await response.json();
            console.log('Credential deleted successfully:', result);
            return result;
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
