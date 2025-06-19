// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initializeTabs();
    
    // Check admin status and show/hide admin features
    checkAdminStatus();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            const content = document.getElementById(tabId);
            if (content) {
                content.style.display = 'block';
                content.classList.add('active');
            }
        });
    });

    // Set initial active tab
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        const content = document.getElementById(tabId);
        if (content) {
            content.style.display = 'block';
            content.classList.add('active');
        }
    }
}

function checkAdminStatus() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminTab = document.querySelector('.admin-tab');
    const adminOnlyElements = document.querySelectorAll('.admin-only');

    if (isAdmin) {
        if (adminTab) adminTab.style.display = 'block';
        adminOnlyElements.forEach(el => el.style.display = 'block');
        document.body.classList.add('admin-view');
    } else {
        if (adminTab) adminTab.style.display = 'none';
        adminOnlyElements.forEach(el => el.style.display = 'none');
        document.body.classList.remove('admin-view');
    }
}
