// Teams SDK initialization
microsoftTeams.app.initialize().then(() => {
    console.log('Microsoft Teams SDK initialized');
    
    // Get user context
    microsoftTeams.app.getContext().then((context) => {
        console.log('Got Teams context:', context);
        if (context.user) {
            // Store user info for API calls
            localStorage.setItem('teamsUserEmail', context.user.userPrincipalName);
            localStorage.setItem('teamsUserName', context.user.displayName);
            localStorage.setItem('teamsUserId', context.user.id);
        }
    }).catch(error => {
        console.error('Error getting Teams context:', error);
    });
}).catch(error => {
    console.error('Error initializing Teams SDK:', error);
    // Continue in web-only mode
    console.log('Running in web-only mode');
});

// Initialize Teams if available
if (window.microsoftTeams) {
    microsoftTeams.initialize();
}

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize UI elements
    const passwordInput = document.getElementById('password');
    const saveButton = document.getElementById('saveCredential');

    // Password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }

    // Save button
    if (saveButton) {
        saveButton.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleSaveCredential();
        });
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    // Initialize credential manager
    if (window.credentialManager) {
        try {
            await window.credentialManager.initialize();
        } catch (error) {
            console.error('Error initializing credential manager:', error);
        }
    }

    // Initialize credential list if we're on the view tab
    if (window.location.hash === '#viewCredentials') {
        switchTab('viewCredentials');
    } else {
        switchTab('addCredential');
    }
});

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    strengthBar.style.width = strength + '%';
    
    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#eee';
        strengthText.textContent = 'Password Strength: Not Set';
    } else if (strength <= 25) {
        strengthBar.style.backgroundColor = '#ff4444';
        strengthText.textContent = 'Password Strength: Weak';
    } else if (strength <= 50) {
        strengthBar.style.backgroundColor = '#ffbb33';
        strengthText.textContent = 'Password Strength: Fair';
    } else if (strength <= 75) {
        strengthBar.style.backgroundColor = '#00C851';
        strengthText.textContent = 'Password Strength: Good';
    } else {
        strengthBar.style.backgroundColor = '#007E33';
        strengthText.textContent = 'Password Strength: Strong';
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    const selectedTabButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedTab && selectedTabButton) {
        selectedTab.style.display = 'block';
        selectedTab.classList.add('active');
        selectedTabButton.classList.add('active');
        
        // Load credentials if viewing credentials tab
        if (tabName === 'viewCredentials') {
            loadCredentialsList();
        }
    }
}

async function handleSaveCredential() {
    // Get form data
    const nameInput = document.getElementById('name');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    try {
        // Validate inputs
        if (!nameInput || !usernameInput || !passwordInput) {
            throw new Error('Required form elements not found');
        }

        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!name || !username || !password) {
            throw new Error('Please fill in all fields');
        }

        // Save credential
        await api.addCredential({ name, username, password });
        
        // Show success message
        showMessage('Credential saved successfully!', 'success');
        
        // Clear form
        nameInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        updatePasswordStrength('');
        
        // Switch to view tab
        switchTab('viewCredentials');

    } catch (error) {
        console.error('Error saving credential:', error);
        showMessage(error.message, 'error');
    }
}

async function loadCredentialsList() {
    const listElement = document.getElementById('passwordList');
    if (!listElement) return;

    try {
        listElement.innerHTML = '<p class="loading">Loading credentials...</p>';
        
        const credentials = await api.getCredentials();
        
        if (!credentials || credentials.length === 0) {
            listElement.innerHTML = '<p class="no-results">No credentials found</p>';
            return;
        }

        // Render credentials
        listElement.innerHTML = credentials.map(cred => `
            <div class="credential-item">
                <div class="credential-content">
                    <h3>${escapeHtml(cred.name)}</h3>
                    <p><strong>Username:</strong> ${escapeHtml(cred.username)}</p>
                    <p>
                        <strong>Password:</strong> 
                        <span class="password-hidden" id="pwd-${escapeHtml(cred._id)}">********</span>
                        <button class="btn btn-show" onclick="togglePassword('${escapeHtml(cred._id)}')">
                            Show/Hide
                        </button>
                    </p>
                </div>
                <div class="credential-actions">
                    <button class="btn btn-delete" onclick="deleteCredential('${escapeHtml(cred._id)}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading credentials:', error);
        listElement.innerHTML = `<p class="error">Error loading credentials: ${error.message}</p>`;
    }
}

function showMessage(message, type = 'info') {
    const alertBox = document.querySelector('.alert');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Functions used by inline onclick handlers
window.togglePassword = function(id) {
    const pwdElement = document.getElementById(`pwd-${id}`);
    if (!pwdElement) return;

    if (pwdElement.textContent === '********') {
        // Fetch the actual password from the server
        api.getCredentials().then(credentials => {
            const credential = credentials.find(c => c._id === id);
            if (credential) {
                pwdElement.textContent = credential.password;
                pwdElement.classList.remove('password-hidden');
                pwdElement.classList.add('password-visible');
            }
        });
    } else {
        pwdElement.textContent = '********';
        pwdElement.classList.remove('password-visible');
        pwdElement.classList.add('password-hidden');
    }
};

window.deleteCredential = async function(id) {
    if (!id) return;

    if (confirm('Are you sure you want to delete this credential?')) {
        try {
            await api.deleteCredential(id);
            showMessage('Credential deleted successfully', 'success');
            loadCredentialsList();
        } catch (error) {
            console.error('Error deleting credential:', error);
            showMessage(error.message, 'error');
        }
    }
};
