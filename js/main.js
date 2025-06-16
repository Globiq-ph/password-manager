document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // Password strength indicator
    function updatePasswordStrength(password) {
        let strength = 0;
        let message = '';

        // Length check
        if (password.length >= 8) strength += 25;
        // Contains number
        if (/\d/.test(password)) strength += 25;
        // Contains letter
        if (/[a-zA-Z]/.test(password)) strength += 25;
        // Contains special char
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        // Update the visual indicator
        strengthBar.style.width = strength + '%';
        
        if (strength <= 25) {
            strengthBar.style.backgroundColor = '#ff4444';
            message = 'Weak';
        } else if (strength <= 50) {
            strengthBar.style.backgroundColor = '#ffbb33';
            message = 'Fair';
        } else if (strength <= 75) {
            strengthBar.style.backgroundColor = '#00C851';
            message = 'Good';
        } else {
            strengthBar.style.backgroundColor = '#007E33';
            message = 'Strong';
        }
        
        strengthText.textContent = 'Password Strength: ' + message;
    }

    // Password input event listener
    passwordInput.addEventListener('input', (e) => {
        updatePasswordStrength(e.target.value);
    });

    // Add search bar and bulk delete button above the list
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

    let allCredentials = [];

    // Render credentials function
    function renderCredentials(credentials) {
        if (!Array.isArray(credentials) || credentials.length === 0) {
            passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
            return;
        }
        
        const credentialsHtml = credentials.map(cred => `
            <div class="password-item" id="credential-${cred._id}">
                <div class="credential-header">
                    <h3>${cred.name}</h3>
                    <input type="checkbox" class="select-credential" data-id="${cred._id}">
                </div>
                <div class="credential-body">
                    <p><strong>Username:</strong> ${cred.username}</p>
                    <div class="password-field">
                        <strong>Password:</strong> 
                        <span class="password-text">********</span>
                        <button class="show-password-btn" data-password="${cred.password}">Show Password</button>
                    </div>
                </div>
                <div class="credential-actions">
                    <button class="delete-credential-btn" data-id="${cred._id}">Delete</button>
                </div>
            </div>
        `).join('');

        passwordList.innerHTML = credentialsHtml;
    }

    // Search functionality
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allCredentials.filter(cred =>
                cred.name.toLowerCase().includes(query) ||
                cred.username.toLowerCase().includes(query)
            );
            renderCredentials(filtered);
        });
    }

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

    // Load passwords function
    async function loadPasswords() {
        try {
            const response = await fetch('/api/credentials');
            const credentials = await response.json();
            allCredentials = credentials; // Store credentials globally
            renderCredentials(credentials);
        } catch (error) {
            console.error('Error loading passwords:', error);
            passwordList.innerHTML = '<p style="color:red;">Error loading credentials. Please try again.</p>';
        }
    }

    // Save credential function
    async function saveCredential(event) {
        event.preventDefault();
        
        const name = document.getElementById('website').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    username,
                    password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Credential saved successfully!');
                document.getElementById('addPasswordForm').reset();
                await loadPasswords();
            } else {
                throw new Error(data.error || 'Failed to save credential');
            }
        } catch (error) {
            alert('Error saving credential: ' + error.message);
        }
    }

    // Add form submit handler
    addPasswordForm.addEventListener('submit', saveCredential);

    // Load passwords when page loads
    loadPasswords();
});

// Toggle password visibility
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

// Form validation
function validateForm() {
    const name = document.getElementById('website').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!name || !username || !password) {
        alert('Please fill in all fields (Name, Username, and Password)');
        return false;
    }
    return true;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const selectedTab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);
    
    selectedTab.classList.add('active');
    selectedContent.classList.add('active');

    if (tabName === 'viewCredentials') {
        loadCredentials();
    }
}

function loadCredentials() {
    fetch('/api/credentials', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(credentials => {
        renderCredentialsList(credentials);
    })
    .catch(error => {
        console.error('Error loading credentials:', error);
        showNotification('Error loading credentials', 'error');
    });
}

function renderCredentialsList(credentials) {
    const credentialsContainer = document.getElementById('credentialsList');
    credentialsContainer.innerHTML = '';
    
    credentials.forEach(cred => {
        const credentialCard = document.createElement('div');
        credentialCard.className = 'credential-card';
        credentialCard.innerHTML = `
            <button class="delete-btn" onclick="deleteCredential('${cred._id}')">
                <i class="fas fa-trash"></i>
            </button>
            <h3>${cred.name}</h3>
            <div class="field">
                <label>Username</label>
                <div>${cred.username}</div>
            </div>
            <div class="field">
                <label>Password</label>
                <div class="password-container">
                    <input type="password" value="${cred.password}" readonly>
                    <button onclick="togglePassword(this)" class="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        credentialsContainer.appendChild(credentialCard);
    });
}

function deleteCredential(credentialId) {
    if (confirm('Are you sure you want to delete this credential?')) {
        fetch(`/api/credentials/${credentialId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Credential deleted successfully', 'success');
                loadCredentials(); // Reload the credentials list
            } else {
                throw new Error('Failed to delete credential');
            }
        })
        .catch(error => {
            console.error('Error deleting credential:', error);
            showNotification('Error deleting credential', 'error');
        });
    }
}

// Add search functionality
document.getElementById('searchCredentials').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const credentialCards = document.querySelectorAll('.credential-card');
    
    credentialCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const username = card.querySelector('.field div').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || username.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});
