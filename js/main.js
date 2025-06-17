// Initialize Microsoft Teams SDK if available
if (window.microsoftTeams) {
    microsoftTeams.initialize();
    microsoftTeams.getContext((context) => {
        console.log("Teams Context:", context);
        // Store user info if needed
        if (context.user) {
            localStorage.setItem('teamsUserEmail', context.user.userPrincipalName);
            localStorage.setItem('teamsUserName', context.user.displayName);
        }
    });
}

let credentialManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize credential manager
    credentialManager = new CredentialManager();
    window.credentialManager = credentialManager;

    // Initialize UI elements
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');
    const saveButton = document.getElementById('saveCredential');
    const searchInput = document.getElementById('searchCredentials');

    // Setup password strength indicator
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    // Setup tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = e.target.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    // Setup save credential
    if (saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await saveCredential();
                switchTab('viewCredentials');
            } catch (error) {
                console.error('Error saving credential:', error);
                showAlert('Failed to save credential: ' + error.message, 'error');
            }
        });
    }

    // Setup search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            credentialManager.filterCredentials();
        });
    }

    // Start with Add Credential tab
    switchTab('addCredential');
});

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthBar || !strengthText || !password) {
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthText) strengthText.textContent = 'Password Strength: Not Set';
        return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    strengthBar.style.width = `${strength}%`;
    
    if (strength <= 25) {
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
    // First hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Make clicked tab active
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Load credentials if viewing credentials tab
    if (tabName === 'viewCredentials' && credentialManager) {
        credentialManager.loadCredentials();
    }
}

async function saveCredential() {
    const nameInput = document.getElementById('name');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!nameInput || !usernameInput || !passwordInput) {
        throw new Error('Required form elements not found');
    }

    if (!nameInput.value || !usernameInput.value || !passwordInput.value) {
        throw new Error('Please fill in all fields');
    }

    const credential = {
        name: nameInput.value.trim(),
        username: usernameInput.value.trim(),
        password: passwordInput.value
    };

    try {
        await api.addCredential(credential);
        nameInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        showAlert('Credential saved successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error saving credential:', error);
        throw error;
    }
}

function showAlert(message, type = 'info') {
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
