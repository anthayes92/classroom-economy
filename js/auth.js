// Authentication and session management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    login(username, password, userType) {
        // Demo authentication - in a real app, this would validate against a backend
        const demoCredentials = {
            student: { username: 'student', password: 'demo123' },
            admin: { username: 'admin', password: 'admin123' }
        };

        // Check demo credentials
        if (demoCredentials[userType] && 
            demoCredentials[userType].username === username && 
            demoCredentials[userType].password === password) {
            
            this.currentUser = {
                username,
                userType,
                id: userType === 'student' ? 'student1' : 'admin1',
                name: userType === 'student' ? 'Demo Student' : 'Demo Admin',
                loginTime: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            return true;
        }

        // Check if user exists in registered users
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        const userId = userType === 'student' ? `student_${username}` : `admin_${username}`;
        
        if (registeredUsers[userId] && registeredUsers[userId].password === password) {
            this.currentUser = {
                username,
                userType,
                id: userId,
                name: registeredUsers[userId].name,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return true;
        }

        return false;
    }

    signup(username, password, confirmPassword, userType, adminCode = '', teacherId = '') {
        // Validation
        if (!username || !password || !confirmPassword || !userType) {
            return { success: false, message: 'Please fill in all required fields' };
        }

        // For students, require teacher selection
        if (userType === 'student' && !teacherId) {
            return { success: false, message: 'Please select your teacher' };
        }

        // Username validation
        if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
            return { success: false, message: 'Username must be 3-20 characters, letters and numbers only' };
        }

        // Password validation
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters long' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        // Admin code validation
        if (userType === 'admin') {
            const correctAdminCode = 'teacher123'; // In a real app, this would be more secure
            if (adminCode !== correctAdminCode) {
                return { success: false, message: 'Invalid admin code. Contact your teacher for the correct code.' };
            }
        }

        // Check if username already exists
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        const userId = userType === 'student' ? `student_${username}` : `admin_${username}`;
        
        // Also check demo usernames
        if (username === 'student' || username === 'admin') {
            return { success: false, message: 'This username is reserved. Please choose a different one.' };
        }

        if (registeredUsers[userId]) {
            return { success: false, message: 'Username already exists. Please choose a different one.' };
        }

        // Create new user (use username as display name)
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        registeredUsers[userId] = {
            username,
            name: displayName,
            password,
            userType,
            teacherId: userType === 'student' ? teacherId : null,
            createdAt: new Date().toISOString()
        };

        // Save registered users
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        // If it's a student, create initial user data
        if (userType === 'student') {
            const initialUserData = {
                balance: 100, // Starting balance
                transactions: [
                    {
                        id: 'welcome_' + Date.now(),
                        type: 'earning',
                        amount: 100,
                        description: 'Welcome bonus - New student signup',
                        date: new Date().toISOString(),
                        status: 'approved',
                        from: 'System'
                    }
                ],
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(`userData_${userId}`, JSON.stringify(initialUserData));
        }

        return { success: true, message: 'Account created successfully! You can now log in.' };
    }

    isUsernameAvailable(username, userType) {
        // Check demo usernames
        if (username === 'student' || username === 'admin') {
            return false;
        }

        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        const userId = userType === 'student' ? `student_${username}` : `admin_${username}`;
        
        return !registeredUsers[userId];
    }

    getAvailableTeachers() {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        const teachers = [];
        
        // Add demo admin
        teachers.push({
            id: 'admin1',
            name: 'Demo Admin',
            username: 'admin'
        });

        // Add registered teachers
        Object.keys(registeredUsers).forEach(userId => {
            const user = registeredUsers[userId];
            if (user.userType === 'admin') {
                teachers.push({
                    id: userId,
                    name: user.name,
                    username: user.username
                });
            }
        });

        return teachers;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    requireAuth(requiredType = null) {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }

        if (requiredType && this.currentUser.userType !== requiredType) {
            alert('Access denied. Insufficient permissions.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    redirectToDashboard() {
        if (!this.isLoggedIn()) {
            return;
        }

        if (this.currentUser.userType === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Global logout function
function logout() {
    authManager.logout();
}
