// Import Microsoft Teams SDK
import * as microsoftTeams from "@microsoft/teams-js";

// Initialize Teams
microsoftTeams.app.initialize().then(() => {
    console.log("Microsoft Teams initialized");
    // Get context
    microsoftTeams.app.getContext().then((context) => {
        console.log("Teams Context:", context);
        // Store user info if needed
        if (context.user) {
            localStorage.setItem('teamsUserEmail', context.user.userPrincipalName);
            localStorage.setItem('teamsUserName', context.user.displayName);
        }
    });
}).catch((error) => {
    console.error("Error initializing Microsoft Teams:", error);
    // Fall back to regular web mode
    console.log("Running in web browser mode");
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize password strength elements
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');

    // Add event listeners for tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Initialize password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    // Initialize search functionality
    const searchInput = document.getElementById('searchCredentials');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Start with Add Credential tab
    switchTab('addCredential');
});

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    let strength = 0;
    
    // Calculate strength
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    // Update UI
    strengthBar.style.width = `${strength}%`;
    
    if (password === '') {
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
    console.log('Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `${tabName}Tab`) {
            content.classList.add('active');
            if (tabName === 'viewCredentials') {
                loadCredentials();
            }
        } else {
            content.classList.remove('active');
        }
    });
}

async function saveCredential() {
    try {
        const name = document.getElementById('website').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!name || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        const credential = { name, username, password };
        console.log('Saving credential:', { name, username });

        const result = await api.addCredential(credential);
        console.log('Save result:', result);
        
        alert('Credential saved successfully!');
        clearForm();
        
        // Reload credentials and switch to view tab
        await loadCredentials();
        switchTab('viewCredentials');
    } catch (error) {
        console.error('Error saving credential:', error);
        alert('Error saving credential: ' + error.message);
    }
}

function clearForm() {
    document.getElementById('website').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    updatePasswordStrength('');
}

async function loadCredentials() {
    try {
        console.log('Loading credentials...');
        const credentials = await api.getCredentials();
        console.log('Loaded credentials:', credentials);
        
        if (!Array.isArray(credentials)) {
            console.error('Expected array of credentials, got:', typeof credentials);
            throw new Error('Invalid credentials data received');
        }
        
        renderCredentialsList(credentials);
        return true;
    } catch (error) {
        console.error('Error loading credentials:', error);
        document.getElementById('credentialsList').innerHTML = 
            '<div class="error-message">Error loading credentials. Please try again.</div>';
        return false;
    }
}

function renderCredentialsList(credentials) {
    const container = document.getElementById('credentialsList');
    if (!container) {
        console.error('Credentials container not found');
        return;
    }
    
    container.innerHTML = '';
    console.log('Rendering credentials:', credentials);

    if (!credentials || credentials.length === 0) {
        container.innerHTML = '<div class="no-credentials">No credentials saved yet.</div>';
        return;
    }

    credentials.forEach(cred => {
        try {
            if (!cred._id || !cred.name || !cred.username) {
                console.error('Invalid credential object:', cred);
                return;
            }

            const card = document.createElement('div');
            card.className = 'credential-card';
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteCredential('${escapeHtml(cred._id)}')">
                    <i class="fas fa-trash"></i>
                </button>
                <h3>${escapeHtml(cred.name)}</h3>
                <div class="field">
                    <label>Username</label>
                    <div>${escapeHtml(cred.username)}</div>
                </div>
                <div class="field">
                    <label>Password</label>
                    <div class="password-container">
                        <input type="password" value="${escapeHtml(cred.password || '')}" readonly>
                        <button class="toggle-password" onclick="togglePassword(this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        } catch (error) {
            console.error('Error rendering credential:', error, cred);
        }
    });
}

async function deleteCredential(id) {
    if (!confirm('Are you sure you want to delete this credential?')) {
        return;
    }

    try {
        await api.deleteCredential(id);
        alert('Credential deleted successfully');
        loadCredentials();
    } catch (error) {
        console.error('Error deleting credential:', error);
        alert('Error deleting credential: ' + error.message);
    }
}

function togglePassword(button) {
    const input = button.parentElement.querySelector('input');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.credential-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const username = card.querySelector('.field div').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || username.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
