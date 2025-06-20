// QR code generation using qrious (https://github.com/neocotic/qrious)
// You can use a CDN for qrious or qrcodejs

(function() {
    function generateCredentialQR() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const project = document.getElementById('project').value;
        const category = document.getElementById('category').value;
        const name = document.getElementById('name').value;
        const notes = document.getElementById('notes').value;
        if (!username || !password) {
            alert('Please enter both username and password to generate QR code.');
            return;
        }
        const qrData = JSON.stringify({ project, category, name, username, password, notes });
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = '';
        const qr = new QRious({
            value: qrData,
            size: 200,
            background: 'white',
            foreground: '#2563eb',
        });
        const img = document.createElement('img');
        img.src = qr.toDataURL();
        img.alt = 'Credential QR Code';
        img.style.margin = '12px auto';
        img.style.display = 'block';
        qrContainer.appendChild(img);
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download QR Code';
        downloadBtn.style.marginTop = '10px';
        downloadBtn.onclick = function() {
            const a = document.createElement('a');
            a.href = img.src;
            a.download = `${name || 'credential'}-qr.png`;
            a.click();
        };
        qrContainer.appendChild(downloadBtn);
    }
    document.addEventListener('DOMContentLoaded', function() {
        const qrBtn = document.getElementById('generateQR');
        if (qrBtn) {
            qrBtn.addEventListener('click', generateCredentialQR);
        }
    });
})();
