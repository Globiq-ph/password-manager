async function testConnection() {
    const resultDiv = document.getElementById('result');
    try {
        // Replace with your actual backend API endpoint
        const response = await fetch('http://your-backend-url/api/test-connection');
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = 'Successfully connected to MongoDB!';
            resultDiv.style.color = 'green';
        } else {
            resultDiv.innerHTML = 'Failed to connect to MongoDB';
            resultDiv.style.color = 'red';
        }
    } catch (error) {
        resultDiv.innerHTML = 'Error: ' + error.message;
        resultDiv.style.color = 'red';
    }
}

// Initialize Microsoft Teams
microsoftTeams.initialize();

let credentials = [];

// Show/hide tabs
function showTab(tabName, button) {
    // Update button states
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    
    // Show selected tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    if (tabName === 'view') {
        loadCredentials();
    }
}

// Save credential
async function saveCredential(event) {
    event.preventDefault();
    
    const credentialName = document.getElementById('credentialName').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credentialName,
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Credential saved successfully!');
            document.getElementById('credentialForm').reset();
        } else {
            alert('Failed to save credential: ' + data.error);
        }
    } catch (error) {
        alert('Error saving credential: ' + error.message);
    }
}

// Load and display credentials
async function loadCredentials() {
    try {
        const response = await fetch('http://localhost:3000/api/credentials');
        const data = await response.json();
        
        if (data.success) {
            credentials = data.credentials;
            displayCredentials(credentials);
        } else {
            alert('Failed to load credentials: ' + data.error);
        }
    } catch (error) {
        alert('Error loading credentials: ' + error.message);
    }
}

// Display credentials in the view tab
function displayCredentials(credentials) {
    const container = document.getElementById('credentialsList');
    container.innerHTML = '';
    
    credentials.forEach(cred => {
        const credDiv = document.createElement('div');
        credDiv.className = 'credential-item';
        credDiv.innerHTML = `
            <h3>${cred.name}</h3>
            <p><strong>Username:</strong> ${cred.username}</p>
            <div class="password-field">
                <strong>Password:</strong>
                <input type="password" value="${cred.password}" readonly>
                <button onclick="togglePassword(this)">Show</button>
                <button onclick="copyToClipboard('${cred.password}')">Copy</button>
            </div>
            <p><small>Created: ${new Date(cred.createdAt).toLocaleDateString()}</small></p>
        `;
        container.appendChild(credDiv);
    });
}

// Generate password
function generateAndFillPassword() {
    const password = generatePassword(16);
    document.getElementById('password').value = password;
    updatePasswordStrength(password);
}

// Toggle password visibility
function togglePassword(button) {
    const input = button.previousElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = 'Hide';
    } else {
        input.type = 'password';
        button.textContent = 'Show';
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    } catch (err) {
        alert('Failed to copy to clipboard');
    }
}

// Search credentials
function searchCredentials(query) {
    query = query.toLowerCase();
    const filtered = credentials.filter(cred => 
        cred.name.toLowerCase().includes(query) ||
        cred.username.toLowerCase().includes(query)
    );
    displayCredentials(filtered);
}

// Event listeners
document.getElementById('password').addEventListener('input', function() {
    updatePasswordStrength(this.value);
});

document.getElementById('searchInput')?.addEventListener('input', function() {
    searchCredentials(this.value);
});
