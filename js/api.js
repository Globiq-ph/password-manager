const API_BASE_URL = '/api';

const api = {
    getCredentials: async function() {
        try {
            console.log('Fetching credentials...');
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched credentials:', data);
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw error;
        }
    },      async addCredential(credential) {
        try {
            console.log('Adding credential:', credential);
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(credential)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Added credential:', data);
            return data;
        } catch (error) {
            console.error('Error adding credential:', error);
            throw error;
        }
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
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: credential.name,
                    username: credential.username,
                    password: credential.password
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error('Failed to add credential');
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
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete credential');
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw error;
        }
    }
};

// Make the api object available globally
window.api = api;
