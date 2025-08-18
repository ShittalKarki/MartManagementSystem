// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    setupRoleSelector();
    setupFormSubmissions();
    setupAnimations();
}

// Role Selector Functionality
function setupRoleSelector() {
    const roleBtns = document.querySelectorAll('.role-btn');
    const customerForm = document.getElementById('customerLoginForm');
    const managerForm = document.getElementById('managerLoginForm');

    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            
            // Update active button
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            if (role === 'customer') {
                customerForm.classList.add('active');
                managerForm.classList.remove('active');
            } else if (role === 'manager') {
                managerForm.classList.add('active');
                customerForm.classList.remove('active');
            }
        });
    });
}

// Form Submissions
function setupFormSubmissions() {
    // Customer Login Form
    document.getElementById('customerLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleCustomerLogin();
    });

    // Manager Login Form
    document.getElementById('managerLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleManagerLogin();
    });

    // Signup Form
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignup();
    });
}

// Customer Login Handler
async function handleCustomerLogin() {
    const form = document.getElementById('customerLoginForm');
    const formData = new FormData(form);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
    };

    try {
        showLoading(form);
        
        // Simulate API call - replace with actual API endpoint
        const response = await simulateLogin(loginData, 'customer');
        
        if (response.success) {
            showSuccessMessage('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 1500);
        } else {
            showErrorMessage(response.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        showErrorMessage('An error occurred. Please try again.');
    } finally {
        hideLoading(form);
    }
}

// Manager Login Handler
async function handleManagerLogin() {
    const form = document.getElementById('managerLoginForm');
    const formData = new FormData(form);
    
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
    };

    try {
        showLoading(form);
        
        // Simulate API call - replace with actual API endpoint
        const response = await simulateLogin(loginData, 'manager');
        
        if (response.success) {
            showSuccessMessage('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'index.html'; // Manager dashboard
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

// Signup Handler
async function handleSignup() {
    const form = document.getElementById('signupForm');
    const formData = new FormData(form);
    
    const signupData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };

    try {
        showLoading(form);
        
        // Simulate API call - replace with actual API endpoint
        const response = await simulateSignup(signupData);
        
        if (response.success) {
            showSuccessMessage('Account created successfully! Please login.');
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            showErrorMessage(response.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        showErrorMessage('An error occurred. Please try again.');
    } finally {
        hideLoading(form);
    }
}

// Guest Access
function accessAsGuest() {
    showSuccessMessage('Welcome! You can browse products as a guest.');
    setTimeout(() => {
        window.location.href = 'customer-dashboard.html?guest=true';
    }, 1500);
}

// Form Navigation
function showSignupForm() {
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.getElementById('signupForm').classList.add('active');
    
    // Update subtitle
    document.querySelector('.subtitle').textContent = 'Create your Daily Deals account';
}

function showLoginForm() {
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.getElementById('customerLoginForm').classList.add('active');
    
    // Reset role selector to customer
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-role="customer"]').classList.add('active');
    
    // Update subtitle
    document.querySelector('.subtitle').textContent = 'Choose how you\'d like to access Daily Deals';
}

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
    
    // Demo credentials for testing
    if (role === 'customer') {
        if (loginData.email === 'customer@demo.com' && loginData.password === 'password') {
            return { success: true, message: 'Login successful' };
        }
    } else if (role === 'manager') {
        if (loginData.username === 'admin' && loginData.password === 'admin123') {
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
