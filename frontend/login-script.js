/* MartMS */
// Admin login page — form handling and optional social auth.
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    setupAdminFormSubmission();
    setupSocialAuth();
    setupAnimations();
    setupPasswordUX();
    setupRememberUsername();
}

// Admin form submission only
function setupAdminFormSubmission() {
    const adminForm = document.getElementById('adminLoginForm');
    if (!adminForm) return;
    adminForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAdminLogin();
    });
}

// Admin login handler
async function handleAdminLogin() {
    const form = document.getElementById('adminLoginForm');
    const formData = new FormData(form);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        showLoading(form);
        const response = await simulateLogin(loginData, 'manager');
        if (response.success) {
            showSuccessMessage('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Manager dashboard
            }, 1500);
        } else {
            showErrorMessage(response.message || 'Invalid credentials.');
        }
    } catch (error) {
        showErrorMessage('An error occurred. Please try again.');
    } finally {
        hideLoading(form);
    }
}

// Firebase Social Auth (Google, Facebook, Apple via popup)
function setupSocialAuth() {
    // Configure your Firebase project here
    const firebaseConfig = {
        apiKey: window.FB_API_KEY || 'YOUR_API_KEY',
        authDomain: window.FB_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
        projectId: window.FB_PROJECT_ID || 'YOUR_PROJECT_ID',
        appId: window.FB_APP_ID || 'YOUR_APP_ID',
    };

    // Only proceed if placeholders are replaced or env is provided
    const isConfigured = Object.values(firebaseConfig).every(v => v && !String(v).includes('YOUR_'));
    if (!isConfigured) {
        // Bind basic disabled handlers to inform configuration required
        ['googleSignIn','facebookSignIn','appleSignIn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => showErrorMessage('Social login not configured. Please set Firebase config.'));
        });
        return;
    }

    // Load Firebase SDKs dynamically for vanilla HTML
    const scripts = [
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'
    ];
    Promise.all(scripts.map(loadScript)).then(() => {
        // Initialize
        const app = window.firebase.initializeApp(firebaseConfig);
        const auth = window.firebase.auth();
        const apiBase = (window.API_BASE_URL || '').replace(/\/$/, '');

        // Providers
        const googleProvider = new window.firebase.auth.GoogleAuthProvider();
        const facebookProvider = new window.firebase.auth.FacebookAuthProvider();
        const appleProvider = new window.firebase.auth.OAuthProvider('apple.com');
        const microsoftProvider = new window.firebase.auth.OAuthProvider('microsoft.com');

        const verifyAdmin = async (idToken) => {
            const resp = await fetch(`${apiBase}/api/auth/verify-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            if (!resp.ok) {
                const err = await safeJson(resp);
                throw new Error(err?.message || 'Verification failed');
            }
            const data = await resp.json();
            if (!data.success) throw new Error(data.message || 'Not an admin');
            return data;
        };

        const attach = (id, provider, opts = {}) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', async () => {
                try {
                    showLoading(btn.closest('form'));
                    const result = await auth.signInWithPopup(provider);
                    const user = result.user;
                    if (!user) throw new Error('No user returned');
                    const idToken = await user.getIdToken();
                    await verifyAdmin(idToken);
                    showSuccessMessage('Login successful! Redirecting...');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
                } catch (err) {
                    showErrorMessage(err.message || 'Social login failed');
                } finally {
                    hideLoading(btn.closest('form'));
                }
            });
        };

        attach('googleSignIn', googleProvider);
        attach('facebookSignIn', facebookProvider);
        attach('appleSignIn', appleProvider);
        attach('microsoftSignIn', microsoftProvider);
    }).catch(() => {
        ['googleSignIn','facebookSignIn','appleSignIn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => showErrorMessage('Failed to load auth SDK.'));
        });
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function safeJson(resp) {
    try { return await resp.json(); } catch { return null; }
}

// Password and Remember Username UX
function setupPasswordUX() {
    const pwd = document.getElementById('adminPassword');
    const toggle = document.getElementById('togglePassword');
    const strength = document.getElementById('passwordStrength');
    const caps = document.getElementById('capsWarning');
    if (!pwd) return;

    // toggle visibility
    if (toggle) {
        toggle.addEventListener('click', () => {
            const show = pwd.type === 'password';
            pwd.type = show ? 'text' : 'password';
            toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // strength indicator
    const computeStrength = (value) => {
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        return Math.min(score, 4);
    };

    pwd.addEventListener('input', () => {
        const level = computeStrength(pwd.value);
        if (strength) {
            strength.dataset.level = String(level);
            strength.setAttribute('aria-hidden', 'false');
        }
    });

    // caps lock warning
    pwd.addEventListener('keydown', (e) => {
        if (!caps) return;
        const isCaps = e.getModifierState && e.getModifierState('CapsLock');
        caps.style.display = isCaps ? 'inline-flex' : 'none';
    });
    pwd.addEventListener('blur', () => { if (caps) caps.style.display = 'none'; });
}

function setupRememberUsername() {
    const input = document.getElementById('adminUsername');
    const remember = document.getElementById('rememberUsername');
    if (!input || !remember) return;

    // load
    const saved = localStorage.getItem('admin_username');
    if (saved) {
        input.value = saved;
        remember.checked = true;
    }

    // save on change / submit
    const form = document.getElementById('adminLoginForm');
    const persist = () => {
        if (remember.checked) {
            localStorage.setItem('admin_username', input.value.trim());
        } else {
            localStorage.removeItem('admin_username');
        }
    };
    input.addEventListener('change', persist);
    if (form) form.addEventListener('submit', persist);
}

// Remove guest/sign-up/navigation features; admin only

// Loading States
function showLoading(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

function hideLoading(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

// Message Display
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(messageDiv);

    // Show message
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);

    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 5000);
}


// Animations
function setupAnimations() {
    // Add entrance animations
    const elements = document.querySelectorAll('.logo, .form-container, .floating-icon');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Add hover effects to form inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

// Simulate API calls (replace with actual API endpoints)
async function simulateLogin(loginData, role) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo credentials for testing - more flexible validation
    if (role === 'customer') {
        // Accept the demo credentials or any email with 'customer' in it and 'pass' as password
        if ((loginData.email === 'customer@demo.com' && loginData.password === 'password') ||
            (loginData.email && loginData.email.includes('customer') && loginData.password === 'password') ||
            (loginData.email && loginData.password && loginData.password.length >= 4)) {
            return { success: true, message: 'Login successful' };
        }
    } else if (role === 'manager') {
        // Accept the demo credentials or any username with 'admin' in it and 'admin' as password
        if ((loginData.username === 'admin' && loginData.password === 'admin123') ||
            (loginData.username && loginData.username.includes('admin') && loginData.password === 'admin123') ||
            (loginData.username && loginData.password && loginData.password.length >= 5)) {
            return { success: true, message: 'Login successful' };
        }
    }
    
    return { success: false, message: 'Invalid credentials' };
}

async function simulateSignup(signupData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation
    if (!signupData.name || !signupData.email || !signupData.phone || !signupData.password) {
        return { success: false, message: 'Please fill in all fields' };
    }
    
    if (signupData.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    return { success: true, message: 'Account created successfully' };
}

// Add message toast styles dynamically
const style = document.createElement('style');
style.textContent = `
    .message-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #4a5568;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
    }
    
    .message-toast.show {
        transform: translateX(0);
    }
    
    .message-toast.success {
        border-left: 4px solid #48bb78;
    }
    
    .message-toast.success i {
        color: #48bb78;
    }
    
    .message-toast.error {
        border-left: 4px solid #f56565;
    }
    
    .message-toast.error i {
        color: #f56565;
    }
    
    .message-toast i {
        font-size: 1.2rem;
    }
    
    .message-toast span {
        font-size: 0.9rem;
        font-weight: 500;
    }
`;
document.head.appendChild(style);