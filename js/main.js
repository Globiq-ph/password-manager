// Teams SDK initialization
microsoftTeams.app.initialize().then(() => {
    console.log('Microsoft Teams SDK initialized');
    
    // Set default development values first
    localStorage.setItem('teamsUserId', 'dev-user');
    localStorage.setItem('teamsUserName', 'Developer');
    localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
    
    // Get user context
    microsoftTeams.app.getContext().then((context) => {
        console.log('Got Teams context:', context);
        if (context.user) {
            // Store user info for API calls
            localStorage.setItem('teamsUserEmail', context.user.userPrincipalName);
            localStorage.setItem('teamsUserName', context.user.displayName);
            localStorage.setItem('teamsUserId', context.user.id);

            // For development, always set as admin
            const isAdmin = true;
            window.credentialManager.isAdmin = isAdmin;

            // Initialize UI with role information
            if (isAdmin) {
                document.body.classList.add('has-admin-rights');
                const roleSelector = document.getElementById('roleSelector');
                if (roleSelector) roleSelector.style.display = 'flex';
                const adminTab = document.querySelector('.tab[data-tab="adminPanel"]');
                if (adminTab) adminTab.style.display = 'block';
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'block';
                });
            }
        }
    }).catch(error => {
        console.error('Error getting Teams context:', error);
        // Keep development values set earlier
    });
}).catch(error => {
    console.error('Error initializing Teams SDK:', error);
    // Keep development values set earlier
});

// Initialize Teams if available
if (window.microsoftTeams) {
    microsoftTeams.initialize();
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    const passwordInput = document.getElementById('password');
    const saveButton = document.getElementById('saveCredential');
    const projectInput = document.getElementById('project');
    const categoryInput = document.getElementById('category');
    const statusSelect = document.getElementById('status');
    const isAdminCheckbox = document.getElementById('isAdmin');

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

    // Role switching
    document.querySelectorAll('.role-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const role = this.dataset.role;
            document.querySelectorAll('.role-button').forEach(btn => 
                btn.classList.toggle('active', btn === this));
            document.body.classList.toggle('admin-mode', role === 'admin');
            if (window.credentialManager) {
                window.credentialManager.switchRole(role);
            }
        });
    });

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

    // Initialize credential manager if not already initialized
    if (window.credentialManager && !window.credentialManager.isInitialized) {
        window.credentialManager.initialize();
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
        if (tabName === 'viewCredentials' && window.credentialManager) {
            window.credentialManager.loadCredentials();
        }
    }
}

async function handleSaveCredential() {
    console.log('Starting save credential process...');
    const saveButton = document.getElementById('saveCredential');
    if (saveButton) saveButton.disabled = true;

    try {
        // Get form elements
        const nameInput = document.getElementById('name');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const projectInput = document.getElementById('project');
        const categoryInput = document.getElementById('category');
        const statusSelect = document.getElementById('status');
        const isAdminCheckbox = document.getElementById('isAdmin');

        // Verify user context exists
        const userContext = {
            id: localStorage.getItem('teamsUserId'),
            name: localStorage.getItem('teamsUserName'),
            email: localStorage.getItem('teamsUserEmail')
        };

        console.log('User context:', userContext);

        // Set default values if missing
        if (!userContext.id || !userContext.name || !userContext.email) {
            console.log('Setting default user context...');
            localStorage.setItem('teamsUserId', 'dev-user');
            localStorage.setItem('teamsUserName', 'Developer');
            localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
            userContext.id = 'dev-user';
            userContext.name = 'Developer';
            userContext.email = 'dev@globiq.com';
        }

        // Check if elements exist
        if (!nameInput || !usernameInput || !passwordInput) {
            throw new Error('Required form elements not found');
        }

        // Get values and validate
        const formData = {
            name: nameInput.value.trim(),
            username: usernameInput.value.trim(),
            password: passwordInput.value,
            project: (projectInput?.value || '').trim() || 'Default',
            category: (categoryInput?.value || '').trim() || 'General',
            status: statusSelect?.value || 'active',
            isAdmin: isAdminCheckbox?.checked || false,
            ownerId: userContext.id,
            ownerName: userContext.name,
            ownerEmail: userContext.email
        };

        console.log('Form data:', { 
            ...formData, 
            password: formData.password ? '********' : undefined 
        });

        // Validate required fields
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.username) missingFields.push('Username');
        if (!formData.password) missingFields.push('Password');

        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        console.log('Sending data to API...');
        const savedCredential = await api.addCredential(formData);
        console.log('Credential saved:', savedCredential._id);

        // Show success message
        showMessage('Credential saved successfully!', 'success');
        
        // Clear form
        nameInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        if (projectInput) projectInput.value = '';
        if (categoryInput) categoryInput.value = '';
        if (statusSelect) statusSelect.value = 'active';
        if (isAdminCheckbox) isAdminCheckbox.checked = false;
        
        // Reset password strength meter
        updatePasswordStrength('');
        
        // Reload credentials list and switch to view tab
        if (window.credentialManager) {
            window.credentialManager.loadCredentials();
        }
        switchTab('viewCredentials');

    } catch (error) {
        console.error('Error in handleSaveCredential:', error);
        showMessage(`Failed to save credential: ${error.message}`, 'error');
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
}

function showMessage(message, type = 'info') {
    const alertBox = document.querySelector('.alert');
    if (!alertBox) {
        console.error('Alert box element not found');
        return;
    }

    // Clear any existing timeout
    if (alertBox._timeoutId) {
        clearTimeout(alertBox._timeoutId);
    }

    // Configure alert box
    alertBox.className = `alert ${type}`;
    alertBox.innerHTML = `
        <div class="alert-content">
            <span class="alert-message">${message}</span>
            <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
        </div>
    `;
    alertBox.style.display = 'flex';

    // For errors, scroll to alert box and don't auto-hide
    if (type === 'error') {
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Auto-hide after 5 seconds for non-errors
        alertBox._timeoutId = setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

function escapeHtml(unsafe) {
    return unsafe
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
