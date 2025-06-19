// Teams SDK initialization
microsoftTeams.app.initialize().then(() => {
    console.log('Microsoft Teams SDK initialized');
    initializeApp();
}).catch(error => {
    console.error('Error initializing Teams SDK:', error);
    initializeApp();
});

function verifyUserContext() {
    const userId = localStorage.getItem('teamsUserId');
    const userName = localStorage.getItem('teamsUserName');
    const userEmail = localStorage.getItem('teamsUserEmail');
    
    console.log('Current user context:', { userId, userName, userEmail });
    
    // Verify all user context values exist
    if (!userId || !userName || !userEmail) {
        console.warn('Missing user context, resetting to defaults');
        localStorage.setItem('teamsUserId', 'dev-user');
        localStorage.setItem('teamsUserName', 'Developer');
        localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
    }
    
    // Verify we can read the values back
    const verifyId = localStorage.getItem('teamsUserId');
    const verifyName = localStorage.getItem('teamsUserName');
    const verifyEmail = localStorage.getItem('teamsUserEmail');
    
    if (!verifyId || !verifyName || !verifyEmail) {
        console.error('Failed to verify user context after setting');
        throw new Error('User context verification failed');
    }
    
    console.log('User context verified:', {
        userId: verifyId,
        userName: verifyName,
        userEmail: verifyEmail
    });
}

function initializeApp() {
    // Check if user context already exists
    if (!localStorage.getItem('teamsUserId') || !localStorage.getItem('teamsUserName') || !localStorage.getItem('teamsUserEmail')) {
        console.log('Setting default user context');
        // Set default development values if not set
        localStorage.setItem('teamsUserId', 'dev-user');
        localStorage.setItem('teamsUserName', 'Developer');
        localStorage.setItem('teamsUserEmail', 'dev@globiq.com');
    }

    // Verify user context
    verifyUserContext();
    
    // Initialize UI elements
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');
    const adminTab = document.querySelector('.admin-tab');
    const adminPanel = document.getElementById('adminPanel');
    const adminSearch = document.getElementById('adminSearch');
    const adminStatusFilter = document.getElementById('adminStatusFilter');
    
    // Admin authentication
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;

            // Enhanced admin login validation
            const validation = validateAdminCredentials(username, password);
            if (!validation.isValid) {
                // Show error messages
                validation.errors.forEach(error => showLoginError(error));
                return;
            }

            // Store admin status
            localStorage.setItem('isAdmin', 'true');
            
            // Show admin tab
            if (adminTab) adminTab.style.display = 'block';
            
            // Hide login overlay
            if (adminLoginOverlay) adminLoginOverlay.style.display = 'none';
            
            // Switch to admin panel
            switchTab('adminPanel');
            
            showMessage('Admin login successful!', 'success');
            
            // Load admin data
            loadAdminDashboard();
        });
    }

    // Show admin login if clicking admin tab while not logged in
    if (adminTab) {
        adminTab.addEventListener('click', function(e) {
            if (!localStorage.getItem('isAdmin')) {
                e.preventDefault();
                adminLoginOverlay.style.display = 'flex';
            }
        });
    }

    // Admin search functionality
    if (adminSearch) {
        adminSearch.addEventListener('input', filterAdminCredentials);
    }

    // Admin status filter
    if (adminStatusFilter) {
        adminStatusFilter.addEventListener('change', filterAdminCredentials);
    }

    // Check if already logged in as admin
    if (localStorage.getItem('isAdmin') === 'true') {
        if (adminTab) adminTab.style.display = 'block';
    }

    // Initialize credential manager
    if (window.credentialManager && !window.credentialManager.isInitialized) {
        window.credentialManager.initialize();
    }

    // Initialize UI components
    initializeUIComponents();
}

