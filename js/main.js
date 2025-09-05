// Main page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in and redirect
    if (authManager.isLoggedIn()) {
        authManager.redirectToDashboard();
        return;
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Handle signup user type change (show/hide admin code field and teacher selection)
    const signupUserType = document.getElementById('signupUserType');
    if (signupUserType) {
        signupUserType.addEventListener('change', toggleSignupFields);
    }

    // Real-time username availability check
    const signupUsername = document.getElementById('signupUsername');
    if (signupUsername) {
        signupUsername.addEventListener('blur', checkUsernameAvailability);
    }
});

function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const password = formData.get('password');
    const userType = formData.get('userType');

    // Validate input
    if (!username || !password || !userType) {
        notificationManager.error('Please fill in all fields');
        return;
    }

    // Attempt login
    if (authManager.login(username, password, userType)) {
        // Success - redirect to appropriate dashboard
        authManager.redirectToDashboard();
    } else {
        notificationManager.error('Invalid credentials. Try the demo accounts or create a student account with any username/password.');
    }
}

function fillDemo(type) {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const userTypeField = document.getElementById('userType');

    if (type === 'student') {
        usernameField.value = 'student';
        passwordField.value = 'demo123';
        userTypeField.value = 'student';
    } else if (type === 'admin') {
        usernameField.value = 'admin';
        passwordField.value = 'admin123';
        userTypeField.value = 'admin';
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const userType = formData.get('userType');
    const adminCode = formData.get('adminCode') || '';
    const teacherId = formData.get('teacherId') || '';

    // Attempt signup
    const result = authManager.signup(username, password, confirmPassword, userType, adminCode, teacherId);
    
    if (result.success) {
        notificationManager.success(result.message);
        // Switch back to login form
        showLogin();
        // Pre-fill login form with new user credentials
        document.getElementById('username').value = username;
        document.getElementById('userType').value = userType;
    } else {
        notificationManager.error(result.message);
    }
}

function showSignup() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('signupContainer').classList.remove('hidden');
    
    // Populate teacher dropdown
    populateTeacherDropdown();
}

function showLogin() {
    document.getElementById('signupContainer').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
}

function toggleSignupFields() {
    const userType = document.getElementById('signupUserType').value;
    const adminCodeGroup = document.getElementById('adminCodeGroup');
    const adminCodeInput = document.getElementById('adminCode');
    const teacherSelectGroup = document.getElementById('teacherSelectGroup');
    const teacherSelect = document.getElementById('teacherSelect');
    
    if (userType === 'admin') {
        adminCodeGroup.classList.remove('hidden');
        adminCodeInput.required = true;
        teacherSelectGroup.classList.add('hidden');
        teacherSelect.required = false;
    } else if (userType === 'student') {
        adminCodeGroup.classList.add('hidden');
        adminCodeInput.required = false;
        adminCodeInput.value = '';
        teacherSelectGroup.classList.remove('hidden');
        teacherSelect.required = true;
    } else {
        adminCodeGroup.classList.add('hidden');
        adminCodeInput.required = false;
        adminCodeInput.value = '';
        teacherSelectGroup.classList.add('hidden');
        teacherSelect.required = false;
    }
}

