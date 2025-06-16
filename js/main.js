document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrengthBar');    // Add search bar and bulk delete button above the list
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search credentials...';
    searchInput.id = 'searchBar';
    searchInput.style.marginBottom = '10px';
    passwordList.parentElement.insertBefore(searchInput, passwordList);

    const bulkDeleteBtn = document.createElement('button');
    bulkDeleteBtn.textContent = 'Delete Selected';
    bulkDeleteBtn.id = 'bulkDeleteBtn';
    bulkDeleteBtn.className = 'mass-action-btn';
    bulkDeleteBtn.style.marginBottom = '10px';
    passwordList.parentElement.insertBefore(bulkDeleteBtn, passwordList);

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

    let allCredentials = [];

    async function loadPasswords() {
        const passwordList = document.getElementById('passwordList');
        try {
            const response = await fetch('/api/credentials');
            const credentials = await response.json();
            
            if (credentials.length === 0) {
                passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
                return;
            }

            passwordList.innerHTML = credentials.map(cred => `
                <div class="password-item" id="credential-${cred._id}">
                    <h3>${cred.name}</h3>
                    <p><strong>Username:</strong> ${cred.username}</p>
                    <div class="password-field">
                        <strong>Password:</strong> 
                        <input type="password" value="${cred.password}" readonly>
                        <button onclick="togglePassword(this)">Show</button>
                    </div>
                    <button onclick="deleteCredential('${cred._id}')" class="delete-btn">Delete</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading passwords:', error);
            passwordList.innerHTML = '<p style="color:red;">Error loading credentials. Please try again.</p>';
        }
    }    function renderCredentials(credentials) {
        if (!Array.isArray(credentials) || credentials.length === 0) {
            passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
            return;
        }
        
        passwordList.innerHTML = credentials.map(cred => `
            <div class="credential-item" data-id="${cred._id}">
                <div class="credential-info">
                    <strong>${cred.website}</strong>
                    <span>${cred.username}</span>
                </div>
                <div class="credential-actions">
                    <button onclick="deleteCredentialHandler('${cred._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
        }
        passwordList.innerHTML = credentials.map(cred => `
            <div class="password-item" data-website="${cred.website.toLowerCase()}" data-username="${cred.username.toLowerCase()}" id="credential-${cred._id}">
                <input type="checkbox" class="select-credential" data-id="${cred._id}" style="margin-right:8px;">
                <h3 style="display:inline;">${cred.website}</h3>
                <p>Username: ${cred.username}</p>
                <p class="password-field">
                    Password: 
                    <span class="password-text">********</span>
                    <button class="show-password-btn" data-password="${cred.password}">Show Password</button>
                </p>
                <button class="delete-credential-btn" data-id="${cred._id}" style="color:#fff;background:#800000;border:none;padding:5px 10px;border-radius:4px;">Delete</button>
            </div>
        `).join('');
    }

    // Search functionality
    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allCredentials.filter(cred =>
            cred.website.toLowerCase().includes(query) ||
            cred.username.toLowerCase().includes(query)
        );
        renderCredentials(filtered);
    });

    // Event delegation for show/hide password and delete
    passwordList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('show-password-btn')) {
            const button = e.target;
            const passwordText = button.parentElement.querySelector('.password-text');
            const password = button.dataset.password;
            if (button.textContent === 'Show Password') {
                passwordText.textContent = password;
                button.textContent = 'Hide Password';
            } else {
                passwordText.textContent = '********';
                button.textContent = 'Show Password';
            }
        }
        if (e.target.classList.contains('delete-credential-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this credential?')) {
                try {
                    await api.deleteCredential(id);
                    await loadPasswords();
                } catch (error) {
                    alert(`Failed to delete credential: ${error.message}`);
                }
            }
        }
    });

    // Bulk delete selected credentials
    bulkDeleteBtn.addEventListener('click', async () => {
        const selected = Array.from(document.querySelectorAll('.select-credential:checked')).map(cb => cb.dataset.id);
        if (selected.length === 0) {
            alert('No credentials selected.');
            return;
        }
        if (confirm(`Are you sure you want to delete ${selected.length} selected credential(s)?`)) {
            try {
                // Use your API for bulk delete if available, otherwise delete one by one
                if (api.deleteCredentials) {
                    await api.deleteCredentials(selected);
                } else {
                    for (const id of selected) {
                        await api.deleteCredential(id);
                    }
                }
                await loadPasswords();
            } catch (error) {
                alert(`Failed to delete selected credentials: ${error.message}`);
            }
        }
    });

    // Function to delete a credential
    async function deleteCredentialHandler(credentialId) {
        try {
            await fetch(`/api/credentials/${credentialId}`, { 
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            await loadPasswords(); // Reload the list after deletion
        } catch (error) {
            console.error('Failed to delete credential:', error);
            alert('Failed to delete credential');
        }
    }

    // Function to filter credentials based on search input
    function filterCredentials(searchValue) {
        const filteredCredentials = allCredentials.filter(cred => 
            cred.website.toLowerCase().includes(searchValue.toLowerCase()) ||
            cred.username.toLowerCase().includes(searchValue.toLowerCase())
        );
        renderCredentials(filteredCredentials);
    }    // Add search functionality
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', function(e) {
            filterCredentials(e.target.value);
        });
    }

    // Load passwords when the page loads
    loadPasswords();
});

async function saveCredential(event) {
    event.preventDefault();
    
    const website = document.getElementById('website').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: website,  // Changed from credentialName to name to match server
                username,
                password
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Credential saved successfully!');
            document.getElementById('addPasswordForm').reset();
            // Switch to list tab and refresh credentials
            document.getElementById('tab-list').click();
            await loadPasswords();
        } else {
            throw new Error(data.error || 'Failed to save credential');
        }
    } catch (error) {
        alert('Error saving credential: ' + error.message);
    }
}

function togglePassword(button) {
    const passwordInput = button.previousElementSibling;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        button.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        button.textContent = 'Show';
    }
}
