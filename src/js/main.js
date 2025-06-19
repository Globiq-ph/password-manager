// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing application...');
    
    try {
        // Initialize credential manager
        window.credentialManager.initialize();
        
        // Initialize Teams (if available)
        if (typeof microsoftTeams !== 'undefined') {
            microsoftTeams.app.initialize().then(() => {
                console.log('Microsoft Teams SDK initialized');
            }).catch(error => {
                console.error('Error initializing Teams SDK:', error);
            });
        }
        
        // Add event listeners
        setupEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Failed to initialize application');
    }
}

function setupEventListeners() {
    // Add Credential Form
    const addForm = document.getElementById('addCredentialForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddCredential);
    }
    
    // Search Input
    const searchInput = document.getElementById('searchCredentials');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filters
    const projectFilter = document.getElementById('projectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', handleFilter);
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilter);
    }
}

async function handleAddCredential(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const credential = {
            name: formData.get('name'),
            username: formData.get('username'),
            password: formData.get('password'),
            project: formData.get('project'),
            category: formData.get('category'),
            url: formData.get('url'),
            notes: formData.get('notes')
        };
        
        await window.credentialManager.addCredential(credential);
        form.reset();
        
    } catch (error) {
        console.error('Error adding credential:', error);
        showError('Failed to add credential');
    }
}

function handleSearch(event) {
    window.credentialManager.filterCredentials();
}

function handleFilter() {
    window.credentialManager.filterCredentials();
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    } else {
        alert(message);
    }
}
