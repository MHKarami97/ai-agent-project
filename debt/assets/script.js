// Database Management using IndexedDB
class LoanDatabase {
    constructor() {
        this.dbName = 'LoanCalculatorDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('calculations')) {
                    const objectStore = db.createObjectStore('calculations', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('bankName', 'bankName', { unique: false });
                }
            };
        });
    }

    async saveCalculation(data) {
        const transaction = this.db.transaction(['calculations'], 'readwrite');
        const store = transaction.objectStore('calculations');
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllCalculations() {
        const transaction = this.db.transaction(['calculations'], 'readonly');
        const store = transaction.objectStore('calculations');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCalculation(id) {
        const transaction = this.db.transaction(['calculations'], 'readwrite');
        const store = transaction.objectStore('calculations');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        const transaction = this.db.transaction(['calculations'], 'readwrite');
        const store = transaction.objectStore('calculations');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Loan Calculator Class
class LoanCalculator {
    constructor() {
        this.db = new LoanDatabase();
        this.initializeElements();
        this.attachEventListeners();
        this.init();
    }

    initializeElements() {
        this.elements = {
            bankName: document.getElementById('bankName'),
            loanAmount: document.getElementById('loanAmount'),
            depositAmount: document.getElementById('depositAmount'),
            depositPeriod: document.getElementById('depositPeriod'),
            interestRate: document.getElementById('interestRate'),
            loanPeriod: document.getElementById('loanPeriod'),
            commissionPercent: document.getElementById('commissionPercent'),
            upfrontDeduction: document.getElementById('upfrontDeduction'),
            insurancePercent: document.getElementById('insurancePercent'),
            inflationRate: document.getElementById('inflationRate'),
            calculationMethod: document.getElementById('calculationMethod'),
            calculateBtn: document.getElementById('calculateBtn'),
            saveBtn: document.getElementById('saveBtn'),
            resultsSection: document.getElementById('resultsSection'),
            realInterestRate: document.getElementById('realInterestRate'),
            actualReceived: document.getElementById('actualReceived'),
            monthlyPayment: document.getElementById('monthlyPayment'),
            totalPayment: document.getElementById('totalPayment'),
            totalInterest: document.getElementById('totalInterest'),
            endDate: document.getElementById('endDate'),
            opportunityCost: document.getElementById('opportunityCost'),
            recommendation: document.getElementById('recommendation'),
            recommendationText: document.getElementById('recommendationText'),
            toggleAmortization: document.getElementById('toggleAmortization'),
            amortizationTable: document.getElementById('amortizationTable'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn')
        };
        this.currentCalculation = null;
    }

    async init() {
        await this.db.init();
        this.loadHistory();
    }

    attachEventListeners() {
        this.elements.calculateBtn.addEventListener('click', () => this.calculate());
        this.elements.saveBtn.addEventListener('click', () => this.saveCalculation());
        this.elements.toggleAmortization.addEventListener('click', () => this.toggleAmortizationTable());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Enter key to calculate
        Object.values(this.elements).forEach(element => {
            if (element.tagName === 'INPUT') {
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.calculate();
                });
            }
        });
    }

    getInputValues() {
        return {
            bankName: this.elements.bankName.value.trim() || 'بانک',
            loanAmount: parseFloat(this.elements.loanAmount.value) || 0,
            depositAmount: parseFloat(this.elements.depositAmount.value) || 0,
            depositPeriod: parseFloat(this.elements.depositPeriod.value) || 0,
            interestRate: parseFloat(this.elements.interestRate.value) || 0,
            loanPeriod: parseFloat(this.elements.loanPeriod.value) || 0,
            commissionPercent: parseFloat(this.elements.commissionPercent.value) || 0,
            upfrontDeduction: parseFloat(this.elements.upfrontDeduction.value) || 0,
            insurancePercent: parseFloat(this.elements.insurancePercent.value) || 0,
            inflationRate: parseFloat(this.elements.inflationRate.value) || 0,
            calculationMethod: this.elements.calculationMethod.value
        };
    }

    validateInputs(inputs) {
        if (inputs.loanAmount <= 0) {
            alert('لطفاً مبلغ وام را وارد کنید');
            return false;
        }
        if (inputs.interestRate < 0) {
            alert('لطفاً نرخ سود را وارد کنید');
            return false;
        }
        if (inputs.loanPeriod <= 0) {
            alert('لطفاً مدت بازپرداخت را وارد کنید');
            return false;
        }
        return true;
    }

    calculate() {
        const inputs = this.getInputValues();
        
        if (!this.validateInputs(inputs)) return;

        const results = this.performCalculations(inputs);
        this.currentCalculation = {
            inputs,
            results,
            timestamp: new Date().toISOString()
        };

        this.displayResults(results, inputs);
        this.generateAmortizationSchedule(results.amortizationSchedule, inputs);
    }

    performCalculations(inputs) {
        const {
            loanAmount,
            depositAmount,
            depositPeriod,
            interestRate,
            loanPeriod,
            commissionPercent,
            upfrontDeduction,
            insurancePercent,
            inflationRate,
            calculationMethod
        } = inputs;

        // Calculate actual received amount
        const commissionAmount = (loanAmount * commissionPercent) / 100;
        const actualReceived = loanAmount - commissionAmount - upfrontDeduction;

        // Calculate monthly payment based on method
        let monthlyPayment, totalPayment, totalInterest, amortizationSchedule;
        
        if (calculationMethod === 'reducing') {
            const result = this.calculateReducingBalance(
                loanAmount, 
                interestRate, 
                loanPeriod, 
                insurancePercent
            );
            monthlyPayment = result.monthlyPayment;
            totalPayment = result.totalPayment;
            totalInterest = result.totalInterest;
            amortizationSchedule = result.schedule;
        } else {
            const result = this.calculateFlatRate(
                loanAmount, 
                interestRate, 
                loanPeriod, 
                insurancePercent
            );
            monthlyPayment = result.monthlyPayment;
            totalPayment = result.totalPayment;
            totalInterest = result.totalInterest;
            amortizationSchedule = result.schedule;
        }

        // Calculate opportunity cost of deposit
        const opportunityCost = depositAmount > 0 ? 
            this.calculateOpportunityCost(depositAmount, depositPeriod, inflationRate) : 0;

        // Calculate real interest rate (APR)
        const realInterestRate = this.calculateRealAPR(
            actualReceived,
            monthlyPayment,
            loanPeriod,
            opportunityCost
        );

        // Calculate end date
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + loanPeriod);

        // Calculate real value considering inflation
        const realValueLost = inflationRate > 0 ? 
            this.calculateInflationImpact(totalPayment, loanPeriod, inflationRate) : 0;

        return {
            actualReceived,
            monthlyPayment,
            totalPayment,
            totalInterest,
            opportunityCost,
            realInterestRate,
            endDate: this.formatDate(endDate),
            amortizationSchedule,
            realValueLost,
            totalCost: totalPayment + opportunityCost
        };
    }

    calculateReducingBalance(principal, annualRate, months, insuranceRate) {
        const monthlyRate = (annualRate / 12) / 100;
        const insuranceMonthlyRate = (insuranceRate / 12) / 100;
        const totalMonthlyRate = monthlyRate + insuranceMonthlyRate;
        
        // Monthly payment formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
        const monthlyPayment = principal * 
            (totalMonthlyRate * Math.pow(1 + totalMonthlyRate, months)) / 
            (Math.pow(1 + totalMonthlyRate, months) - 1);

        let balance = principal;
        const schedule = [];
        let totalInterestPaid = 0;

        for (let month = 1; month <= months; month++) {
            const interestPayment = balance * totalMonthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            totalInterestPaid += interestPayment;

            schedule.push({
                month,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance)
            });
        }

        return {
            monthlyPayment,
            totalPayment: monthlyPayment * months,
            totalInterest: totalInterestPaid,
            schedule
        };
    }

    calculateFlatRate(principal, annualRate, months, insuranceRate) {
        const totalRate = annualRate + insuranceRate;
        const totalInterest = (principal * totalRate * (months / 12)) / 100;
        const totalPayment = principal + totalInterest;
        const monthlyPayment = totalPayment / months;

        const schedule = [];
        const monthlyPrincipal = principal / months;
        const monthlyInterest = totalInterest / months;
        let balance = principal;

        for (let month = 1; month <= months; month++) {
            balance -= monthlyPrincipal;
            schedule.push({
                month,
                payment: monthlyPayment,
                principal: monthlyPrincipal,
                interest: monthlyInterest,
                balance: Math.max(0, balance)
            });
        }

        return {
            monthlyPayment,
            totalPayment,
            totalInterest,
            schedule
        };
    }

    calculateOpportunityCost(depositAmount, depositPeriod, inflationRate) {
        // Calculate the real value lost due to inflation during deposit period
        const monthlyInflationRate = (inflationRate / 12) / 100;
        const realValueLost = depositAmount * (1 - Math.pow(1 + monthlyInflationRate, -depositPeriod));
        return realValueLost;
    }

    calculateRealAPR(actualReceived, monthlyPayment, months, opportunityCost) {
        // Use Newton-Raphson method to find IRR
        const totalPaid = monthlyPayment * months + opportunityCost;
        
        if (actualReceived <= 0 || months <= 0) return 0;
        
        // Simple approximation
        const totalInterest = totalPaid - actualReceived;
        const avgBalance = actualReceived / 2;
        const years = months / 12;
        const apr = (totalInterest / avgBalance / years) * 100;
        
        return apr;
    }

    calculateInflationImpact(totalPayment, months, inflationRate) {
        const monthlyInflationRate = (inflationRate / 12) / 100;
        const futureValue = totalPayment * Math.pow(1 + monthlyInflationRate, months);
        return futureValue - totalPayment;
    }

    displayResults(results, inputs) {
        this.elements.resultsSection.style.display = 'block';
        
        // Animate numbers
        this.animateNumber(this.elements.realInterestRate, results.realInterestRate, '%', 1);
        this.animateNumber(this.elements.actualReceived, results.actualReceived, ' تومان');
        this.animateNumber(this.elements.monthlyPayment, results.monthlyPayment, ' تومان');
        this.animateNumber(this.elements.totalPayment, results.totalPayment, ' تومان');
        this.animateNumber(this.elements.totalInterest, results.totalInterest, ' تومان');
        this.animateNumber(this.elements.opportunityCost, results.opportunityCost, ' تومان');
        
        this.elements.endDate.textContent = results.endDate;

        // Display recommendation
        this.displayRecommendation(results, inputs);

        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    displayRecommendation(results, inputs) {
        const { realInterestRate, actualReceived, totalCost } = results;
        const { loanAmount, interestRate } = inputs;
        
        let recommendation = '';
        let cssClass = '';

        const costRatio = (totalCost / actualReceived - 1) * 100;
        
        if (realInterestRate < 15) {
            cssClass = 'good';
            recommendation = `✅ این وام شرایط نسبتاً خوبی دارد. نرخ سود واقعی ${realInterestRate.toFixed(1)}% است که در شرایط فعلی قابل قبول است. `;
        } else if (realInterestRate < 25) {
            cssClass = '';
            recommendation = `⚠️ این وام شرایط متوسطی دارد. نرخ سود واقعی ${realInterestRate.toFixed(1)}% است. `;
        } else {
            cssClass = 'bad';
            recommendation = `❌ این وام شرایط مناسبی ندارد! نرخ سود واقعی ${realInterestRate.toFixed(1)}% بسیار بالاست. `;
        }

        recommendation += `\n\nشما در مجموع ${costRatio.toFixed(1)}% بیشتر از آنچه دریافت می‌کنید باید پرداخت کنید. `;
        
        if (inputs.depositAmount > 0) {
            recommendation += `\n\nتوجه: شما ${this.formatNumber(inputs.depositAmount)} تومان باید ${inputs.depositPeriod} ماه قبل از دریافت وام سپرده‌گذاری کنید که هزینه فرصت آن ${this.formatNumber(results.opportunityCost)} تومان است.`;
        }

        if (inputs.commissionPercent > 2 || inputs.upfrontDeduction > 0) {
            recommendation += `\n\nهزینه‌های اولیه (کارمزد و کسورات) نیز بالا است و باعث کاهش مبلغ دریافتی شده است.`;
        }

        this.elements.recommendation.className = `result-card recommendation ${cssClass}`;
        this.elements.recommendationText.textContent = recommendation;
    }

    generateAmortizationSchedule(schedule, inputs) {
        let html = '<table class="amortization-table"><thead><tr>';
        html += '<th>ماه</th>';
        html += '<th>قسط</th>';
        html += '<th>اصل وام</th>';
        html += '<th>سود</th>';
        html += '<th>مانده</th>';
        html += '</tr></thead><tbody>';

        schedule.forEach(row => {
            html += '<tr>';
            html += `<td>${row.month}</td>`;
            html += `<td>${this.formatNumber(row.payment)}</td>`;
            html += `<td>${this.formatNumber(row.principal)}</td>`;
            html += `<td>${this.formatNumber(row.interest)}</td>`;
            html += `<td>${this.formatNumber(row.balance)}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        this.elements.amortizationTable.innerHTML = html;
    }

    toggleAmortizationTable() {
        const table = this.elements.amortizationTable;
        const button = this.elements.toggleAmortization;
        
        if (table.style.display === 'none') {
            table.style.display = 'block';
            button.textContent = 'پنهان کردن جدول';
        } else {
            table.style.display = 'none';
            button.textContent = 'نمایش جدول کامل';
        }
    }

    async saveCalculation() {
        if (!this.currentCalculation) {
            alert('ابتدا محاسبات را انجام دهید');
            return;
        }

        try {
            await this.db.saveCalculation(this.currentCalculation);
            alert('محاسبات ذخیره شد');
            this.loadHistory();
        } catch (error) {
            console.error('Error saving calculation:', error);
            alert('خطا در ذخیره‌سازی');
        }
    }

    async loadHistory() {
        try {
            const calculations = await this.db.getAllCalculations();
            this.displayHistory(calculations.reverse()); // Show newest first
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    displayHistory(calculations) {
        if (calculations.length === 0) {
            this.elements.historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">هنوز محاسبه‌ای ذخیره نشده است</p>';
            return;
        }

        let html = '';
        calculations.forEach(calc => {
            const date = new Date(calc.timestamp);
            html += `<div class="history-item" data-id="${calc.id}">`;
            html += `<h4>${calc.inputs.bankName} - ${this.formatNumber(calc.inputs.loanAmount)} تومان</h4>`;
            html += `<p>📅 تاریخ: ${this.formatDate(date)}</p>`;
            html += `<p>💰 قسط ماهانه: ${this.formatNumber(calc.results.monthlyPayment)} تومان</p>`;
            html += `<p>📊 نرخ سود واقعی: ${calc.results.realInterestRate.toFixed(2)}%</p>`;
            html += `<p>⏱️ مدت: ${calc.inputs.loanPeriod} ماه</p>`;
            html += `<button class="delete-btn" onclick="calculator.deleteCalculation(${calc.id})">حذف</button>`;
            html += `</div>`;
        });

        this.elements.historyList.innerHTML = html;

        // Add click handlers to load calculation
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    const id = parseInt(item.dataset.id);
                    this.loadCalculation(id, calculations);
                }
            });
        });
    }

    loadCalculation(id, calculations) {
        const calc = calculations.find(c => c.id === id);
        if (!calc) return;

        // Load inputs
        this.elements.bankName.value = calc.inputs.bankName;
        this.elements.loanAmount.value = calc.inputs.loanAmount;
        this.elements.depositAmount.value = calc.inputs.depositAmount;
        this.elements.depositPeriod.value = calc.inputs.depositPeriod;
        this.elements.interestRate.value = calc.inputs.interestRate;
        this.elements.loanPeriod.value = calc.inputs.loanPeriod;
        this.elements.commissionPercent.value = calc.inputs.commissionPercent;
        this.elements.upfrontDeduction.value = calc.inputs.upfrontDeduction;
        this.elements.insurancePercent.value = calc.inputs.insurancePercent;
        this.elements.inflationRate.value = calc.inputs.inflationRate;
        this.elements.calculationMethod.value = calc.inputs.calculationMethod;

        // Recalculate
        this.calculate();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async deleteCalculation(id) {
        if (!confirm('آیا از حذف این محاسبه اطمینان دارید؟')) return;

        try {
            await this.db.deleteCalculation(id);
            this.loadHistory();
        } catch (error) {
            console.error('Error deleting calculation:', error);
            alert('خطا در حذف محاسبه');
        }
    }

    async clearHistory() {
        if (!confirm('آیا از حذف تمام تاریخچه محاسبات اطمینان دارید؟')) return;

        try {
            await this.db.clearAll();
            this.loadHistory();
            alert('تاریخچه پاک شد');
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('خطا در پاک کردن تاریخچه');
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat('fa-IR').format(Math.round(number));
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    animateNumber(element, endValue, suffix = '', decimals = 0) {
        const duration = 1000;
        const startValue = 0;
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuad = progress * (2 - progress);
            const currentValue = startValue + (endValue - startValue) * easeOutQuad;
            
            element.textContent = this.formatNumber(currentValue) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = this.formatNumber(endValue) + suffix;
            }
        };

        requestAnimationFrame(updateNumber);
    }
}

// Initialize the calculator when DOM is loaded
let calculator;
document.addEventListener('DOMContentLoaded', () => {
    calculator = new LoanCalculator();
});

