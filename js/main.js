document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrengthBar');
    
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

    // Function to render credentials
    function renderCredentials(credentials) {
        if (!Array.isArray(credentials) || credentials.length === 0) {
            passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
            return;
        }
        
        passwordList.innerHTML = credentials.map(cred => `
            <div class="password-item" id="credential-${cred._id}">
                <input type="checkbox" class="select-credential" data-id="${cred._id}" style="margin-right:8px;">
                <h3 style="display:inline;">${cred.name}</h3>
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
