class AdminManager {
    constructor() {
        this.api = window.api;
        this.initialize();
    }

    async initialize() {
        try {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            const adminTab = document.querySelector('.admin-tab');
            
            if (adminTab) {
                if (isAdmin) {
                    adminTab.style.display = 'block';
                    await this.loadAdminStats();
                } else {
                    adminTab.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error initializing admin manager:', error);
        }
    }

    async loadAdminStats() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: this.api.headers
            });
            
            if (!response.ok) {
                throw new Error('Failed to load admin stats');
            }

            const stats = await response.json();
            
            document.getElementById('totalCredentials').textContent = stats.totalCredentials || 0;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('activeSessions').textContent = stats.activeSessions || 0;
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    }

    async generateReport() {
        try {
            const response = await fetch('/api/admin/report', {
                headers: this.api.headers
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const report = await response.json();
            this.downloadReport(report);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        }
    }

    async viewLogs() {
        try {
            const response = await fetch('/api/admin/logs', {
                headers: this.api.headers
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }

            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Error viewing logs:', error);
            alert('Failed to view logs');
        }
    }

    downloadReport(report) {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `password-manager-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    displayLogs(logs) {
        const logWindow = window.open('', 'Logs', 'width=800,height=600');
        logWindow.document.write(`
            <html>
                <head>
                    <title>Admin Logs</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .log-entry { margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee; }
                        .timestamp { color: #666; }
                    </style>
                </head>
                <body>
                    <h2>System Logs</h2>
                    ${logs.map(log => `
                        <div class="log-entry">
                            <div class="timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                            <div>${log.message}</div>
                        </div>
                    `).join('')}
                </body>
            </html>
        `);
    }
}

// Initialize admin manager
window.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