function populateTeacherDropdown() {
    const teacherSelect = document.getElementById('teacherSelect');
    if (!teacherSelect) return;
    
    const teachers = authManager.getAvailableTeachers();
    teacherSelect.innerHTML = '<option value="">Choose your teacher</option>';
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (${teacher.username})`;
        teacherSelect.appendChild(option);
    });
}

function checkUsernameAvailability() {
    const username = document.getElementById('signupUsername').value.trim();
    const userType = document.getElementById('signupUserType').value;
    
    if (!username || !userType) return;
    
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        showUsernameMessage('Username must be 3-20 characters, letters and numbers only', 'error');
        return;
    }
    
    if (authManager.isUsernameAvailable(username, userType)) {
        showUsernameMessage('Username is available', 'success');
    } else {
        showUsernameMessage('Username is already taken', 'error');
    }
}

function showUsernameMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.username-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageElement = document.createElement('small');
    messageElement.className = `username-message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        color: ${type === 'success' ? '#10b981' : '#ef4444'};
        font-size: 0.8rem;
        margin-top: 0.25rem;
        display: block;
    `;
    
    // Insert after username input
    const usernameInput = document.getElementById('signupUsername');
    usernameInput.parentNode.appendChild(messageElement);
}

function scrollToLogin() {
    document.getElementById('login').scrollIntoView({
        behavior: 'smooth'
    });
}

function closeBanner() {
    const banner = document.querySelector('.disclaimer-banner');
    if (banner) {
        banner.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 300);
        
        // Remember that user closed the banner
        localStorage.setItem('disclaimerBannerClosed', 'true');
    }
}

// Money Shower Animation
function createMoneyShower() {
    const container = document.querySelector('.money-shower-container');
    if (!container) return;

    const moneyEmojis = ['💰', '🪙', '💵', '💸'];
    
    function createFallingMoney() {
        const money = document.createElement('div');
        money.className = 'falling-money';
        money.textContent = moneyEmojis[Math.floor(Math.random() * moneyEmojis.length)];
        
        // Random horizontal position
        money.style.left = Math.random() * 250 + 'px';
        
        // Fixed animation duration for consistency
        const duration = 4;
        money.style.animationDuration = duration + 's';
        
        // Remove random delay to prevent stuck icons
        money.style.animationDelay = '0s';
        
        container.appendChild(money);
        
        let isClicked = false;
        
        // Listen for animation end instead of using setTimeout
        money.addEventListener('animationend', function() {
            if (!isClicked && money.parentNode) {
                money.parentNode.removeChild(money);
            }
        });
        
        // Fallback cleanup in case animation event doesn't fire
        const fallbackTimeout = setTimeout(() => {
            if (!isClicked && money.parentNode) {
                money.parentNode.removeChild(money);
            }
        }, 6000); // Extra long fallback
        
        // Add click effect with better animation
        money.addEventListener('click', function(e) {
            e.stopPropagation();
            isClicked = true;
            clearTimeout(fallbackTimeout);
            
            // Get current position to maintain it during spin
            const currentTransform = window.getComputedStyle(money).transform;
            const rect = money.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Calculate current position relative to container
            const currentTop = rect.top - containerRect.top;
            const currentLeft = rect.left - containerRect.left;
            
            // Stop the falling animation and fix position
            money.style.animation = 'none';
            money.style.top = currentTop + 'px';
            money.style.left = currentLeft + 'px';
            
            // Apply the spinning animation from current position
            money.style.animation = 'coinClickSpin 0.8s ease-out forwards';
            
            setTimeout(() => {
                if (money.parentNode) {
                    money.parentNode.removeChild(money);
                }
            }, 800);
        });
    }
    
    // Create money every 800ms for more activity
    setInterval(createFallingMoney, 800);
    
    // Initial burst - multiple coins for immediate visual impact
    for (let i = 0; i < 4; i++) {
        setTimeout(createFallingMoney, i * 400);
    }
}

// Piggy bank click effect
function initPiggyBankEffect() {
    const piggyBank = document.querySelector('.piggy-bank');
    if (!piggyBank) return;
    
    piggyBank.addEventListener('click', function() {
        // Create burst of coins
        const container = document.querySelector('.money-shower-container');
        if (!container) return;
        
        const burstEmojis = ['💰', '🪙', '💵', '💸'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'falling-money';
                coin.textContent = burstEmojis[Math.floor(Math.random() * burstEmojis.length)];
                coin.style.left = Math.random() * 250 + 'px';
                coin.style.animationDuration = '1.5s';
                coin.style.fontSize = '2.5rem';
                
                container.appendChild(coin);
                
                setTimeout(() => {
                    if (coin.parentNode) {
                        coin.parentNode.removeChild(coin);
                    }
                }, 3000); // Increased cleanup time
            }, i * 100);
        }
        
        // Piggy bank reaction
        piggyBank.style.animation = 'none';
        setTimeout(() => {
            piggyBank.style.animation = 'bounce 0.5s ease-in-out 3';
        }, 10);
    });
}

// Check if banner should be hidden on page load
document.addEventListener('DOMContentLoaded', function() {
    const bannerClosed = localStorage.getItem('disclaimerBannerClosed');
    if (bannerClosed === 'true') {
        const banner = document.querySelector('.disclaimer-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    // Initialize money shower animation
    createMoneyShower();
    initPiggyBankEffect();
});
