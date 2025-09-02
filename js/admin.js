// Admin dashboard functionality
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.allTransactions = [];
        this.currentTab = 'overview';
        this.sortBy = '';
        this.sortOrder = 'asc';
        this.init();
    }

    init() {
        // Require admin authentication
        if (!authManager.requireAuth('admin')) {
            return;
        }

        this.currentUser = authManager.getCurrentUser();
        this.loadData();
        this.setupEventListeners();
        this.updateAdminName();
        this.updateUI();
    }

    loadData() {
        // Load all user data and compile transactions
        this.users = this.loadAllUsers();
        this.allTransactions = this.compileAllTransactions();
    }

    loadAllUsers() {
        const users = [];
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        
        // Get all localStorage keys that start with 'userData_'
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('userData_')) {
                const userId = key.replace('userData_', '');
                const userData = JSON.parse(localStorage.getItem(key));
                
                // Skip admin users
                if (userId.startsWith('admin')) continue;
                
                // Get user registration info to check teacher association
                let userName = 'Demo Student';
                let teacherId = null;
                
                if (userId === 'student1') {
                    // Demo student - associate with demo admin
                    teacherId = 'admin1';
                } else if (registeredUsers[userId]) {
                    userName = registeredUsers[userId].name;
                    teacherId = registeredUsers[userId].teacherId;
                }
                
                // Only include students associated with current admin
                if (teacherId !== this.currentUser.id) continue;
                
                users.push({
                    id: userId,
                    name: userName,
                    balance: userData.balance || 0,
                    transactions: userData.transactions || [],
                    totalEarned: this.calculateTotalEarned(userData.transactions || []),
                    totalSpent: this.calculateTotalSpent(userData.transactions || []),
                    lastActive: userData.lastUpdated || new Date().toISOString(),
                    teacherId: teacherId
                });
            }
        }

        // Add demo student if no users exist and current user is demo admin
        if (users.length === 0 && this.currentUser.id === 'admin1') {
            const demoUser = {
                id: 'student1',
                name: 'Demo Student',
                balance: 100,
                transactions: [
                    {
                        id: 'welcome',
                        type: 'earning',
                        amount: 100,
                        description: 'Welcome bonus',
                        date: new Date().toISOString(),
                        status: 'approved',
                        from: 'System'
                    }
                ],
                totalEarned: 100,
                totalSpent: 0,
                lastActive: new Date().toISOString(),
                teacherId: 'admin1'
            };
            users.push(demoUser);
            
            // Save demo user data
            localStorage.setItem('userData_student1', JSON.stringify({
                balance: 100,
                transactions: demoUser.transactions,
                lastUpdated: new Date().toISOString()
            }));
        }

        return users;
    }

    compileAllTransactions() {
        const allTransactions = [];
        
        this.users.forEach(user => {
            user.transactions.forEach(transaction => {
                allTransactions.push({
                    ...transaction,
                    userId: user.id,
                    userName: user.name
                });
            });
        });

        return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    calculateTotalEarned(transactions) {
        return transactions
            .filter(t => t.type === 'earning' && t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    calculateTotalSpent(transactions) {
        return transactions
            .filter(t => t.type === 'purchase' && t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    setupEventListeners() {
        // Admin transaction form
        const adminTransactionForm = document.getElementById('adminTransactionForm');
        if (adminTransactionForm) {
            adminTransactionForm.addEventListener('submit', (e) => this.handleAdminTransaction(e));
        }

        // Recipient type radio buttons
        const recipientRadios = document.querySelectorAll('input[name="recipientType"]');
        recipientRadios.forEach(radio => {
            radio.addEventListener('change', () => this.toggleRecipientFields());
        });

        // Search and filter inputs
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', () => this.filterUsers());
        }

        const transactionSearch = document.getElementById('transactionSearch');
        if (transactionSearch) {
            transactionSearch.addEventListener('input', () => this.filterTransactions());
        }

        // Filter selects
        ['adminStatusFilter', 'adminTypeFilter', 'dateFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterTransactions());
            }
        });

        this.populateStudentDropdown();
        this.toggleRecipientFields();
    }

    updateAdminName() {
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = this.currentUser.name;
        }
    }

    populateStudentDropdown() {
        const dropdown = document.getElementById('adminRecipient');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Choose a student</option>';
        // Only show students associated with this admin
        this.users.forEach(user => {
            dropdown.innerHTML += `<option value="${user.id}">${user.name}</option>`;
        });
    }

    toggleRecipientFields() {
        const selectedType = document.querySelector('input[name="recipientType"]:checked')?.value;
        const singleGroup = document.getElementById('singleRecipientGroup');
        const allGroup = document.getElementById('allRecipientsGroup');

        if (singleGroup && allGroup) {
            if (selectedType === 'single') {
                singleGroup.style.display = 'block';
                allGroup.style.display = 'none';
            } else {
                singleGroup.style.display = 'none';
                allGroup.style.display = 'block';
            }
        }
    }

    updateUI() {
        this.updateOverviewStats();
        this.displayUsers();
        this.displayTransactions();
        this.displayPendingTransactions();
    }

    updateOverviewStats() {
        const totalUsers = this.users.length;
        const totalCurrency = this.users.reduce((sum, user) => sum + user.balance, 0);
        const pendingCount = this.allTransactions.filter(t => t.status === 'pending').length;
        const todayTransactions = this.allTransactions.filter(t => {
            const today = new Date().toDateString();
            const transactionDate = new Date(t.date).toDateString();
            return today === transactionDate;
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalCurrency').textContent = `$${totalCurrency.toFixed(2)}`;
        document.getElementById('pendingTransactions').textContent = pendingCount;
        document.getElementById('todayTransactions').textContent = todayTransactions;
    }

    displayUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        let filteredUsers = this.users;

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.id.toLowerCase().includes(searchTerm)
            );
        }

        tbody.innerHTML = filteredUsers.map(user => {
            const lastActive = new Date(user.lastActive);
            const balanceClass = user.balance < 0 ? 'negative-balance' : '';
            return `
                <tr>
                    <td>${user.name}</td>
                    <td class="${balanceClass}">$${user.balance.toFixed(2)}</td>
                    <td>$${user.totalEarned.toFixed(2)}</td>
                    <td>$${user.totalSpent.toFixed(2)}</td>
                    <td>${lastActive.toLocaleDateString()}</td>
                    <td>
                        <button class="btn-secondary btn-small" onclick="viewUser('${user.id}')">View</button>
                        <button class="btn-success btn-small" onclick="addCurrency('${user.id}')">Add $</button>
                        <button class="btn-danger btn-small" onclick="deductCurrency('${user.id}')">Deduct $</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    displayTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;

        const searchTerm = document.getElementById('transactionSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminStatusFilter')?.value || '';
        const typeFilter = document.getElementById('adminTypeFilter')?.value || '';
        const dateFilter = document.getElementById('dateFilter')?.value || '';

        let filteredTransactions = this.allTransactions;

        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.description.toLowerCase().includes(searchTerm) ||
                t.userName.toLowerCase().includes(searchTerm)
            );
        }

        if (statusFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter);
        }

        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            filteredTransactions = filteredTransactions.filter(t => 
                new Date(t.date).toDateString() === filterDate
            );
        }

        tbody.innerHTML = filteredTransactions.map(transaction => {
            const date = new Date(transaction.date);
            return `
                <tr>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${transaction.userName}</td>
                    <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td>${transaction.description}</td>
                    <td><span class="transaction-status ${transaction.status}">${transaction.status}</span></td>
                    <td>
                        ${transaction.status === 'pending' ? `
                            <button class="btn-success btn-small" onclick="approveTransaction('${transaction.userId}', '${transaction.id}')">Approve</button>
                            <button class="btn-danger btn-small" onclick="rejectTransaction('${transaction.userId}', '${transaction.id}')">Reject</button>
                        ` : ''}
                        <button class="btn-secondary btn-small" onclick="viewTransaction('${transaction.userId}', '${transaction.id}')">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    displayPendingTransactions() {
        const pendingList = document.getElementById('pendingList');
        if (!pendingList) return;

        const pendingTransactions = this.allTransactions.filter(t => t.status === 'pending');

        if (pendingTransactions.length === 0) {
            pendingList.innerHTML = '<p class="no-transactions">No pending transactions</p>';
            return;
        }

        pendingList.innerHTML = pendingTransactions.map(transaction => {
            const date = new Date(transaction.date);
            return `
                <div class="pending-item">
                    <div class="pending-header">
                        <div>
                            <strong>${transaction.userName}</strong> - ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            <span class="transaction-amount ${transaction.type === 'earning' ? 'positive' : 'negative'}">
                                $${transaction.amount.toFixed(2)}
                            </span>
                        </div>
                        <div class="pending-actions">
                            <button class="btn-success btn-small" onclick="approveTransaction('${transaction.userId}', '${transaction.id}')">Approve</button>
                            <button class="btn-danger btn-small" onclick="rejectTransaction('${transaction.userId}', '${transaction.id}')">Reject</button>
                        </div>
                    </div>
                    <p><strong>Description:</strong> ${transaction.description}</p>
                    <p><strong>Date:</strong> ${date.toLocaleString()}</p>
                    ${transaction.recipient ? `<p><strong>Recipient:</strong> ${transaction.recipient}</p>` : ''}
                </div>
            `;
        }).join('');
    }

    handleAdminTransaction(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const type = formData.get('transactionType');
        const amount = parseFloat(formData.get('amount'));
        const description = formData.get('description');
        const recipientType = formData.get('recipientType');
        const recipientId = formData.get('recipient');

        if (!type || !amount || !description || !recipientType) {
            alert('Please fill in all required fields');
            return;
        }

        if (recipientType === 'single' && !recipientId) {
            alert('Please select a student');
            return;
        }

        const recipients = recipientType === 'all' ? this.users : [this.users.find(u => u.id === recipientId)];

        recipients.forEach(user => {
            if (!user) return;

            const transaction = {
                id: Date.now().toString() + '_' + user.id,
                type: type,
                amount: amount,
                description: description,
                date: new Date().toISOString(),
                status: 'approved', // Admin transactions are auto-approved
                from: 'Admin',
                recipient: user.name
            };

            // Update user balance (allow negative balances)
            if (type === 'earning') {
                user.balance += amount;
            } else if (type === 'purchase') {
                user.balance -= amount;
            }

            // Add transaction to user's history
            user.transactions.unshift(transaction);
            user.lastActive = new Date().toISOString();

            // Save user data
            const userData = {
                balance: user.balance,
                transactions: user.transactions,
                lastUpdated: user.lastActive
            };
            localStorage.setItem(`userData_${user.id}`, JSON.stringify(userData));
        });

        // Refresh data and UI
        this.loadData();
        this.updateUI();
        
        // Reset form
        event.target.reset();
        this.toggleRecipientFields();
        
        const recipientText = recipientType === 'all' ? 'all students' : recipients[0]?.name;
        alert(`Transaction successfully applied to ${recipientText}`);
    }

    approveTransaction(userId, transactionId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const transaction = user.transactions.find(t => t.id === transactionId);
        if (!transaction || transaction.status !== 'pending') return;

        transaction.status = 'approved';

        // Update user balance (allow negative balances)
        if (transaction.type === 'earning') {
            user.balance += transaction.amount;
        } else if (transaction.type === 'purchase') {
            user.balance -= transaction.amount;
        }

        // Save updated data
        const userData = {
            balance: user.balance,
            transactions: user.transactions,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));

        // Refresh data and UI
        this.loadData();
        this.updateUI();

        alert('Transaction approved');
    }

    rejectTransaction(userId, transactionId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const transaction = user.transactions.find(t => t.id === transactionId);
        if (!transaction || transaction.status !== 'pending') return;

        transaction.status = 'rejected';

        // Save updated data
        const userData = {
            balance: user.balance,
            transactions: user.transactions,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));

        // Refresh data and UI
        this.loadData();
        this.updateUI();

        alert('Transaction rejected');
    }

    bulkApprove() {
        const pendingTransactions = this.allTransactions.filter(t => t.status === 'pending');
        
        if (pendingTransactions.length === 0) {
            alert('No pending transactions to approve');
            return;
        }

        if (!confirm(`Approve all ${pendingTransactions.length} pending transactions?`)) {
            return;
        }

        pendingTransactions.forEach(transaction => {
            this.approveTransaction(transaction.userId, transaction.id);
        });
    }

    bulkReject() {
        const pendingTransactions = this.allTransactions.filter(t => t.status === 'pending');
        
        if (pendingTransactions.length === 0) {
            alert('No pending transactions to reject');
            return;
        }

        if (!confirm(`Reject all ${pendingTransactions.length} pending transactions?`)) {
            return;
        }

        pendingTransactions.forEach(transaction => {
            this.rejectTransaction(transaction.userId, transaction.id);
        });
    }

    filterUsers() {
        this.displayUsers();
    }

    filterTransactions() {
        this.displayTransactions();
    }
}

