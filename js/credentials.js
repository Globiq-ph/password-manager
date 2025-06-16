const API_BASE_URL = '/api';

const api = {
    async getCredentials() {
        try {
            console.log('Fetching credentials...');
            const response = await fetch(`${API_BASE_URL}/credentials`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched credentials count:', data.length);
            return data;
        } catch (error) {
            console.error('Error fetching credentials:', error);
            throw error;
        }
    },
    
    async addCredential(credential) {
        try {
            console.log('Adding credential for website:', credential.website);
            const response = await fetch(`${API_BASE_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
        try {
            console.log('Deleting credential with ID:', id);
            const response = await fetch(`${API_BASE_URL}/credentials/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete credential');
            }
            
            console.log('Successfully deleted credential');
            return true;
        } catch (error) {
            console.error('Error deleting credential:', error);
            throw error;
        }
    }
};

// Function to toggle password visibility
function togglePassword(button, id, password) {
    const pwdSpan = document.getElementById(`pwd-${id}`);
    if (pwdSpan.textContent === '********') {
        pwdSpan.textContent = password;
        button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
    } else {
        pwdSpan.textContent = '********';
        button.innerHTML = '<i class="fas fa-eye"></i> Show';
    }
}

// Function to delete credential
async function deleteCredential(id) {
    if (confirm('Are you sure you want to delete this credential?')) {
        try {
            await api.deleteCredential(id);
            const element = document.getElementById(`credential-${id}`);
            if (element) {
                element.remove();
                // If no credentials left, show the "no credentials" message
                const passwordList = document.getElementById('passwordList');
                if (!passwordList.children.length) {
                    passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
                }
            }
        } catch (error) {
            alert(`Failed to delete credential: ${error.message}`);
        }
    }
}

// Function to load passwords
async function loadPasswords() {
    const passwordList = document.getElementById('passwordList');
    try {
        const credentials = await api.getCredentials();
        
        if (!credentials.length) {
            passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
            return;
        }
        
        passwordList.innerHTML = credentials.map(cred => `
            <div class="password-item" id="credential-${cred._id}">
                <h3>${cred.website}</h3>
                <p><strong>Username:</strong> ${cred.username}</p>
                <p>
                    <strong>Password:</strong> 
                    <span class="password-hidden" id="pwd-${cred._id}">********</span>
                </p>
                <div class="password-actions">
                    <button class="btn btn-show" onclick="togglePassword(this, '${cred._id}', '${cred.password}')">
                        <i class="fas fa-eye"></i> Show
                    </button>
                    <button class="btn btn-delete" onclick="deleteCredential('${cred._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading passwords:', error);
        passwordList.innerHTML = '<p style="color:red;">Error loading passwords. Please try again.</p>';
    }
}
