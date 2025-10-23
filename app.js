class PrintingPressManager {
    constructor() {
        this.transactions = this.loadData();
        this.updateDisplay();
    }

    loadData() {
        const saved = localStorage.getItem('jpoTransactions');
        return saved ? JSON.parse(saved) : [];
    }

    saveData() {
        localStorage.setItem('jpoTransactions', JSON.stringify(this.transactions));
    }

    getCurrentDateTime() {
        return new Date().toLocaleString('en-GH');
    }

    addTransaction(type, description, amount, details = '') {
        const transaction = {
            id: Date.now(),
            datetime: this.getCurrentDateTime(),
            type: type,
            description: description,
            amount: parseFloat(amount),
            details: details
        };
        
        this.transactions.push(transaction);
        this.saveData();
        this.updateDisplay();
        
        // Show success message
        alert(`✅ ${type === 'sale' ? 'Sale' : 'Expense'} added successfully!`);
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.updateDisplay();
        }
    }

    calculateTotals() {
        let totalSales = 0;
        let totalExpenses = 0;
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'sale') {
                totalSales += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
            }
        });
        
        return {
            sales: totalSales,
            expenses: totalExpenses,
            profit: totalSales - totalExpenses
        };
    }

    updateDisplay() {
        const totals = this.calculateTotals();
        
        // Update summary cards
        document.getElementById('totalProfit').textContent = `GH₵${totals.profit.toFixed(2)}`;
        document.getElementById('totalSales').textContent = `GH₵${totals.sales.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `GH₵${totals.expenses.toFixed(2)}`;
        
        // Update transactions table
        const tbody = document.getElementById('transactionsBody');
        tbody.innerHTML = '';
        
        if (this.transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No transactions yet. Add your first transaction above!</td></tr>';
            return;
        }
        
        // Show transactions in reverse order (newest first)
        this.transactions.slice().reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.datetime}</td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 12px; font-size: 0.8em; color: white; background: ${transaction.type === 'sale' ? '#27ae60' : '#e74c3c'}">
                        ${transaction.type === 'sale' ? '💰 SALE' : '💸 EXPENSE'}
                    </span>
                </td>
                <td>${transaction.description}</td>
                <td class="${transaction.type === 'sale' ? 'positive' : 'negative'}">
                    ${transaction.type === 'sale' ? '+' : '-'}GH₵${transaction.amount.toFixed(2)}
                </td>
                <td>${transaction.details || '-'}</td>
                <td>
                    <button onclick="manager.deleteTransaction(${transaction.id})" style="background: #e74c3c; padding: 5px 10px; font-size: 12px; border: none; color: white; border-radius: 3px; cursor: pointer;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Initialize the manager
const manager = new PrintingPressManager();

// Handle form submission
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const type = formData.get('type');
    const description = formData.get('description');
    const amount = formData.get('amount');
    const details = formData.get('details');
    
    manager.addTransaction(type, description, amount, details);
    
    // Reset form
    this.reset();
});

// Add some sample data if empty
if (manager.transactions.length === 0) {
    // Add sample transactions after a short delay
    setTimeout(() => {
        manager.addTransaction('sale', 'Business Cards - ABC Company', 2500.00, '500 pieces, glossy finish');
        manager.addTransaction('sale', 'Vinyl Banner - XYZ Store', 4500.00, 'Large 10x5 feet banner');
        manager.addTransaction('expense', 'A4 Glossy Paper', 1200.00, '20 reams for stock');
        manager.addTransaction('expense', 'Ink Cartridges', 1800.00, 'CMYK full set');
    }, 1000);
}