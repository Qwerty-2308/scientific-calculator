// Scientific Calculator Module
class ScientificCalculator {
    constructor(controller) {
        this.controller = controller;
        this.memory = 0;
        this.angleMode = 'rad'; // 'rad' or 'deg'

        this.init();
    }

    init() {
        this.setupButtons();
        this.updateAngleModeDisplay();
    }

    setupButtons() {
        const scientificPanel = document.getElementById('scientific-panel');

        // Number buttons
        scientificPanel.querySelectorAll('.btn.number').forEach(btn => {
            btn.addEventListener('click', () => {
                this.controller.appendToExpression(btn.dataset.value);
            });
        });

        // Operator buttons
        scientificPanel.querySelectorAll('.btn.operator').forEach(btn => {
            btn.addEventListener('click', () => {
                this.controller.appendToExpression(btn.dataset.value);
            });
        });

        // Function buttons
        scientificPanel.querySelectorAll('.btn.function').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;

                // Special handling for certain functions
                if (value === '^2') {
                    this.controller.appendToExpression('^2');
                } else if (value === '^(1/3)') {
                    this.controller.appendToExpression('^(1/3)');
                } else if (value === '^(-1)') {
                    this.controller.appendToExpression('^(-1)');
                } else if (value === '!') {
                    this.controller.appendToExpression('!');
                } else if (value === '%') {
                    this.handlePercentage();
                } else if (value === '10^') {
                    this.controller.appendToExpression('10^');
                } else if (value === 'logbase(') {
                    this.controller.appendToExpression('logbase(');
                } else if (value === 'deriv(') {
                    this.controller.appendToExpression('deriv(');
                } else if (value === 'integ(') {
                    this.controller.appendToExpression('integ(');
                } else if (value === 'ans') {
                    if (this.controller.result && this.controller.result !== 'Error') {
                        this.controller.appendToExpression(this.controller.result);
                    }
                } else {
                    this.controller.appendToExpression(value);
                }
            });
        });

        // Action buttons
        scientificPanel.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.controller.clearDisplay();
                break;
            case 'backspace':
                this.controller.backspace();
                break;
            case 'equals':
                this.controller.calculate();
                break;
            case 'rad':
                this.toggleAngleMode();
                break;
            case 'mc':
                this.memoryClear();
                break;
            case 'mr':
                this.memoryRecall();
                break;
            case 'm+':
                this.memoryAdd();
                break;
            case 'm-':
                this.memorySubtract();
                break;
        }
    }

    toggleAngleMode() {
        this.angleMode = this.angleMode === 'rad' ? 'deg' : 'rad';
        this.controller.angleMode = this.angleMode;
        this.updateAngleModeDisplay();
    }

    updateAngleModeDisplay() {
        const radBtn = document.querySelector('[data-action="rad"]');
        if (radBtn) {
            radBtn.textContent = this.angleMode.toUpperCase();
            radBtn.style.color = this.angleMode === 'deg' ? 'var(--warning)' : 'var(--success)';
        }
    }

    handlePercentage() {
        if (this.controller.expression) {
            const result = this.controller.evaluateExpression(this.controller.expression);
            this.controller.expression = (result / 100).toString();
            this.controller.updateDisplay();
        }
    }

    memoryClear() {
        this.memory = 0;
        this.showMemoryIndicator(false);
    }

    memoryRecall() {
        this.controller.appendToExpression(this.memory.toString());
    }

    memoryAdd() {
        if (this.controller.result !== '0' && this.controller.result !== 'Error') {
            this.memory += parseFloat(this.controller.result);
            this.showMemoryIndicator(true);
        }
    }

    memorySubtract() {
        if (this.controller.result !== '0' && this.controller.result !== 'Error') {
            this.memory -= parseFloat(this.controller.result);
            this.showMemoryIndicator(true);
        }
    }

    showMemoryIndicator(show) {
        // Add visual indicator that memory is in use
        const mcBtn = document.querySelector('[data-action="mc"]');
        if (mcBtn) {
            if (show) {
                mcBtn.style.background = 'var(--accent-gradient)';
                mcBtn.style.color = 'white';
            } else {
                mcBtn.style.background = '';
                mcBtn.style.color = '';
            }
        }
    }
}

// Initialize scientific calculator
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (calculator) {
            const scientificCalc = new ScientificCalculator(calculator);
        }
    }, 100);
});