// Global functions for admin actions
function showTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(tabName);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Add active class to clicked nav button
    event.target.classList.add('active');

    // Update current tab
    if (window.adminDashboard) {
        window.adminDashboard.currentTab = tabName;
    }
}

function viewUser(userId) {
    if (!window.adminDashboard) return;
    
    const user = window.adminDashboard.users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('userModalTitle');
    const modalBody = document.getElementById('userModalBody');
    
    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = `${user.name} - Details`;
    
    modalBody.innerHTML = `
        <div class="user-details">
            <p><strong>User ID:</strong> ${user.id}</p>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Current Balance:</strong> <span class="${user.balance < 0 ? 'negative-balance' : ''}">$${user.balance.toFixed(2)}</span></p>
            <p><strong>Total Earned:</strong> $${user.totalEarned.toFixed(2)}</p>
            <p><strong>Total Spent:</strong> $${user.totalSpent.toFixed(2)}</p>
            <p><strong>Total Transactions:</strong> ${user.transactions.length}</p>
            <p><strong>Last Active:</strong> ${new Date(user.lastActive).toLocaleString()}</p>
        </div>
        <h4>Recent Transactions:</h4>
        <div class="user-transactions">
            ${user.transactions.slice(0, 5).map(t => {
                const date = new Date(t.date);
                return `
                    <div class="transaction-summary">
                        <span>${t.type} - $${t.amount.toFixed(2)}</span>
                        <span>${t.description}</span>
                        <span>${date.toLocaleDateString()}</span>
                        <span class="transaction-status ${t.status}">${t.status}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    modal.style.display = 'block';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeTransactionModal() {
    const modal = document.getElementById('adminTransactionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addCurrency(userId) {
    const amount = prompt('Enter amount to add:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const description = prompt('Enter description:') || 'Admin credit';
    
    if (window.adminDashboard) {
        const user = window.adminDashboard.users.find(u => u.id === userId);
        if (user) {
            const transaction = {
                id: Date.now().toString(),
                type: 'earning',
                amount: parseFloat(amount),
                description: description,
                date: new Date().toISOString(),
                status: 'approved',
                from: 'Admin'
            };

            user.balance += parseFloat(amount);
            user.transactions.unshift(transaction);
            user.lastActive = new Date().toISOString();

            const userData = {
                balance: user.balance,
                transactions: user.transactions,
                lastUpdated: user.lastActive
            };
            localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));

            window.adminDashboard.loadData();
            window.adminDashboard.updateUI();
            
            alert(`Added $${amount} to ${user.name}'s account`);
        }
    }
}

function deductCurrency(userId) {
    const amount = prompt('Enter amount to deduct:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const description = prompt('Enter description:') || 'Admin deduction';
    
    if (window.adminDashboard) {
        const user = window.adminDashboard.users.find(u => u.id === userId);
        if (user) {
            const transaction = {
                id: Date.now().toString(),
                type: 'purchase',
                amount: parseFloat(amount),
                description: description,
                date: new Date().toISOString(),
                status: 'approved',
                from: 'Admin'
            };

            user.balance -= parseFloat(amount);
            user.transactions.unshift(transaction);
            user.lastActive = new Date().toISOString();

            const userData = {
                balance: user.balance,
                transactions: user.transactions,
                lastUpdated: user.lastActive
            };
            localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));

            window.adminDashboard.loadData();
            window.adminDashboard.updateUI();
            
            alert(`Deducted $${amount} from ${user.name}'s account`);
        }
    }
}