function initializeUIComponents() {
    // Initialize password strength meter
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }

    // Save button
    const saveButton = document.getElementById('saveCredential');
    if (saveButton) {
        saveButton.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleSaveCredential();
        });
    }

    // Tab switching
    document.addEventListener('DOMContentLoaded', function() {
        // Set initial active tab
        const initialTab = document.querySelector('.tab.active');
        if (initialTab) {
            const tabName = initialTab.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        }
        
        // Add click event listeners to all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                if (tabName) {
                    switchTab(tabName);
                }
            });
        });
    });

    // Initialize first tab
    if (window.location.hash === '#viewCredentials') {
        switchTab('viewCredentials');
    } else {
        switchTab('addCredential');
    }
}

let adminCredentials = [];

// Admin Dashboard Functions
function loadAdminDashboard() {
    fetchAllCredentials().then(credentials => {
        adminCredentials = credentials;
        renderAdminCredentials(credentials);
        setupAdminFilters();
    }).catch(error => {
        console.error('Error loading admin dashboard:', error);
        showMessage('Failed to load credentials', 'error');
    });
}

function renderAdminCredentials(credentials) {
    const container = document.getElementById('adminCredentialsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (credentials.length === 0) {
        container.innerHTML = '<div class="admin-grid-row"><div class="admin-col">No credentials found</div></div>';
        return;
    }
    
    credentials.forEach(cred => {
        const row = document.createElement('div');
        row.className = 'admin-grid-row';
        
        row.innerHTML = `
            <div class="admin-col">${escapeHtml(cred.website)}</div>
            <div class="admin-col">${escapeHtml(cred.username)}</div>
            <div class="admin-col">${escapeHtml(cred.createdBy || 'Unknown')}</div>
            <div class="admin-col">
                <span class="status-badge status-${cred.status || 'active'}">${cred.status || 'Active'}</span>
            </div>
            <div class="admin-col admin-actions">
                <button class="admin-btn admin-btn-view" onclick="viewCredential('${cred._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="admin-btn admin-btn-delete" onclick="deleteCredential('${cred._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(row);
    });
}

function setupAdminFilters() {
    const searchInput = document.getElementById('adminSearch');
    const statusFilter = document.getElementById('adminStatusFilter');
    const logoutBtn = document.getElementById('adminLogout');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', () => filterAdminCredentials());
    }
    
    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', () => filterAdminCredentials());
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isAdmin');
            document.querySelector('.admin-tab').style.display = 'none';
            document.getElementById('adminLoginOverlay').style.display = 'block';
            switchTab('viewCredentials');
            showMessage('Admin logged out successfully', 'success');
        });
    }
}

function filterAdminCredentials() {
    const searchTerm = document.getElementById('adminSearch').value.toLowerCase();
    const statusFilter = document.getElementById('adminStatusFilter').value;
    
    const filtered = adminCredentials.filter(cred => {
        const matchesSearch = 
            cred.website.toLowerCase().includes(searchTerm) ||
            cred.username.toLowerCase().includes(searchTerm) ||
            (cred.createdBy && cred.createdBy.toLowerCase().includes(searchTerm));
            
        const matchesStatus = statusFilter === 'all' || 
            (cred.status || 'active').toLowerCase() === statusFilter.toLowerCase();
            
        return matchesSearch && matchesStatus;
    });
    
    renderAdminCredentials(filtered);
}

function viewCredential(id) {
    const credential = adminCredentials.find(c => c._id === id);
    if (!credential) return;
    
    // Create modal for viewing credential details
    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="overlay-content">
            <h2>Credential Details</h2>
            <div class="credential-details">
                <p><strong>Website:</strong> ${escapeHtml(credential.website)}</p>
                <p><strong>Username:</strong> ${escapeHtml(credential.username)}</p>
                <p><strong>Created By:</strong> ${escapeHtml(credential.createdBy || 'Unknown')}</p>
                <p><strong>Status:</strong> ${credential.status || 'Active'}</p>
                <p><strong>Created:</strong> ${new Date(credential.createdAt).toLocaleString()}</p>
            </div>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function deleteCredential(id) {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    
    try {
        await fetch(`/api/credentials/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'user-context': localStorage.getItem('teamsUserId')
            }
        });
        
        // Remove from local array and re-render
        adminCredentials = adminCredentials.filter(c => c._id !== id);
        renderAdminCredentials(adminCredentials);
        showMessage('Credential deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting credential:', error);
        showMessage('Failed to delete credential', 'error');
    }
}

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
    document.addEventListener('DOMContentLoaded', function() {
        // Set initial active tab
        const initialTab = document.querySelector('.tab.active');
        if (initialTab) {
            const tabName = initialTab.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        }
        
        // Add click event listeners to all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                if (tabName) {
                    switchTab(tabName);
                }
            });
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

    // Check if user is admin
    if (localStorage.getItem('isAdmin') === 'true') {
        const adminTab = document.querySelector('.admin-tab');
        if (adminTab) adminTab.style.display = 'block';
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
    console.log('Switching to tab:', tabName);
    
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(tabName);
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedContent && selectedTab) {
        selectedContent.style.display = 'block';
        selectedContent.classList.add('active');
        selectedTab.classList.add('active');
        
        // Handle specific tab actions
        if (tabName === 'adminPanel' && !document.querySelector('#adminCredentialsList .admin-grid-row')) {
            loadAdminDashboard();
        } else if (tabName === 'viewCredentials' && window.credentialManager) {
            window.credentialManager.loadCredentials();
        }
    } else {
        console.error('Tab not found:', tabName);
    }
}
        
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

