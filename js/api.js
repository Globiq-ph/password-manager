const API_BASE_URL = '/api';

const api = {
    async getCredentials() {
        try {
            console.log('Fetching credentials from API...');
            const response = await fetch(`${API_BASE_URL}/credentials`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Credentials fetched successfully:', { count: data.length });
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw new Error(`Failed to fetch credentials: ${error.message}`);
        }
    },
    
    async addCredential(credential) {
        try {
            console.log('Adding new credential for website:', credential.website);
            
            if (!credential.website || !credential.username || !credential.password) {
                throw new Error('All fields are required');
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to add credential: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Credential added successfully:', { id: result._id });
            return result;
        } catch (error) {
            console.error('Error adding credential:', error);
            throw new Error(`Failed to add credential: ${error.message}`);
        }
    },

    async deleteCredential(id) {
        const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
};

export const deleteCredential = async (credentialId) => {
    try {
        const response = await fetch(`/api/credentials/${credentialId}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Failed to delete credential');
        }
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export default api;
