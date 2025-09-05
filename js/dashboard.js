// Student dashboard functionality
class StudentDashboard {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.balance = 0;
        this.init();
    }

    init() {
        // Require student authentication
        if (!authManager.requireAuth('student')) {
            return;
        }

        this.currentUser = authManager.getCurrentUser();
        this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    }

    loadUserData() {
        // Load user data from localStorage or create initial data
        const savedData = localStorage.getItem(`userData_${this.currentUser.id}`);
        
        if (savedData) {
            const data = JSON.parse(savedData);
            this.balance = data.balance || 0;
            this.transactions = data.transactions || [];
        } else {
            // Create initial data for new users
            this.balance = 100; // Starting balance
            this.transactions = [
                {
                    id: 'welcome',
                    type: 'earning',
                    amount: 100,
                    description: 'Welcome bonus',
                    date: new Date().toISOString(),
                    status: 'approved',
                    from: 'System'
                }
            ];
            this.saveUserData();
        }
    }

    saveUserData() {
        const userData = {
            balance: this.balance,
            transactions: this.transactions,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`userData_${this.currentUser.id}`, JSON.stringify(userData));
    }

    setupEventListeners() {
        // Transaction form
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleNewTransaction(e));
        }

        // Filters
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterTransactions());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterTransactions());
        }
    }

    updateUI() {
        // Update user name
        const studentNameElement = document.getElementById('studentName');
        if (studentNameElement) {
            studentNameElement.textContent = this.currentUser.name;
        }

        // Update balance
        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            balanceElement.textContent = this.balance.toFixed(2);
            
            // Add negative class for styling if balance is negative
            const balanceAmountElement = balanceElement.parentElement;
            const balanceCard = balanceAmountElement.closest('.balance-card');
            
            if (this.balance < 0) {
                balanceAmountElement.classList.add('negative');
                if (balanceCard) balanceCard.classList.add('negative');
            } else {
                balanceAmountElement.classList.remove('negative');
                if (balanceCard) balanceCard.classList.remove('negative');
            }
        }

        // Update stats
        this.updateStats();
        
        // Update transaction list
        this.displayTransactions();
    }

    updateStats() {
        let totalEarned = 0;
        let totalSpent = 0;
        let approvedTransactions = 0;

        this.transactions.forEach(transaction => {
            if (transaction.status === 'approved') {
                approvedTransactions++;
                if (transaction.type === 'earning' || transaction.type === 'request') {
                    totalEarned += transaction.amount;
                } else if (transaction.type === 'purchase') {
                    totalSpent += transaction.amount;
                }
            }
        });

        const totalEarnedElement = document.getElementById('totalEarned');
        const totalSpentElement = document.getElementById('totalSpent');
        const transactionCountElement = document.getElementById('transactionCount');

        if (totalEarnedElement) {
            totalEarnedElement.textContent = `$${totalEarned.toFixed(2)}`;
        }
        
        if (totalSpentElement) {
            totalSpentElement.textContent = `$${totalSpent.toFixed(2)}`;
        }
        
        if (transactionCountElement) {
            transactionCountElement.textContent = approvedTransactions;
        }
    }

    handleNewTransaction(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const type = formData.get('transactionType');
        const amount = parseFloat(formData.get('amount'));
        const description = formData.get('description');

        if (!type || !amount || !description) {
            notificationManager.error('Please fill in all required fields');
            return;
        }

        if (amount <= 0) {
            notificationManager.error('Amount must be greater than 0');
            return;
        }

        // Note: Students can now go into negative balance

        // Create new transaction
        const transaction = {
            id: Date.now().toString(),
            type: type,
            amount: amount,
            description: description,
            recipient: 'Teacher',
            date: new Date().toISOString(),
            status: 'pending', // All transactions need approval
            from: this.currentUser.name
        };

        // Add to transactions
        this.transactions.unshift(transaction);

        this.saveUserData();
        this.updateUI();
        
        // Reset form
        event.target.reset();
        
        notificationManager.info('Transaction submitted for approval');
    }

    autoApproveTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction && transaction.status === 'pending') {
            transaction.status = 'approved';
            
            // Update balance
            if (transaction.type === 'earning') {
                this.balance += transaction.amount;
            } else if (transaction.type === 'purchase') {
                this.balance -= transaction.amount;
            }
            
            this.saveUserData();
            this.updateUI();
            
            // Show notification
            this.showNotification(`Transaction "${transaction.description}" has been approved!`);
        }
    }

    displayTransactions() {
        const transactionList = document.getElementById('transactionList');
        if (!transactionList) return;

        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const typeFilter = document.getElementById('typeFilter')?.value || '';

        let filteredTransactions = this.transactions;

        if (statusFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter);
        }

        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        if (filteredTransactions.length === 0) {
            transactionList.innerHTML = '<p class="no-transactions">No transactions found</p>';
            return;
        }

        transactionList.innerHTML = filteredTransactions.map(transaction => {
            const date = new Date(transaction.date);
            
            // Determine styling based on transaction type and status
            let amountClass = '';
            let itemClass = transaction.type;
            let amountPrefix = '';
            
            if (transaction.status === 'pending') {
                // Pending transactions get special styling
                amountClass = 'pending';
                itemClass += ' pending';
                
                if (transaction.type === 'earning' || transaction.type === 'request') {
                    amountPrefix = '+';
                } else {
                    amountPrefix = '-';
                }
            } else if (transaction.status === 'approved') {
                // Approved transactions get normal positive/negative styling
                if (transaction.type === 'earning' || transaction.type === 'request') {
                    amountClass = 'positive';
                    amountPrefix = '+';
                } else {
                    amountClass = 'negative';
                    amountPrefix = '-';
                }
            } else {
                // Rejected transactions get muted styling
                amountClass = 'negative';
                itemClass += ' rejected';
                amountPrefix = transaction.type === 'earning' ? '+' : '-';
            }
            
            return `
                <div class="transaction-item ${itemClass}" onclick="showTransactionDetails('${transaction.id}')">
                    <div class="transaction-header">
                        <span class="transaction-type">${transaction.type}</span>
                        <span class="transaction-amount ${amountClass}">
                            ${amountPrefix}$${transaction.amount.toFixed(2)}
                        </span>
                    </div>
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        <span class="transaction-status ${transaction.status}">${transaction.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterTransactions() {
        this.displayTransactions();
    }

    showTransactionDetails(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const modal = document.getElementById('transactionModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        const date = new Date(transaction.date);
        
        modalBody.innerHTML = `
            <div class="transaction-details">
                <p><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
                <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
                <p><strong>Description:</strong> ${transaction.description}</p>
                <p><strong>Recipient:</strong> ${transaction.recipient}</p>
                <p><strong>Date:</strong> ${date.toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="transaction-status ${transaction.status}">${transaction.status}</span></p>
                ${transaction.from ? `<p><strong>From:</strong> ${transaction.from}</p>` : ''}
            </div>
        `;

        modal.style.display = 'block';
    }

    showNotification(message) {
        // Use global notification manager
        notificationManager.success(message);
    }
}

// Global functions
function closeModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showTransactionDetails(transactionId) {
    if (window.dashboard) {
        window.dashboard.showTransactionDetails(transactionId);
    }
}

// Click outside modal to close
window.addEventListener('click', function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new StudentDashboard();
});
