// Main Calculator Controller
class CalculatorController {
    constructor() {
        this.currentMode = 'scientific';
        this.expression = '';
        this.result = '0';
        this.memory = 0;
        this.history = [];
        this.angleMode = 'rad'; // 'rad' or 'deg'

        this.init();
    }

    init() {
        this.setupModeSwitch();
        this.setupDisplay();
        this.setupKeyboard();
        this.loadHistory();
    }

    setupModeSwitch() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.mode-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active panel
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(`${mode}-panel`).classList.add('active');

                this.currentMode = mode;
                this.clearDisplay();
            });
        });
    }

    setupDisplay() {
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
    }

    updateDisplay() {
        this.expressionEl.textContent = this.expression || '';
        this.resultEl.textContent = this.result;
    }

    clearDisplay() {
        this.expression = '';
        this.result = '0';
        this.updateDisplay();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.currentMode !== 'scientific' && this.currentMode !== 'programming') return;

            const key = e.key;

            // Numbers and decimal
            if (/[0-9.]/.test(key)) {
                this.appendToExpression(key);
            }
            // Operators
            else if (['+', '-', '*', '/', '(', ')'].includes(key)) {
                this.appendToExpression(key);
            }
            // Enter for equals
            else if (key === 'Enter') {
                e.preventDefault();
                this.calculate();
            }
            // Backspace
            else if (key === 'Backspace') {
                this.backspace();
            }
            // Escape for clear
            else if (key === 'Escape') {
                this.clearDisplay();
            }
        });
    }

    appendToExpression(value) {
        this.expression += value;
        this.updateDisplay();
    }

    backspace() {
        this.expression = this.expression.slice(0, -1);
        this.updateDisplay();
    }

    calculate() {
        if (!this.expression) return; // Keep this check to prevent empty calculations

        try {
            this.addToHistory(this.expression); // Use this.expression as currentExpression

            const result = this.evaluateExpression(this.expression);

            // Check if result is a string (symbolic) or number
            if (typeof result === 'string') {
                // Symbolic result - display as is
                this.result = result;
                this.updateDisplay();
            } else {
                // Numerical result - format it
                const formatted = this.formatResult(result);
                this.result = formatted;
                this.updateDisplay();
            }

            this.isNewCalculation = true;
        } catch (error) {
            console.error("Calculation error:", error);
            this.result = 'Error';
            this.updateDisplay();
        }
    }

    parseExpression(expr) {
        // Replace mathematical symbols with JavaScript operators
        let parsed = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, Math.PI.toString())
            .replace(/e(?![0-9])/g, Math.E.toString());

        return parsed;
    }

    evaluateExpression(expr) {
        // Pre-process expression for Nerdamer
        let processed = expr;

        // Replace UI-friendly symbols with Nerdamer-friendly ones
        processed = processed.replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'pi')
            .replace(/e/g, 'e')
            .replace(/\^/g, '^')
            .replace(/ln\(/g, 'log(') // Nerdamer uses log for natural log
            .replace(/log\(/g, 'log10(') // We'll need to define log10 or use change of base
            .replace(/asin\(/g, 'asin(')
            .replace(/acos\(/g, 'acos(')
            .replace(/atan\(/g, 'atan(')
            .replace(/√\(/g, 'sqrt(');

        // Handle custom functions that Nerdamer might not support directly or needs mapping
        // logbase(x, base) -> log(x)/log(base)
        processed = processed.replace(/logbase\(([^,]+),([^)]+)\)/g, 'log($1)/log($2)');

        // 10^x -> 10^x (Nerdamer handles this)

        // deriv(expr, var, val) -> diff(expr, var) then substitute val
        // deriv(expr) -> diff(expr, x)
        // We need to handle the variable arguments.
        // Let's try to let Nerdamer parse it if we map our syntax to theirs.
        // Nerdamer uses diff(expr, var)
        // We used deriv(expr, var, val) for numerical.

        // Let's try to use Nerdamer for everything first.
        try {
            // Define log10 for Nerdamer if not exists
            // nerdamer.setFunction('log10', ['x'], 'log(x)/log(10)');

            // Handle specific syntax transformations for our custom buttons
            if (processed.includes('deriv(')) {
                // Check if it's symbolic (2 args) or numerical (3 args)
                // This regex is a bit simplistic, might need more robustness for nested parens
                // For now, let's assume the user follows the syntax helper

                // Case 1: deriv(expr, var, val) -> numerical
                // Case 2: deriv(expr, var) -> symbolic
                // Case 3: deriv(expr) -> symbolic (assume x)

                // We'll rely on Nerdamer's diff function.
                processed = processed.replace(/deriv\(/g, 'diff(');
            }

            if (processed.includes('integ(')) {
                // integ(expr, var, start, end) -> defint(expr, start, end, var)
                // integ(expr, var) -> integrate(expr, var)

                // We need to parse this to rearrange arguments for Nerdamer's defint
                // This is hard to do with simple regex if arguments are complex.
                // Let's try to catch the function call and parse args manually if needed.
                // For now, let's map 'integ' to 'integrate' which does indefinite integral
                // For definite integral, Nerdamer uses 'defint(expr, lower, upper, var)'

                // Regex for 4 args: integ(a, b, c, d) -> defint(a, c, d, b)
                processed = processed.replace(/integ\(([^,]+),([^,]+),([^,]+),([^)]+)\)/g, 'defint($1, $3, $4, $2)');
                processed = processed.replace(/integ\(/g, 'integrate(');
            }

            // Evaluate using Nerdamer
            // 'evaluate' tries to return a number if possible, 'text' returns string
            const result = nerdamer(processed);

            // Check if we can get a numeric value
            const textResult = result.text();
            const numericResult = result.evaluate().text();

            // If the result is a simple number, return it
            if (!isNaN(parseFloat(numericResult)) && isFinite(numericResult) && !numericResult.includes('i')) {
                return parseFloat(numericResult);
            }

            // Otherwise return the symbolic text
            return textResult;

        } catch (e) {
            console.error("Nerdamer evaluation failed, falling back to safeMathEval", e);
            // Fallback to previous numerical method if Nerdamer fails (e.g. for custom JS logic)
            return this.fallbackEval(expr);
        }
    }

    fallbackEval(expr) {
        // Previous replaceFunctions and safeMathEval logic
        expr = this.replaceFunctions(expr);
        return this.safeMathEval(expr);
    }

    replaceFunctions(expr) {
        // Handle scientific functions
        const angleConversion = this.angleMode === 'deg' ? '* Math.PI / 180' : '';

        // Trigonometric functions
        expr = expr.replace(/sin\(/g, `Math.sin(`);
        expr = expr.replace(/cos\(/g, `Math.cos(`);
        expr = expr.replace(/tan\(/g, `Math.tan(`);

        // Hyperbolic functions
        expr = expr.replace(/sinh\(/g, `Math.sinh(`);
        expr = expr.replace(/cosh\(/g, `Math.cosh(`);
        expr = expr.replace(/tanh\(/g, `Math.tanh(`);

        // Inverse trig functions
        expr = expr.replace(/asin\(/g, `Math.asin(`);
        expr = expr.replace(/acos\(/g, `Math.acos(`);
        expr = expr.replace(/atan\(/g, `Math.atan(`);

        // Logarithmic functions
        expr = expr.replace(/log\(/g, `Math.log10(`);
        expr = expr.replace(/ln\(/g, `Math.log(`);
        expr = expr.replace(/logbase\(/g, `this.logBase(`);

        // Other functions
        expr = expr.replace(/sqrt\(/g, `Math.sqrt(`);
        expr = expr.replace(/abs\(/g, `Math.abs(`);
        expr = expr.replace(/exp\(/g, `Math.exp(`);

        // Calculus functions (Numerical Fallback)
        // These need to be handled carefully as they take expressions as strings
        // We'll use a regex to capture the arguments and transform them into a function call
        // deriv(expr, var, val) -> this.derivative('expr', 'var', val)
        expr = expr.replace(/deriv\(([^,]+),([^,]+),([^)]+)\)/g, (match, e, v, val) => {
            return `this.derivative('${e.trim()}', '${v.trim()}', ${val.trim()})`;
        });

        // integ(expr, var, start, end) -> this.integral('expr', 'var', start, end)
        expr = expr.replace(/integ\(([^,]+),([^,]+),([^,]+),([^)]+)\)/g, (match, e, v, start, end) => {
            return `this.integral('${e.trim()}', '${v.trim()}', ${start.trim()}, ${end.trim()})`;
        });

        // Power
        expr = expr.replace(/\^/g, '**');

        // Factorial
        expr = this.replaceFactorial(expr);

        return expr;
    }

    replaceFactorial(expr) {
        // Replace factorial notation with function call
        return expr.replace(/(\d+)!/g, (match, num) => {
            return `this.factorial(${num})`;
        });
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    logBase(x, base) {
        return Math.log(x) / Math.log(base);
    }

    derivative(exprStr, variable, value) {
        // ... (Keep existing numerical logic)
        const h = 1e-5; // Step size
        const f = (x) => {
            // Replace variable with value
            const evalExpr = exprStr.replace(new RegExp(`\\b${variable}\\b`, 'g'), `(${x})`);
            // Recursively evaluate (handles nested functions)
            // Note: This is a simplified evaluation for the derivative
            // In a real app, we'd need a more robust parser/evaluator available here
            // For now, we'll use a temporary calculator instance or similar logic
            // But since we are inside evaluateExpression, we can't easily recurse into this.evaluateExpression 
            // without infinite loops if we aren't careful.
            // Let's try a direct eval approach for the inner expression, assuming it's already processed or simple.
            // Actually, we need to process the expression string to be valid JS first (e.g. sin -> Math.sin)
            // This is tricky. A better approach for this simple calc is to assume standard JS math syntax 
            // or re-use replaceFunctions logic.

            const processed = this.replaceFunctions(evalExpr);
            // But replaceFunctions expects 'deriv(...)' which we don't want to re-process infinitely
            // We'll strip calculus functions for the inner loop or assume simple expressions for now.

            // Let's use a helper that applies the standard replacements
            return this.safeMathEval(processed);
        };

        return (f(value + h) - f(value - h)) / (2 * h);
    }

    integral(exprStr, variable, start, end) {
        // ... (Keep existing numerical logic)
        const n = 1000; // Number of steps
        const h = (end - start) / n;
        let sum = 0;

        const f = (x) => {
            const evalExpr = exprStr.replace(new RegExp(`\\b${variable}\\b`, 'g'), `(${x})`);
            const processed = this.replaceFunctions(evalExpr);
            return this.safeMathEval(processed);
        };

        // Simpson's Rule
        sum += f(start) + f(end);
        for (let i = 1; i < n; i++) {
            const x = start + i * h;
            sum += (i % 2 === 0 ? 2 : 4) * f(x);
        }

        return (sum * h) / 3;
    }

    safeMathEval(expr) {
        const factorial = this.factorial.bind(this);
        const logBase = this.logBase.bind(this);
        const derivative = this.derivative.bind(this);
        const integral = this.integral.bind(this);

        try {
            const func = new Function('Math', 'factorial', 'logBase', 'derivative', 'integral', `"use strict"; return (${expr});`);
            return func(Math, factorial, logBase, derivative, integral);
        } catch (e) {
            console.error("Eval error:", e);
            return NaN;
        }
    }

    formatResult(num) {
        if (isNaN(num)) return 'Error';
        if (!isFinite(num)) return 'Infinity';

        // Handle very large or very small numbers
        if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }

        // Round to avoid floating point errors
        return parseFloat(num.toFixed(10)).toString();
    }

    addToHistory(expression, result) {
        const historyItem = { expression, result, timestamp: Date.now() };
        this.history.unshift(historyItem);

        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history.pop();
        }

        this.saveHistory();
        this.updateHistoryDisplay();
    }

    saveHistory() {
        localStorage.setItem('calculator_history', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('calculator_history');
        if (saved) {
            this.history = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-expression">${item.expression}</span>
                <span class="history-result">= ${item.result}</span>
            `;

            historyItem.addEventListener('click', () => {
                this.expression = item.expression;
                this.result = item.result;
                this.updateDisplay();
            });

            historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.updateHistoryDisplay();
    }
}

// Initialize calculator when DOM is loaded
let calculator;

document.addEventListener('DOMContentLoaded', () => {
    calculator = new CalculatorController();

    // Setup clear history button
    document.getElementById('clear-history').addEventListener('click', () => {
        calculator.clearHistory();
    });
});
