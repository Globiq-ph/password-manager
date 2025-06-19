// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initializeTabs();
    
    // Check admin status and show/hide admin features
    checkAdminStatus();

    // Initialize logout handler
    initializeLogout();

    // Initialize user session checker
    initializeSessionChecker();
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
        const response = await fetch('/api/admin/status');
        const data = await response.json();

        const adminTab = document.querySelector('[data-tab="adminPanel"]');
        const adminFeatures = document.querySelectorAll('.admin-only');

        if (data.isAdmin) {
            adminTab?.classList.remove('hidden');
            adminFeatures.forEach(el => el.classList.remove('hidden'));

            // Show super admin features if applicable
            if (data.role === 'super_admin') {
                document.querySelectorAll('.super-admin-only').forEach(el => el.classList.remove('hidden'));
            }
        } else {
            adminTab?.classList.add('hidden');
            adminFeatures.forEach(el => el.classList.add('hidden'));
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
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