const expectedUsername = 'john doe';
const expectedPassword = 'password';
    
let errors = [];
    
if (username.trim() === '') {
    errors.push('Username is required');
}
    
if (password === '') {
    errors.push('Password is required');
}
    
if (username !== expectedUsername || password !== expectedPassword) {
    errors.push('Invalid credentials');
}
    
return {
    isValid: errors.length === 0,
    errors: errors
};
}

// Show error message with animation
function showLoginError(message) {
    const loginForm = document.getElementById('adminLoginForm');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'login-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.animation = 'slideIn 0.3s ease';
    
    // Remove any existing error messages
    const existingError = loginForm.querySelector('.login-error');
    if (existingError) {
        existingError.remove();
    }
    
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
    
    // Remove error message after 3 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// Helper function to escape HTML to prevent XSS
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

// Enhanced admin login handling
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.toLowerCase();
    const password = document.getElementById('adminPassword').value;

    if (username === 'john doe' && password === 'password') {
        // Store admin status
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('teamsUserName', 'john doe');  // Important for API auth
        
        // Show admin tab and update UI
        const adminTab = document.querySelector('.admin-tab');
        const adminLoginOverlay = document.getElementById('adminLoginOverlay');
        
        if (adminTab) adminTab.style.display = 'block';
        if (adminLoginOverlay) adminLoginOverlay.style.display = 'none';
        
        // Switch to admin panel
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            adminPanel.style.display = 'block';
            adminPanel.classList.add('active');
        }
        
        // Update tab status
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === 'adminPanel') {
                tab.classList.add('active');
            }
        });
        
        showMessage('Admin login successful!', 'success');
        loadAdminDashboard();
    } else {
        showMessage('Invalid admin credentials!', 'error');
    }
}

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminTab = document.querySelector('.admin-tab');
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');

    // Check if user is already logged in as admin
    if (localStorage.getItem('isAdmin') === 'true') {
        if (adminTab) {
            adminTab.style.display = 'block';
        }
    }

    // Show admin login overlay when clicking admin tab while not logged in
    if (adminTab) {
        adminTab.addEventListener('click', function(e) {
            if (localStorage.getItem('isAdmin') !== 'true') {
                e.preventDefault();
                if (adminLoginOverlay) {
                    adminLoginOverlay.style.display = 'block';
                }
            }
        });
    }

    // Handle admin login
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    // Initialize tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    // Set initial tab
    const initialTab = document.querySelector('.tab.active');
    if (initialTab) {
        const tabName = initialTab.getAttribute('data-tab');
        if (tabName) {
            switchTab(tabName);
        }
    }

    // Initialize credential loading for view tab
    if (window.credentialManager) {
        window.credentialManager.initialize();
    }
});
