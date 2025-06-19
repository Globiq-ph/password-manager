// Main application initialization
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API
    window.api = new Api();
    
    // Ensure user context
    Api.ensureUserContext();
    
    // Initialize tabs
    initializeTabs();
    
    // Check admin status and show/hide admin features
    await checkAdminStatus();

    // Load initial credentials
    await loadCredentials();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            document.querySelector(`#${tabId}`).classList.add('active');

            // Load tab-specific content
            if (tabId === 'adminPanel') {
                loadAdminContent();
            }
        });
    });
}

async function checkAdminStatus() {
    try {
        const { isAdmin, role } = await window.api.checkAdminStatus();
        const adminTab = document.querySelector('[data-tab="adminPanel"]');
        
        if (adminTab) {
            if (isAdmin) {
                adminTab.style.display = 'block';
                loadAdminContent();
            } else {
                adminTab.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

async function loadCredentials() {
    try {
        const credentials = await window.api.getAllCredentials();
        const container = document.getElementById('viewCredentials');
        
        if (!container) {
            console.error('Credentials container not found');
            return;
        }

        if (!credentials || credentials.length === 0) {
            container.innerHTML = '<p>No credentials found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'credentials-table';
        
        // Create table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${credentials.map(cred => `
                    <tr>
                        <td>${cred.project}</td>
                        <td>${cred.category}</td>
                        <td>${cred.name}</td>
                        <td>${cred.username}</td>
                        <td>
                            <button class="copy-btn" data-value="${cred.username}">Copy Username</button>
                            <button class="view-password-btn" data-id="${cred._id}">View Password</button>
                            <button class="delete-btn" data-id="${cred._id}">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.innerHTML = '';
        container.appendChild(table);

        // Add event listeners for buttons
        addCredentialButtonListeners();
    } catch (error) {
        console.error('Error loading credentials:', error);
        document.getElementById('viewCredentials').innerHTML = 
            '<p class="error">Error loading credentials. Please try again later.</p>';
    }
}

function addCredentialButtonListeners() {
    // Copy username
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const value = e.target.dataset.value;
            await navigator.clipboard.writeText(value);
            alert('Username copied to clipboard!');
        });
    });

    // View password
    document.querySelectorAll('.view-password-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
                const response = await window.api.getCredentialPassword(id);
                if (response.password) {
                    const confirmed = confirm('Do you want to copy the password to clipboard?');
                    if (confirmed) {
                        await navigator.clipboard.writeText(response.password);
                        alert('Password copied to clipboard!');
                    }
                }
            } catch (error) {
                console.error('Error viewing password:', error);
                alert('Error retrieving password');
            }
        });
    });

    // Delete credential
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this credential?')) {
                try {
                    await window.api.deleteCredential(id);
                    await loadCredentials(); // Reload the list
                } catch (error) {
                    console.error('Error deleting credential:', error);
                    alert('Error deleting credential');
                }
            }
        });
    });
}

async function loadAdminContent() {
    try {
        // Load activity logs
        const logsResponse = await fetch('/api/admin/activity-logs');
        const logs = await logsResponse.json();
        displayActivityLogs(logs);

        // Load admin users
        const usersResponse = await fetch('/api/admin/users');
        const users = await usersResponse.json();
        displayAdminUsers(users);
    } catch (error) {
        console.error('Error loading admin content:', error);
        showError('Failed to load admin content');
    }
}

function displayActivityLogs(logs) {
    const container = document.getElementById('activityLogs');
    if (!container) return;

    container.innerHTML = logs.map(log => `
        <div class="activity-log-item p-3 border-b">
            <div class="flex justify-between">
                <span class="font-medium">${log.action}</span>
                <span class="text-sm text-gray-500">${new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div class="text-sm text-gray-600">User: ${log.userId}</div>
            ${log.details ? `<pre class="text-xs mt-2 bg-gray-50 p-2 rounded">${JSON.stringify(log.details, null, 2)}</pre>` : ''}
        </div>
    `).join('');
}

function displayAdminUsers(users) {
    const container = document.getElementById('adminUsers');
    if (!container) return;

    container.innerHTML = users.map(user => `
        <div class="admin-user-item p-4 border rounded mb-2">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium">${user.userName}</h3>
                    <p class="text-sm text-gray-600">${user.userEmail}</p>
                </div>
                <div class="flex gap-2">
                    <select class="role-select form-select" data-user-id="${user.userId}">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                    <button class="toggle-status-btn btn ${user.isActive ? 'btn-success' : 'btn-danger'}"
                            data-user-id="${user.userId}"
                            data-active="${user.isActive}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </button>
                </div>
            </div>
            <div class="text-sm text-gray-500 mt-2">
                Last login: ${new Date(user.lastLogin).toLocaleString()}
            </div>
        </div>
    `).join('');

    // Add event listeners for admin user management
    container.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', updateAdminUser);
    });

    container.querySelectorAll('.toggle-status-btn').forEach(button => {
        button.addEventListener('click', toggleAdminStatus);
    });
}

async function updateAdminUser(event) {
    const userId = event.target.dataset.userId;
    const role = event.target.value;

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
        });

        if (!response.ok) throw new Error('Failed to update user');
        
        showSuccess('User updated successfully');
    } catch (error) {
        console.error('Error updating user:', error);
        showError('Failed to update user');
        // Reset the select to its previous value
        event.target.value = event.target.dataset.originalValue;
    }
}

async function toggleAdminStatus(event) {
    const userId = event.target.dataset.userId;
    const currentStatus = event.target.dataset.active === 'true';
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: !currentStatus })
        });

        if (!response.ok) throw new Error('Failed to update user status');
        
        // Update button state
        event.target.dataset.active = (!currentStatus).toString();
        event.target.textContent = !currentStatus ? 'Active' : 'Inactive';
        event.target.classList.toggle('btn-success');
        event.target.classList.toggle('btn-danger');
        
        showSuccess('User status updated successfully');
    } catch (error) {
        console.error('Error updating user status:', error);
        showError('Failed to update user status');
    }
}

function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/logout', { method: 'POST' });
            if (!response.ok) throw new Error('Logout failed');
            
            // Redirect to login page or home
            window.location.href = '/';
        } catch (error) {
            console.error('Error during logout:', error);
            showError('Failed to logout');
        }
    });
}

function initializeSessionChecker() {
    // Check session every 5 minutes
    setInterval(async () => {
        try {
            const response = await fetch('/api/admin/status');
            if (!response.ok) {
                // Session might be expired, redirect to login
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }, 5 * 60 * 1000);
}

function showSuccess(message) {
    // Implement toast or notification system
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast toast-success';
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    } else {
        alert(message); // Fallback
    }
}

function showError(message) {
    // Implement toast or notification system
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast toast-error';
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    } else {
        alert('Error: ' + message); // Fallback
    }
}
