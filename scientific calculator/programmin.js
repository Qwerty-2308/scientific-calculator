// Programming Calculator Module
class ProgrammingCalculator {
    constructor(controller) {
        this.controller = controller;
        this.base = 'dec';
        this.operators = ['AND', 'OR', 'XOR', '<<', '>>', '+', '-', '*', '/'];
        this.init();
    }

    init() {
        this.setupBaseButtons();
        this.setupActionButtons();
        this.setBase('dec');
    }

    setupBaseButtons() {
        const programmingPanel = document.getElementById('programming-panel');
        programmingPanel.querySelectorAll('.base-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setBase(btn.dataset.base);
            });
        });
    }

    setupActionButtons() {
        const programmingGrid = document.getElementById('programming-panel').querySelector('.programming-grid');
        programmingGrid.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target || target.disabled) return;

            const value = target.dataset.value;
            const action = target.dataset.action;

            if (value) {
                // For operators, add spaces for easier parsing
                if (this.operators.includes(value)) {
                    this.controller.appendToExpression(` ${value} `);
                } else {
                    this.controller.appendToExpression(value);
                }
                this.updateLiveValues();
            } else if (action) {
                this.handleAction(action);
            }
        });
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.controller.clearDisplay();
                this.updateBaseDisplays(0);
                break;
            case 'backspace':
                this.controller.backspace();
                this.updateLiveValues();
                break;
            case 'equals':
                const result = this.evaluate(this.controller.expression);
                this.controller.addToHistory(this.controller.expression, result.toString(10));
                this.controller.expression = result.toString(this.base); // Show result in current base
                this.controller.result = result.toString(10); // Main result is always dec
                this.controller.updateDisplay();
                this.updateBaseDisplays(result);
                break;
        }
    }

    setBase(newBase) {
        const currentResult = this.evaluate(this.controller.expression);
        this.base = newBase;
        
        if (this.controller.expression) {
            this.controller.expression = currentResult.toString(this.base);
        }
        
        this.controller.updateDisplay();
        this.updateBaseDisplays(currentResult);

        const programmingPanel = document.getElementById('programming-panel');
        programmingPanel.querySelectorAll('.base-btn').forEach(btn => btn.classList.remove('active'));
        programmingPanel.querySelector(`[data-base="${newBase}"]`).classList.add('active');
        
        this.updateButtonStates();
    }

    updateButtonStates() {
        const programmingPanel = document.getElementById('programming-panel');
        const hexButtons = programmingPanel.querySelectorAll('.hex-btn');
        const numberButtons = programmingPanel.querySelectorAll('.programming-grid .btn.number');

        hexButtons.forEach(btn => {
            btn.disabled = this.base !== 'hex';
        });

        const baseLimits = { oct: 8, bin: 2 };
        const limit = baseLimits[this.base] || 10;

        numberButtons.forEach(btn => {
            const val = parseInt(btn.dataset.value, 10);
            if (!isNaN(val)) {
                btn.disabled = val >= limit;
            }
        });
    }
    
    updateLiveValues() {
        const result = this.evaluate(this.controller.expression);
        this.updateBaseDisplays(result);
    }

    evaluate(expr) {
        if (!expr) return 0;

        // This is a simple evaluator, it does not handle operator precedence or parentheses.
        const baseMap = { hex: 16, dec: 10, oct: 8, bin: 2 };
        const currentBase = baseMap[this.base];

        if (expr.startsWith('NOT ')) {
            const operand = parseInt(expr.substring(4), currentBase);
            return isNaN(operand) ? 0 : ~operand;
        }

        let operator = null;
        let operatorIndex = -1;

        for (const op of this.operators) {
            const index = expr.indexOf(` ${op} `);
            if (index > -1) {
                operator = op;
                operatorIndex = index;
                break;
            }
        }

        if (!operator) {
            const num = parseInt(expr, currentBase);
            return isNaN(num) ? 0 : num;
        }

        const operand1Str = expr.substring(0, operatorIndex).trim();
        const operand2Str = expr.substring(operatorIndex + operator.length + 2).trim();

        if (operand1Str === '' || operand2Str === '') return 0;

        const operand1 = parseInt(operand1Str, currentBase);
        const operand2 = parseInt(operand2Str, currentBase);

        if (isNaN(operand1) || isNaN(operand2)) return 0;

        switch (operator) {
            case 'AND': return operand1 & operand2;
            case 'OR': return operand1 | operand2;
            case 'XOR': return operand1 ^ operand2;
            case '<<': return operand1 << operand2;
            case '>>': return operand1 >> operand2;
            case '+': return operand1 + operand2;
            case '-': return operand1 - operand2;
            case '*': return operand1 * operand2;
            case '/': return Math.floor(operand1 / operand2);
            default: return 0;
        }
    }

    updateBaseDisplays(decimalValue) {
        const value = isNaN(decimalValue) ? 0 : parseInt(decimalValue, 10);
        document.getElementById('hex-value').textContent = (value).toString(16).toUpperCase() || '0';
        document.getElementById('dec-value').textContent = (value).toString(10) || '0';
        document.getElementById('oct-value').textContent = (value).toString(8) || '0';
        document.getElementById('bin-value').textContent = (value).toString(2) || '0';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (calculator) {
            new ProgrammingCalculator(calculator);
        }
    }, 100);
});
