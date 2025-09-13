// Personal Finance Tracker Application
const FinanceTracker = {
    // Data storage
    transactions: [],
    budgets: {},

    // Predefined categories
    incomeCategories: ['Salary', 'Freelance', 'Investments', 'Other'],
    expenseCategories: ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'],

    // DOM elements
    elements: {
        // Navigation
        navLinks: document.querySelectorAll('.nav-link'),
        sections: document.querySelectorAll('.section'),

        // Dashboard
        totalIncome: document.getElementById('total-income'),
        totalExpenses: document.getElementById('total-expenses'),
        currentBalance: document.getElementById('current-balance'),
        categoryChart: document.getElementById('category-chart'),
        recentTransactionsList: document.getElementById('recent-transactions-list'),

        // Transaction form
        transactionForm: document.getElementById('transaction-form'),
        submitBtn: document.querySelector('#transaction-form button[type="submit"]'),
        typeInputs: document.querySelectorAll('input[name="type"]'),
        amountInput: document.getElementById('amount'),
        descriptionInput: document.getElementById('description'),
        categorySelect: document.getElementById('category'),
        dateInput: document.getElementById('date'),
        cancelEditBtn: document.getElementById('cancel-edit'),

        // Transaction list
        transactionList: document.getElementById('transaction-list'),
        filterCategory: document.getElementById('filter-category'),
        filterType: document.getElementById('filter-type'),
        searchDescription: document.getElementById('search-description'),

        // Budget form
        budgetForm: document.getElementById('budget-form'),
        budgetCategory: document.getElementById('budget-category'),
        budgetAmount: document.getElementById('budget-amount'),
        budgetList: document.getElementById('budget-list')
    },

    // State
    editingTransactionId: null,

    // Initialize the app
    init() {
        // Load data from localStorage
        this.loadData();

        // Set today's date as default
        this.elements.dateInput.valueAsDate = new Date();

        // Populate category dropdowns
        this.populateCategories();

        // Populate filter dropdowns
        this.populateFilterCategories();

        // Populate budget category dropdown
        this.populateBudgetCategories();

        // Set up event listeners
        this.setupEventListeners();

        // Update UI
        this.updateDashboard();
        this.renderTransactions();
        this.renderBudgets();
    },

    // Load data from localStorage
    loadData() {
        try {
            // Load transactions
            const savedTransactions = localStorage.getItem('financeTracker_transactions');
            if (savedTransactions) {
                this.transactions = JSON.parse(savedTransactions);
            }

            // Load budgets
            const savedBudgets = localStorage.getItem('financeTracker_budgets');
            if (savedBudgets) {
                this.budgets = JSON.parse(savedBudgets);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading data. Starting with fresh data.', 'error');
        }
    },

    // Save data to localStorage
    saveData() {
        try {
            // Save transactions
            localStorage.setItem('financeTracker_transactions', JSON.stringify(this.transactions));

            // Save budgets
            localStorage.setItem('financeTracker_budgets', JSON.stringify(this.budgets));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data.', 'error');
        }
    },

    // Populate category dropdown based on transaction type
    populateCategories() {
        const updateCategories = () => {
            const type = document.querySelector('input[name="type"]:checked').value;
            const categories = type === 'income' ? this.incomeCategories : this.expenseCategories;

            // Clear current options
            this.elements.categorySelect.innerHTML = '';

            // Add new options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                this.elements.categorySelect.appendChild(option);
            });
        };

        // Initial update
        updateCategories();

        // Update when type changes
        this.elements.typeInputs.forEach(input => {
            input.addEventListener('change', updateCategories);
        });
    },

    // Populate filter category dropdown
    populateFilterCategories() {
        // Clear current options except "All Categories"
        this.elements.filterCategory.innerHTML = '<option value="all">All Categories</option>';

        // Add income categories
        this.incomeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.filterCategory.appendChild(option);
        });

        // Add expense categories
        this.expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.filterCategory.appendChild(option);
        });
    },

    // Populate budget category dropdown with expense categories only
    populateBudgetCategories() {
        // Clear current options
        this.elements.budgetCategory.innerHTML = '';

        // Add expense categories
        this.expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.budgetCategory.appendChild(option);
        });
    },

    // Set up event listeners
    setupEventListeners() {
        // Navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.showSection(targetId);

                // Update active nav link
                this.elements.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Transaction form submission
        this.elements.transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit();
        });

        // Cancel edit button
        this.elements.cancelEditBtn.addEventListener('click', () => {
            this.cancelEdit();
        });

        // Budget form submission
        this.elements.budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBudgetSubmit();
        });

        // Filter and search inputs
        this.elements.filterCategory.addEventListener('change', () => this.renderTransactions());
        this.elements.filterType.addEventListener('change', () => this.renderTransactions());
        this.elements.searchDescription.addEventListener('input', () => this.renderTransactions());

        // Event delegation for transaction actions
        this.elements.transactionList.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const transactionId = e.target.getAttribute('data-id');
                this.editTransaction(transactionId);
            } else if (e.target.classList.contains('delete-btn')) {
                const transactionId = e.target.getAttribute('data-id');
                this.deleteTransaction(transactionId);
            }
        });

        // Event delegation for budget actions
        this.elements.budgetList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-budget-btn')) {
                const category = e.target.getAttribute('data-category');
                this.deleteBudget(category);
            }
        });
    },

    // Show a specific section
    showSection(sectionId) {
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    },

    // Handle transaction form submission
    handleTransactionSubmit() {
        // Get form values
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(this.elements.amountInput.value);
        const description = this.elements.descriptionInput.value.trim();
        const category = this.elements.categorySelect.value;
        const date = this.elements.dateInput.value;

        // Validate inputs
        if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
            this.showNotification('Please fill in all fields with valid values.', 'error');
            return;
        }

        if (this.editingTransactionId) {
            // Update existing transaction
            const transactionIndex = this.transactions.findIndex(t => t.id === this.editingTransactionId);
            if (transactionIndex !== -1) {
                this.transactions[transactionIndex] = {
                    ...this.transactions[transactionIndex],
                    type,
                    amount,
                    description,
                    category,
                    date
                };

                this.showNotification('Transaction updated successfully!', 'success');
            }

            // Reset editing state
            this.cancelEdit();
        } else {
            // Create new transaction
            const transaction = {
                id: Date.now().toString(),
                type,
                amount,
                description,
                category,
                date
            };

            // Add to transactions array
            this.transactions.push(transaction);

            this.showNotification('Transaction added successfully!', 'success');
        }

        // Save data
        this.saveData();

        // Update UI
        this.updateDashboard();
        this.renderTransactions();
        this.renderBudgets();

        // Reset form
        this.elements.transactionForm.reset();
        this.elements.dateInput.valueAsDate = new Date();
    },

    // Edit a transaction
    editTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Set editing state
        this.editingTransactionId = transactionId;

        // Populate form with transaction data
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        this.elements.amountInput.value = transaction.amount;
        this.elements.descriptionInput.value = transaction.description;
        this.elements.dateInput.value = transaction.date;

        // Trigger category change to update dropdown
        this.elements.categorySelect.innerHTML = '';
        const categories = transaction.type === 'income' ? this.incomeCategories : this.expenseCategories;
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === transaction.category) {
                option.selected = true;
            }
            this.elements.categorySelect.appendChild(option);
        });

        // Show cancel button
        this.elements.cancelEditBtn.style.display = 'block';
        
        // Change submit button text
        this.elements.submitBtn.textContent = 'Edit Transaction';

        // Scroll to form
        this.elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
    },

    // Cancel editing
    cancelEdit() {
        this.editingTransactionId = null;
        this.elements.transactionForm.reset();
        this.elements.dateInput.valueAsDate = new Date();
        this.elements.cancelEditBtn.style.display = 'none';
        
        // Reset submit button text
        this.elements.submitBtn.textContent = 'Add Transaction';

        // Reset categories
        this.populateCategories();
    },

    // Delete a transaction
    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== transactionId);

            // Save data
            this.saveData();

            // Update UI
            this.updateDashboard();
            this.renderTransactions();
            this.renderBudgets();

            this.showNotification('Transaction deleted successfully!', 'success');
        }
    },

    // Handle budget form submission
    handleBudgetSubmit() {
        const category = this.elements.budgetCategory.value;
        const amount = parseFloat(this.elements.budgetAmount.value);

        // Validate inputs
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Please enter a valid budget amount.', 'error');
            return;
        }

        // Save budget
        this.budgets[category] = amount;

        // Save data
        this.saveData();

        // Update UI
        this.updateDashboard();
        this.renderBudgets();

        // Reset form
        this.elements.budgetForm.reset();

        this.showNotification('Budget set successfully!', 'success');
    },

    // Delete a budget
    deleteBudget(category) {
        if (confirm(`Are you sure you want to delete the budget for ${category}?`)) {
            delete this.budgets[category];

            // Save data
            this.saveData();

            // Update UI
            this.updateDashboard();
            this.renderBudgets();

            this.showNotification('Budget deleted successfully!', 'success');
        }
    },

    // Update dashboard with current data
    updateDashboard() {
        // Calculate totals
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        // Update summary cards
        this.elements.totalIncome.textContent = `$${income.toFixed(2)}`;
        this.elements.totalExpenses.textContent = `$${expenses.toFixed(2)}`;
        this.elements.currentBalance.textContent = `$${balance.toFixed(2)}`;

        // Update category chart
        this.renderCategoryChart();

        // Update recent transactions
        this.renderRecentTransactions();
    },

    // Render category chart
    renderCategoryChart() {
        // Get expense totals by category
        const categoryTotals = {};

        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!categoryTotals[t.category]) {
                    categoryTotals[t.category] = 0;
                }
                categoryTotals[t.category] += t.amount;
            });

        // Clear chart
        this.elements.categoryChart.innerHTML = '';

        // If no data, show message
        if (Object.keys(categoryTotals).length === 0) {
            this.elements.categoryChart.innerHTML = '<p class="text-center">No expense data available</p>';
            return;
        }

        // Find max value for scaling
        const maxAmount = Math.max(...Object.values(categoryTotals));

        // Create bars for each category
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            const barContainer = document.createElement('div');
            barContainer.style.position = 'relative';
            barContainer.style.height = '100%';
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.alignItems = 'center';
            barContainer.style.justifyContent = 'flex-end';

            const bar = document.createElement('div');
            bar.className = 'chart-bar';

            // Scale height based on max amount
            const height = (amount / maxAmount) * 100;
            bar.style.height = `${height}%`;

            // Set color based on category
            const colors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557', '#ff9e00', '#4cc9f0'];
            const colorIndex = this.expenseCategories.indexOf(category) % colors.length;
            bar.style.backgroundColor = colors[colorIndex];

            // Add value label
            const valueLabel = document.createElement('div');
            valueLabel.className = 'chart-bar-value';
            valueLabel.textContent = `$${amount.toFixed(0)}`;
            bar.appendChild(valueLabel);

            // Add category label
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'chart-bar-label';
            categoryLabel.textContent = category;
            bar.appendChild(categoryLabel);

            barContainer.appendChild(bar);
            this.elements.categoryChart.appendChild(barContainer);
        });
    },

    // Render recent transactions
    renderRecentTransactions() {
        // Get recent transactions (last 5)
        const recentTransactions = [...this.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // Clear list
        this.elements.recentTransactionsList.innerHTML = '';

        // If no transactions, show message
        if (recentTransactions.length === 0) {
            this.elements.recentTransactionsList.innerHTML = '<p class="text-center">No transactions available</p>';
            return;
        }

        // Add each transaction to the list
        recentTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'recent-transaction-item';

            const info = document.createElement('div');
            info.className = 'recent-transaction-info';

            const description = document.createElement('div');
            description.className = 'recent-transaction-description';
            description.textContent = transaction.description;

            const category = document.createElement('div');
            category.className = 'recent-transaction-category';
            category.textContent = `${transaction.category} • ${this.formatDate(transaction.date)}`;

            info.appendChild(description);
            info.appendChild(category);

            const amount = document.createElement('div');
            amount.className = `recent-transaction-amount ${transaction.type}`;
            amount.textContent = `${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`;

            item.appendChild(info);
            item.appendChild(amount);

            this.elements.recentTransactionsList.appendChild(item);
        });
    },

    // Render transactions list
    renderTransactions() {
        // Get filter values
        const categoryFilter = this.elements.filterCategory.value;
        const typeFilter = this.elements.filterType.value;
        const searchQuery = this.elements.searchDescription.value.toLowerCase().trim();

        // Filter transactions
        let filteredTransactions = this.transactions.filter(transaction => {
            // Category filter
            if (categoryFilter !== 'all' && transaction.category !== categoryFilter) {
                return false;
            }

            // Type filter
            if (typeFilter !== 'all' && transaction.type !== typeFilter) {
                return false;
            }

            // Search filter
            if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery)) {
                return false;
            }

            return true;
        });

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Clear list
        this.elements.transactionList.innerHTML = '';

        // If no transactions, show message
        if (filteredTransactions.length === 0) {
            this.elements.transactionList.innerHTML = '<p class="text-center">No transactions found</p>';
            return;
        }

        // Add each transaction to the list
        filteredTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'transaction-item';

            const info = document.createElement('div');
            info.className = 'transaction-info';

            const type = document.createElement('div');
            type.className = `transaction-type ${transaction.type}`;
            type.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);

            const description = document.createElement('div');
            description.textContent = transaction.description;

            const details = document.createElement('div');
            details.className = 'transaction-details';
            details.textContent = `${transaction.category} • ${this.formatDate(transaction.date)}`;

            info.appendChild(type);
            info.appendChild(description);
            info.appendChild(details);

            const amount = document.createElement('div');
            amount.className = `transaction-amount ${transaction.type}`;
            amount.textContent = `${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`;

            const actions = document.createElement('div');
            actions.className = 'transaction-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-secondary edit-btn';
            editBtn.setAttribute('data-id', transaction.id);
            editBtn.textContent = 'Edit';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger delete-btn';
            deleteBtn.setAttribute('data-id', transaction.id);
            deleteBtn.textContent = 'Delete';

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(info);
            item.appendChild(amount);
            item.appendChild(actions);

            this.elements.transactionList.appendChild(item);
        });
    },

    // Render budgets list
    renderBudgets() {
        // Clear list
        this.elements.budgetList.innerHTML = '';

        // If no budgets, show message
        if (Object.keys(this.budgets).length === 0) {
            this.elements.budgetList.innerHTML = '<p class="text-center">No budgets set</p>';
            return;
        }

        // Add each budget to the list
        Object.entries(this.budgets).forEach(([category, budgetAmount]) => {
            // Calculate spent amount
            const spent = this.transactions
                .filter(t => t.type === 'expense' && t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);

            // Calculate percentage
            const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

            // Create budget item
            const item = document.createElement('div');
            item.className = 'budget-item';

            const header = document.createElement('div');
            header.className = 'budget-header';

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'budget-category';
            categoryDiv.textContent = category;

            const amountDiv = document.createElement('div');
            amountDiv.className = 'budget-amount';
            amountDiv.textContent = `$${spent.toFixed(2)} / $${budgetAmount.toFixed(2)}`;

            header.appendChild(categoryDiv);
            header.appendChild(amountDiv);

            const progressContainer = document.createElement('div');
            progressContainer.className = 'budget-progress';

            const progressBar = document.createElement('div');
            progressBar.className = 'budget-progress-bar';

            // Set width and color based on percentage
            progressBar.style.width = `${Math.min(percentage, 100)}%`;

            if (percentage >= 100) {
                progressBar.classList.add('danger');
            } else if (percentage >= 80) {
                progressBar.classList.add('warning');
            }

            progressContainer.appendChild(progressBar);

            const details = document.createElement('div');
            details.className = 'budget-details';

            const percentageDiv = document.createElement('div');
            percentageDiv.textContent = `${percentage.toFixed(1)}% used`;

            const remainingDiv = document.createElement('div');
            const remaining = budgetAmount - spent;
            remainingDiv.textContent = `$${Math.abs(remaining).toFixed(2)} ${remaining >= 0 ? 'remaining' : 'over'}`;

            details.appendChild(percentageDiv);
            details.appendChild(remainingDiv);

            const actions = document.createElement('div');
            actions.className = 'budget-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger delete-budget-btn';
            deleteBtn.setAttribute('data-category', category);
            deleteBtn.textContent = 'Delete';

            actions.appendChild(deleteBtn);

            item.appendChild(header);
            item.appendChild(progressContainer);
            item.appendChild(details);
            item.appendChild(actions);

            this.elements.budgetList.appendChild(item);
        });
    },

    // Format date for display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },

    // Show notification
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after animation completes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    FinanceTracker.init();
});
