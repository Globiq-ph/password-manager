function generatePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

function checkPasswordStrength(password) {
    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password),
        noCommonWords: !/password|123456|qwerty/i.test(password)
    };
    
    Object.values(checks).forEach(check => {
        if (check) strength += 20;
    });
    
    // Extra points for length
    if (password.length >= 12) strength += 20;
    if (password.length >= 16) strength += 20;
    
    // Cap at 100
    return Math.min(100, strength);
}

function updatePasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthBar || !strengthText) return;
    
    strengthBar.style.width = strength + '%';
    const strengthText = document.getElementById('passwordStrengthText');
    
    // Update the strength bar
    strengthBar.style.width = `${strength}%`;
    
    // Update color based on strength
    if (strength < 40) {
        strengthBar.style.backgroundColor = '#ff4444';
        strengthText.textContent = 'Password Strength: Weak';
    } else if (strength < 70) {
        strengthBar.style.backgroundColor = '#ffbb33';
        strengthText.textContent = 'Password Strength: Medium';
    } else {
        strengthBar.style.backgroundColor = '#00C851';
        strengthText.textContent = 'Password Strength: Strong';
    }
    
    if (password === '') {
        strengthText.textContent = 'Password Strength: Not Set';
        strengthBar.style.width = '0';
    }
}
