class PrintingPressManager {
    constructor() {
        this.transactions = [];
        this.githubToken = '';
        this.repoOwner = 'laudabbeyjesse-arch';
        this.repoName = 'jpo-printing';
        this.dataFile = 'data/transactions.json';
        this.loadGitHubToken();
        this.loadData();
        this.startAutoRefresh();
    }

    loadGitHubToken() {
        const urlParams = new URLSearchParams(window.location.search);
        this.githubToken = urlParams.get('token') || '';
        
        if (this.githubToken) {
            this.updateSyncStatus('✅ Connected to GitHub');
        } else {
            this.updateSyncStatus('⚠️ Add ?token=YOUR_TOKEN to URL');
        }
    }

    async loadData() {
        if (!this.githubToken) return;

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataFile}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const content = JSON.parse(atob(data.content));
                this.transactions = content;
                this.updateDisplay();
                this.updateSyncStatus('✅ Data loaded from GitHub');
            }
        } catch (error) {
            this.updateSyncStatus('❌ Error loading data');
        }
    }

    async saveData() {
        if (!this.githubToken) {
            alert('⚠️ Add ?token=YOUR_TOKEN to URL first');
            return false;
        }

        try {
            const getResponse = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataFile}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            let sha = '';
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }

            const content = btoa(JSON.stringify(this.transactions, null, 2));
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataFile}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update: ${new Date().toLocaleString()}`,
                        content: content,
                        sha: sha
                    })
                }
            );

            if (response.ok) {
                this.updateSyncStatus('✅ Saved to GitHub');
                return true;
            }
        } catch (error) {
            this.updateSyncStatus('❌ Save failed');
        }
        return false;
    }

    updateSyncStatus(message) {
        document.getElementById('syncStatus').textContent = message;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadData();
        }, 10000); // Refresh every 10 seconds
    }

    getCurrentDateTime() {
        return new Date().toLocaleString('en-GH');
    }

    async addTransaction(type, description, amount, details = '') {
        const transaction = {
            id: Date.now().toString(),
            datetime: this.getCurrentDateTime(),
            type: type,
            description: description,
            amount: parseFloat(amount),
            details: details
        };
        
        this.transactions.push(transaction);
        const saved = await this.saveData();
        if (saved) {
            this.updateDisplay();
            alert(`✅ ${type} added!`);
        }
    }

    async deleteTransaction(id) {
        if (confirm('Delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            await this.saveData();
            this.updateDisplay();
        }
    }

    calculateTotals() {
        let totalSales = 0, totalExpenses = 0;
        this.transactions.forEach(t => {
            if (t.type === 'sale') totalSales += t.amount;
            else totalExpenses += t.amount;
        });
        return {
            sales: totalSales,
            expenses: totalExpenses,
            profit: totalSales - totalExpenses
        };
    }

    updateDisplay() {
        const totals = this.calculateTotals();
        
        document.getElementById('totalProfit').textContent = `GH₵${totals.profit.toFixed(2)}`;
        document.getElementById('totalSales').textContent = `GH₵${totals.sales.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `GH₵${totals.expenses.toFixed(2)}`;
        
        const tbody = document.getElementById('transactionsBody');
        tbody.innerHTML = '';
        
        if (this.transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No transactions yet</td></tr>';
            return;
        }
        
        this.transactions.slice().reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.datetime}</td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 12px; font-size: 0.8em; color: white; background: ${transaction.type === 'sale' ? '#27ae60' : '#e74c3c'}">
                        ${transaction.type === 'sale' ? 'SALE' : 'EXPENSE'}
                    </span>
                </td>
                <td>${transaction.description}</td>
                <td class="${transaction.type === 'sale' ? 'positive' : 'negative'}">
                    ${transaction.type === 'sale' ? '+' : '-'}GH₵${transaction.amount.toFixed(2)}
                </td>
                <td>${transaction.details || '-'}</td>
                <td>
                    <button onclick="manager.deleteTransaction('${transaction.id}')" style="background: #e74c3c; padding: 5px 10px; font-size: 12px; border: none; color: white; border-radius: 3px; cursor: pointer;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

const manager = new PrintingPressManager();

document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const type = formData.get('type');
    const description = formData.get('description');
    const amount = formData.get('amount');
    const details = formData.get('details');
    
    manager.addTransaction(type, description, amount, details);
    this.reset();
});