function approveTransaction(userId, transactionId) {
    if (window.adminDashboard) {
        window.adminDashboard.approveTransaction(userId, transactionId);
    }
}

function rejectTransaction(userId, transactionId) {
    if (window.adminDashboard) {
        window.adminDashboard.rejectTransaction(userId, transactionId);
    }
}

function bulkApprove() {
    if (window.adminDashboard) {
        window.adminDashboard.bulkApprove();
    }
}

function bulkReject() {
    if (window.adminDashboard) {
        window.adminDashboard.bulkReject();
    }
}

function addNewUser() {
    const username = prompt('Enter new student username:');
    if (!username) return;

    const name = prompt('Enter student name:') || username.charAt(0).toUpperCase() + username.slice(1);
    const startingBalance = parseFloat(prompt('Enter starting balance:') || '0');

    const userId = `student_${username}`;
    
    // Check if user already exists
    if (localStorage.getItem(`userData_${userId}`)) {
        alert('User already exists');
        return;
    }

    const userData = {
        balance: startingBalance,
        transactions: startingBalance > 0 ? [{
            id: Date.now().toString(),
            type: 'earning',
            amount: startingBalance,
            description: 'Initial balance',
            date: new Date().toISOString(),
            status: 'approved',
            from: 'Admin'
        }] : [],
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));

    if (window.adminDashboard) {
        window.adminDashboard.loadData();
        window.adminDashboard.updateUI();
        window.adminDashboard.populateStudentDropdown();
    }

    alert(`Created new student account for ${name}`);
}

// Click outside modal to close
window.addEventListener('click', function(event) {
    const userModal = document.getElementById('userModal');
    const transactionModal = document.getElementById('adminTransactionModal');
    
    if (event.target === userModal) {
        closeUserModal();
    }
    
    if (event.target === transactionModal) {
        closeTransactionModal();
    }
});

// Initialize admin dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});
