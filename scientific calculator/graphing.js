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
        // Action buttons
        document.getElementById('add-function').addEventListener('click', () => {
            this.addFunction();
        });

        document.getElementById('reset-view-btn').addEventListener('click', () => {
            this.resetView();
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
        return 'e.g., sin(x), x^2, sqrt(x)';
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

        this.plot();
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
                    this.plotCartesian(func.expression);
                } catch (error) {
                    console.warn(`Error plotting function ${index}:`, error);
                }
            });
        });
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
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
        this.ctx.fillStyle = '#666';
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

    evaluateExpression(expr, variables) {
        // Check for piecewise function syntax: {condition: expr, condition: expr, ...}
        const piecewiseMatch = expr.trim().match(/^\{(.+)\}$/);
        if (piecewiseMatch) {
            return this.evaluatePiecewise(piecewiseMatch[1], variables);
        }

        // Replace variables
        let processed = expr;
        for (const [key, value] of Object.entries(variables)) {
            // Use a more robust regex to avoid replacing substrings
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            processed = processed.replace(regex, `(${value})`);
        }

        // Handle logbase(x, base) -> log(x) / log(base)
        processed = processed.replace(/logbase\(([^,]+),\s*([^)]+)\)/g, (match, x, base) => {
            return `(Math.log(${x}) / Math.log(${base}))`;
        });

        // Replace math functions and constants
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

        // Evaluate safely
        const func = new Function('Math', `"use strict"; return (${processed});`);
        return func(Math);
    }

    evaluatePiecewise(piecewiseContent, variables) {
        // Parse piecewise function: "x<0: -x, x>=0: x" or "x<0: -x, else: x"
        const parts = this.splitPiecewise(piecewiseContent);

        for (const part of parts) {
            const colonIndex = part.indexOf(':');
            if (colonIndex === -1) continue;

            const condition = part.substring(0, colonIndex).trim();
            const expression = part.substring(colonIndex + 1).trim();

            // Handle "else" or "otherwise" as default case
            if (condition === 'else' || condition === 'otherwise' || condition === 'true') {
                return this.evaluateExpression(expression, variables);
            }

            // Evaluate condition
            try {
                const conditionResult = this.evaluateExpression(condition, variables);
                if (conditionResult) {
                    return this.evaluateExpression(expression, variables);
                }
            } catch (e) {
                // If condition evaluation fails, skip this piece
                continue;
            }
        }

        // If no condition matched, return NaN
        return NaN;
    }

    splitPiecewise(content) {
        // Split by comma, but be careful of nested function calls
        const parts = [];
        let current = '';
        let depth = 0;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

            if (char === '(' || char === '{') {
                depth++;
                current += char;
            } else if (char === ')' || char === '}') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
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
}

// Initialize graphing calculator
let graphingCalc;
document.addEventListener('DOMContentLoaded', () => {
    graphingCalc = new GraphingCalculator();
});
