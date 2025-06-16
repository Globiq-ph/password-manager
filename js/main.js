import { deleteCredential } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrengthBar');

    // Add search bar and bulk delete button above the list
    const searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.placeholder = 'Search credentials...';
    searchBar.id = 'searchBar';
    searchBar.style.marginBottom = '10px';
    passwordList.parentElement.insertBefore(searchBar, passwordList);

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
        try {
            console.log('Fetching credentials...');
            const credentials = await api.getCredentials();
            allCredentials = credentials;
            renderCredentials(credentials);
        } catch (error) {
            console.error('Failed to load passwords:', error);
            passwordList.innerHTML = '<p style="color:red;">Error loading passwords. Please try again later.</p>';
        }
    }

    function renderCredentials(credentials) {
        if (!Array.isArray(credentials) || credentials.length === 0) {
            passwordList.innerHTML = '<p style="color:#800000;">No credentials saved yet.</p>';
            return;
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

    // Add functionality for search bar, delete button, and select button

    // Function to delete a credential
    function deleteCredentialHandler(button) {
        const credentialId = button.parentElement.getAttribute('data-id');
        deleteCredential(credentialId)
            .then(() => {
                button.parentElement.remove();
            })
            .catch(() => {
                alert('Failed to delete credential');
            });
    }

    // Function to filter credentials based on search input
    function filterCredentials() {
        const searchValue = document.getElementById('searchBar').value.toLowerCase();
        const credentials = document.querySelectorAll('.credential-item');
        credentials.forEach(item => {
            const credentialText = item.textContent.toLowerCase();
            item.style.display = credentialText.includes(searchValue) ? '' : 'none';
        });
    }

    // Add event listeners for search bar and delete buttons
    window.onload = function() {
        const searchBar = document.getElementById('searchBar');
        if (searchBar) {
            searchBar.addEventListener('input', filterCredentials);
        }

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => deleteCredentialHandler(button));
        });
    };

    // Initial load
    loadPasswords();
});
