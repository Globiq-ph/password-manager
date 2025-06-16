document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');

    addPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const credential = {
                website: document.getElementById('website').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };
            
            if (!credential.website || !credential.username || !credential.password) {
                throw new Error('All fields are required');
            }

            console.log('Submitting credential for:', credential.website);
            const result = await api.addCredential(credential);
            console.log('Credential added successfully:', result);
            
            if (!result._id) {
                throw new Error('Invalid response from server');
            }

            addPasswordForm.reset();
            await loadPasswords();
            // Switch to list tab after adding
            document.getElementById('tab-list').click();
        } catch (error) {
            console.error('Failed to add credential:', error);
            alert(`Failed to add password: ${error.message}`);
        }
    });

    async function loadPasswords() {
        try {
            console.log('Fetching credentials...');
            const credentials = await api.getCredentials();
            console.log('Fetched credentials count:', credentials?.length || 0);
            
            if (!Array.isArray(credentials)) {
                throw new Error('Invalid response from server');
            }

            passwordList.innerHTML = credentials.length === 0
                ? '<p style="color:#800000;">No credentials saved yet.</p>'
                : credentials.map(cred => `
                    <div class="password-item">
                        <h3>${cred.website}</h3>
                        <p>Username: ${cred.username}</p>
                        <p>Password: <span class="password-hidden">********</span></p>
                        <button onclick="showPassword(this, '${cred.password}')">Show Password</button>
                    </div>
                `).join('');
        } catch (error) {
            console.error('Failed to load passwords:', error);
            passwordList.innerHTML = '<p style="color:red;">Error loading passwords. Please try again later.</p>';
        }
    }

    // Initial load
    loadPasswords();
});
