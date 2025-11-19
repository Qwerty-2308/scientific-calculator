// Advanced Graphing Calculator Module
class GraphingCalculator {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.functions = [];
        this.graphType = 'cartesian';
        this.colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#f97316'];

        // View settings
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.zoom = 1;

        // Mouse interaction
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.init();
    }

    init() {
        this.setupControls();
        this.setupMouseInteraction();
        this.setupResizeObserver();
        this.addFunction(); // Add initial function input
        this.loadExamples();

        // Initial resize
        this.resize();
    }

    setupResizeObserver() {
        const container = this.canvas.parentElement;
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        this.resizeObserver.observe(container);
    }

    resize() {
        const container = this.canvas.parentElement;
        if (container.clientWidth === 0 || container.clientHeight === 0) return;

        const size = Math.min(container.clientWidth - 40, container.clientHeight - 40);

        // Enable high DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        this.ctx.scale(dpr, dpr);
        this.canvasSize = size;

        this.plot();
    }

    setupControls() {
        // Graph type selector
        document.getElementById('graph-type').addEventListener('change', (e) => {
            this.graphType = e.target.value;
            this.updateFunctionInputs();
            this.plot();
        });

        // Range controls
        const rangeInputs = ['x-min', 'x-max', 'y-min', 'y-max'];
        rangeInputs.forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    if (id === 'x-min') this.xMin = val;
                    if (id === 'x-max') this.xMax = val;
                    if (id === 'y-min') this.yMin = val;
                    if (id === 'y-max') this.yMax = val;
                    this.plot();
                }
            });
        });

        // Action buttons
        document.getElementById('add-function').addEventListener('click', () => {
            this.addFunction();
        });

        document.getElementById('plot-btn').addEventListener('click', () => {
            this.plot();
        });

        document.getElementById('reset-view-btn').addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('export-graph-btn').addEventListener('click', () => {
            this.exportGraph();
        });
    }

    setupMouseInteraction() {
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            this.zoomGraph(zoomFactor);
        });

        // Mouse drag for pan
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.offsetX;
            this.lastMouseY = e.offsetY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.offsetX - this.lastMouseX;
                const dy = e.offsetY - this.lastMouseY;
                this.panGraph(dx, dy);
                this.lastMouseX = e.offsetX;
                this.lastMouseY = e.offsetY;
            } else {
                this.updateCursorInfo(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            document.getElementById('graph-info').textContent = '';
        });
    }

    addFunction() {
        const functionsList = document.getElementById('functions-list');
        const functionIndex = this.functions.length;
        const color = this.colors[functionIndex % this.colors.length];

        const functionItem = document.createElement('div');
        functionItem.className = 'function-item';
        functionItem.innerHTML = `
            <input type="color" class="color-picker" value="${color}">
            <input type="text" class="function-input" placeholder="${this.getFunctionPlaceholder()}" data-index="${functionIndex}">
            <button class="remove-function">×</button>
        `;

        const functionData = {
            expression: '',
            color: color,
            enabled: true
        };
        this.functions.push(functionData);

        const input = functionItem.querySelector('.function-input');
        const colorPicker = functionItem.querySelector('.color-picker');
        const removeBtn = functionItem.querySelector('.remove-function');

        input.addEventListener('input', (e) => {
            this.functions[functionIndex].expression = e.target.value;
            // Debounce plot
            if (this.plotTimeout) clearTimeout(this.plotTimeout);
            this.plotTimeout = setTimeout(() => this.plot(), 300);
        });

        colorPicker.addEventListener('change', (e) => {
            this.functions[functionIndex].color = e.target.value;
            this.plot();
        });

        removeBtn.addEventListener('click', () => {
            functionItem.remove();
            // We don't remove from array to keep indices stable, just disable
            this.functions[functionIndex].enabled = false;
            this.plot();
        });

        functionsList.appendChild(functionItem);
    }

    getFunctionPlaceholder() {
        const placeholders = {
            cartesian: 'e.g., sin(x), x^2, logbase(x,2), deriv(x^2,x)',
            parametric: 'x: cos(t), y: sin(t)',
            polar: 'e.g., 1 + sin(θ), 2*cos(3*θ)',
            implicit: 'e.g., x^2 + y^2 - 1'
        };
        return placeholders[this.graphType] || '';
    }

    updateFunctionInputs() {
        const inputs = document.querySelectorAll('.function-input');
        inputs.forEach(input => {
            input.placeholder = this.getFunctionPlaceholder();
        });
    }

    zoomGraph(factor) {
        const xCenter = (this.xMin + this.xMax) / 2;
        const yCenter = (this.yMin + this.yMax) / 2;
        const xRange = (this.xMax - this.xMin) * factor / 2;
        const yRange = (this.yMax - this.yMin) * factor / 2;

        this.xMin = xCenter - xRange;
        this.xMax = xCenter + xRange;
        this.yMin = yCenter - yRange;
        this.yMax = yCenter + yRange;

        this.updateRangeInputs();
        this.plot();
    }

    panGraph(dx, dy) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xShift = -(dx / this.canvasSize) * xRange;
        const yShift = (dy / this.canvasSize) * yRange;

        this.xMin += xShift;
        this.xMax += xShift;
        this.yMin += yShift;
        this.yMax += yShift;

        this.updateRangeInputs();
        this.plot();
    }

    updateRangeInputs() {
        document.getElementById('x-min').value = this.xMin.toFixed(2);
        document.getElementById('x-max').value = this.xMax.toFixed(2);
        document.getElementById('y-min').value = this.yMin.toFixed(2);
        document.getElementById('y-max').value = this.yMax.toFixed(2);
    }

    updateCursorInfo(e) {
        const x = this.screenToWorldX(e.offsetX);
        const y = this.screenToWorldY(e.offsetY);
        document.getElementById('graph-info').textContent = `x: ${x.toFixed(3)}, y: ${y.toFixed(3)}`;
    }

    resetView() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.updateRangeInputs();
        this.plot();
    }

    plot() {
        if (!this.ctx || !this.canvasSize) return;

        requestAnimationFrame(() => {
            this.clearCanvas();
            this.drawGrid();
            this.drawAxes();

            this.functions.forEach((func, index) => {
                if (!func.expression || !func.enabled) return;

                this.ctx.strokeStyle = func.color;
                this.ctx.lineWidth = 2;

                try {
                    switch (this.graphType) {
                        case 'cartesian':
                            this.plotCartesian(func.expression);
                            break;
                        case 'parametric':
                            this.plotParametric(func.expression);
                            break;
                        case 'polar':
                            this.plotPolar(func.expression);
                            break;
                        case 'implicit':
                            this.plotImplicit(func.expression);
                            break;
                    }
                } catch (error) {
                    console.warn(`Error plotting function ${index}:`, error);
                }
            });
        });
    }

    clearCanvas() {
        this.ctx.fillStyle = '#141B3A';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        this.ctx.lineWidth = 1;

        const xStep = this.getGridStep(this.xMax - this.xMin);
        const yStep = this.getGridStep(this.yMax - this.yMin);

        // Vertical grid lines
        const startX = Math.floor(this.xMin / xStep) * xStep;
        for (let x = startX; x <= this.xMax; x += xStep) {
            const screenX = this.worldToScreenX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvasSize);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        const startY = Math.floor(this.yMin / yStep) * yStep;
        for (let y = startY; y <= this.yMax; y += yStep) {
            const screenY = this.worldToScreenY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvasSize, screenY);
            this.ctx.stroke();
        }
    }

    getGridStep(range) {
        const roughStep = range / 10;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;

        if (normalizedStep < 1.5) return magnitude;
        if (normalizedStep < 3.5) return 2 * magnitude;
        if (normalizedStep < 7.5) return 5 * magnitude;
        return 10 * magnitude;
    }

    drawAxes() {
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        this.ctx.lineWidth = 2;

        // X-axis
        const yZero = this.worldToScreenY(0);
        if (yZero >= 0 && yZero <= this.canvasSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(this.canvasSize, yZero);
            this.ctx.stroke();
        }

        // Y-axis
        const xZero = this.worldToScreenX(0);
        if (xZero >= 0 && xZero <= this.canvasSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, this.canvasSize);
            this.ctx.stroke();
        }

        this.drawAxisLabels();
    }

    drawAxisLabels() {
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';

        const xStep = this.getGridStep(this.xMax - this.xMin);
        const yStep = this.getGridStep(this.yMax - this.yMin);

        // X-axis labels
        const startX = Math.floor(this.xMin / xStep) * xStep;
        for (let x = startX; x <= this.xMax; x += xStep) {
            if (Math.abs(x) < xStep / 100) continue; // Skip zero
            const screenX = this.worldToScreenX(x);
            const yZero = Math.max(20, Math.min(this.canvasSize - 5, this.worldToScreenY(0) + 15));
            this.ctx.fillText(parseFloat(x.toFixed(5)), screenX, yZero);
        }

        // Y-axis labels
        this.ctx.textAlign = 'right';
        const startY = Math.floor(this.yMin / yStep) * yStep;
        for (let y = startY; y <= this.yMax; y += yStep) {
            if (Math.abs(y) < yStep / 100) continue; // Skip zero
            const screenY = this.worldToScreenY(y);
            const xZero = Math.max(35, Math.min(this.canvasSize - 5, this.worldToScreenX(0) - 5));
            this.ctx.fillText(parseFloat(y.toFixed(5)), xZero, screenY + 4);
        }
    }

    plotCartesian(expression) {
        const samples = this.canvasSize; // One sample per pixel
        const step = (this.xMax - this.xMin) / samples;

        this.ctx.beginPath();
        let started = false;

        for (let i = 0; i <= samples; i++) {
            const x = this.xMin + i * step;
            try {
                const y = this.evaluateExpression(expression, { x });

                if (isFinite(y)) {
                    const screenX = this.worldToScreenX(x);
                    const screenY = this.worldToScreenY(y);

                    // Clip to reasonable bounds to avoid drawing issues
                    if (screenY >= -this.canvasSize && screenY <= 2 * this.canvasSize) {
                        if (!started) {
                            this.ctx.moveTo(screenX, screenY);
                            started = true;
                        } else {
                            this.ctx.lineTo(screenX, screenY);
                        }
                    } else {
                        started = false;
                    }
                } else {
                    started = false;
                }
            } catch (e) {
                started = false;
            }
        }

        this.ctx.stroke();
    }

    plotParametric(expressions) {
        const parts = expressions.split(',').map(s => s.trim());
        if (parts.length < 2) return;

        const xExpr = parts[0].replace(/^x\s*[:=]\s*/i, '');
        const yExpr = parts[1].replace(/^y\s*[:=]\s*/i, '');

        const samples = 1000;
        const tMin = -10;
        const tMax = 10;
        const step = (tMax - tMin) / samples;

        this.ctx.beginPath();
        let started = false;

        for (let i = 0; i <= samples; i++) {
            const t = tMin + i * step;
            try {
                const x = this.evaluateExpression(xExpr, { t });
                const y = this.evaluateExpression(yExpr, { t });

                if (isFinite(x) && isFinite(y)) {
                    const screenX = this.worldToScreenX(x);
                    const screenY = this.worldToScreenY(y);

                    if (!started) {
                        this.ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                } else {
                    started = false;
                }
            } catch (e) {
                started = false;
            }
        }

        this.ctx.stroke();
    }

    plotPolar(expression) {
        const samples = 1000;
        const thetaMax = 4 * Math.PI;
        const step = thetaMax / samples;

        this.ctx.beginPath();
        let started = false;

        for (let i = 0; i <= samples; i++) {
            const theta = i * step;
            try {
                const r = this.evaluateExpression(expression, { θ: theta, theta });

                if (isFinite(r)) {
                    const x = r * Math.cos(theta);
                    const y = r * Math.sin(theta);

                    const screenX = this.worldToScreenX(x);
                    const screenY = this.worldToScreenY(y);

                    if (!started) {
                        this.ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                } else {
                    started = false;
                }
            } catch (e) {
                started = false;
            }
        }

        this.ctx.stroke();
    }

    plotImplicit(expression) {
        const resolution = 150; // Reduced for performance
        const xStep = (this.xMax - this.xMin) / resolution;
        const yStep = (this.yMax - this.yMin) / resolution;
        const threshold = 0.1; // Adjust based on zoom?

        this.ctx.fillStyle = this.ctx.strokeStyle;

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = this.xMin + i * xStep;
                const y = this.yMin + j * yStep;

                try {
                    const value = this.evaluateExpression(expression, { x, y });

                    if (Math.abs(value) < threshold) {
                        const screenX = this.worldToScreenX(x);
                        const screenY = this.worldToScreenY(y);
                        this.ctx.fillRect(screenX - 1, screenY - 1, 2, 2);
                    }
                } catch (e) {
                    // Continue
                }
            }
        }
    }

    evaluateExpression(expr, variables) {
        // Replace variables
        let processed = expr;
        for (const [key, value] of Object.entries(variables)) {
            // Use a more robust regex to avoid replacing substrings
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            processed = processed.replace(regex, `(${value})`);
        }

        // Handle custom functions first (before simple replacements)
        // logbase(x, base) -> log(x) / log(base)
        processed = processed.replace(/logbase\(([^,]+),\s*([^)]+)\)/g, (match, x, base) => {
            return `(Math.log(${x}) / Math.log(${base}))`;
        });

        // antilog(x, base) -> base^x (default base 10)
        processed = processed.replace(/antilog\(([^,]+),\s*([^)]+)\)/g, (match, x, base) => {
            return `(Math.pow(${base}, ${x}))`;
        });
        processed = processed.replace(/antilog\(([^)]+)\)/g, (match, x) => {
            return `(Math.pow(10, ${x}))`;
        });

        // Handle derivatives - numerical approximation using central difference
        // deriv(expression, var) -> derivative at current point
        // This needs special handling as we're evaluating for a specific variable value
        processed = processed.replace(/deriv\(([^,]+),\s*([^)]+)\)/g, (match, funcExpr, variable) => {
            // For graphing, we compute numerical derivative at the current point
            const h = 0.0001;
            const varName = variable.trim();

            // We'll create a derivative function inline
            // This is tricky because we need to evaluate the inner function
            // Let's use a helper function for this
            return `this.numericDerivative('${funcExpr}', '${varName}', ${varName})`;
        });

        // Handle integrals - numerical approximation using Simpson's rule
        // integ(expression, var, start, end) -> definite integral
        processed = processed.replace(/integ\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
            (match, funcExpr, variable, start, end) => {
                return `this.numericIntegral('${funcExpr}', '${variable.trim()}', ${start}, ${end})`;
            });

        // Replace math functions and constants
        // Order matters: longer names first to avoid partial replacement
        const replacements = [
            { s: 'sinh', r: 'Math.sinh' },
            { s: 'cosh', r: 'Math.cosh' },
            { s: 'tanh', r: 'Math.tanh' },
            { s: 'asin', r: 'Math.asin' },
            { s: 'acos', r: 'Math.acos' },
            { s: 'atan', r: 'Math.atan' },
            { s: 'sin', r: 'Math.sin' },
            { s: 'cos', r: 'Math.cos' },
            { s: 'tan', r: 'Math.tan' },
            { s: 'sqrt', r: 'Math.sqrt' },
            { s: 'abs', r: 'Math.abs' },
            { s: 'log', r: 'Math.log10' },
            { s: 'ln', r: 'Math.log' },
            { s: 'exp', r: 'Math.exp' },
            { s: 'floor', r: 'Math.floor' },
            { s: 'ceil', r: 'Math.ceil' },
            { s: 'round', r: 'Math.round' },
            { s: 'pi', r: 'Math.PI' },
            { s: 'π', r: 'Math.PI' },
            { s: 'e', r: 'Math.E' }
        ];

        replacements.forEach(({ s, r }) => {
            const regex = new RegExp(`\\b${s}\\b`, 'g');
            processed = processed.replace(regex, r);
        });

        // Handle power operator
        processed = processed.replace(/\^/g, '**');

        // Evaluate safely with helper functions bound
        const func = new Function('Math', 'helpers', `"use strict"; 
            const numericDerivative = helpers.numericDerivative;
            const numericIntegral = helpers.numericIntegral;
            return (${processed});`);
        return func(Math, {
            numericDerivative: this.numericDerivative.bind(this),
            numericIntegral: this.numericIntegral.bind(this)
        });
    }

    // Numerical derivative using central difference method
    numericDerivative(funcExpr, varName, atValue) {
        const h = 0.0001;
        const evalAtPoint = (val) => {
            try {
                const vars = {};
                vars[varName] = val;
                return this.evaluateSimple(funcExpr, vars);
            } catch (e) {
                return NaN;
            }
        };

        const f_plus = evalAtPoint(atValue + h);
        const f_minus = evalAtPoint(atValue - h);
        return (f_plus - f_minus) / (2 * h);
    }

    // Numerical integration using Simpson's rule
    numericIntegral(funcExpr, varName, start, end) {
        const n = 100; // Number of intervals (must be even)
        const h = (end - start) / n;

        const evalAtPoint = (val) => {
            try {
                const vars = {};
                vars[varName] = val;
                return this.evaluateSimple(funcExpr, vars);
            } catch (e) {
                return NaN;
            }
        };

        let sum = evalAtPoint(start) + evalAtPoint(end);

        for (let i = 1; i < n; i++) {
            const x = start + i * h;
            const weight = i % 2 === 0 ? 2 : 4;
            sum += weight * evalAtPoint(x);
        }

        return (sum * h) / 3;
    }

    // Simplified expression evaluator for derivative/integral inner functions
    evaluateSimple(expr, variables) {
        let processed = expr;

        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            processed = processed.replace(regex, `(${value})`);
        }

        // Replace common math functions
        const simpleReplacements = [
            { s: 'sinh', r: 'Math.sinh' },
            { s: 'cosh', r: 'Math.cosh' },
            { s: 'tanh', r: 'Math.tanh' },
            { s: 'asin', r: 'Math.asin' },
            { s: 'acos', r: 'Math.acos' },
            { s: 'atan', r: 'Math.atan' },
            { s: 'sin', r: 'Math.sin' },
            { s: 'cos', r: 'Math.cos' },
            { s: 'tan', r: 'Math.tan' },
            { s: 'sqrt', r: 'Math.sqrt' },
            { s: 'abs', r: 'Math.abs' },
            { s: 'log', r: 'Math.log10' },
            { s: 'ln', r: 'Math.log' },
            { s: 'exp', r: 'Math.exp' },
            { s: 'π', r: 'Math.PI' },
            { s: 'pi', r: 'Math.PI' },
            { s: 'e', r: 'Math.E' }
        ];

        simpleReplacements.forEach(({ s, r }) => {
            const regex = new RegExp(`\\b${s}\\b`, 'g');
            processed = processed.replace(regex, r);
        });

        processed = processed.replace(/\^/g, '**');

        const func = new Function('Math', `"use strict"; return (${processed});`);
        return func(Math);
    }

    worldToScreenX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.canvasSize;
    }

    worldToScreenY(y) {
        return this.canvasSize - ((y - this.yMin) / (this.yMax - this.yMin)) * this.canvasSize;
    }

    screenToWorldX(screenX) {
        return this.xMin + (screenX / this.canvasSize) * (this.xMax - this.xMin);
    }

    screenToWorldY(screenY) {
        return this.yMin + ((this.canvasSize - screenY) / this.canvasSize) * (this.yMax - this.yMin);
    }

    exportGraph() {
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    loadExamples() {
        // Pre-populate with an example function
        setTimeout(() => {
            const firstInput = document.querySelector('.function-input');
            if (firstInput) {
                firstInput.value = 'sin(x)';
                this.functions[0].expression = 'sin(x)';
                this.plot();
            }
        }, 100);
    }
}

// Initialize graphing calculator
let graphingCalc;
document.addEventListener('DOMContentLoaded', () => {
    graphingCalc = new GraphingCalculator();
});
