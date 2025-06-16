document.addEventListener('DOMContentLoaded', () => {
    const addPasswordForm = document.getElementById('addPasswordForm');
    const passwordList = document.getElementById('passwordList');

    addPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const credential = {
                website: document.getElementById('website').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };
            await api.addCredential(credential);
            addPasswordForm.reset();
            loadPasswords();
            // Switch to list tab after adding
            document.getElementById('tab-list').click();
        } catch (error) {
            alert('Failed to add password. Please try again.');
        }
    });

    async function loadPasswords() {
        try {
            const credentials = await api.getCredentials();
            passwordList.innerHTML = Array.isArray(credentials) && credentials.length === 0
                ? '<p style="color:#800000;">No credentials saved yet.</p>'
                : (Array.isArray(credentials) ? credentials.map(cred => `
                    <div class="password-item">
                        <h3>${cred.website}</h3>
                        <p>Username: ${cred.username}</p>
                        <p>Password: <span class="masked">*******</span> <button class="show-btn" onclick="showPassword(this)" data-password="${cred.password}">Show</button></p>
                        <button class="delete-btn" onclick="deleteCredential('${cred._id}')">Delete</button>
                    </div>
                `).join('') : '<p>Failed to load passwords.</p>');
        } catch (error) {
            passwordList.innerHTML = '<p>Failed to load passwords.</p>';
        }
    }

    loadPasswords();
    // Also reload passwords when switching to list tab
    document.getElementById('tab-list').addEventListener('click', loadPasswords);
    window.deleteCredential = async function(id) {
        if (confirm('Are you sure you want to delete this credential?')) {
            await api.deleteCredential(id);
            loadPasswords();
        }
    };
});

function showPassword(button) {
    const passwordText = button.parentElement;
    const password = button.getAttribute('data-password');
    if (button.textContent === 'Show') {
        passwordText.innerHTML = `Password: <span>${password}</span> <button class="show-btn" onclick="showPassword(this)" data-password="${password}">Hide</button>`;
    } else {
        passwordText.innerHTML = `Password: <span class="masked">*******</span> <button class="show-btn" onclick="showPassword(this)" data-password="${password}">Show</button>`;
    }
}
