// Unit Converter Module
class UnitConverter {
    constructor(controller) {
        this.controller = controller;
        this.units = {
            length: {
                meters: 1,
                kilometers: 1000,
                miles: 1609.34,
                'nautical miles': 1852,
                feet: 0.3048,
                inches: 0.0254,
                yards: 0.9144,
                centimeters: 0.01,
                millimeters: 0.001
            },
            weight: {
                kilograms: 1,
                grams: 0.001,
                pounds: 0.453592,
                ounces: 0.0283495,
                tons: 907.185,
                'metric tons': 1000,
                stone: 6.35029
            },
            temperature: {
                celsius: 'celsius',
                fahrenheit: 'fahrenheit',
                kelvin: 'kelvin'
            },
            area: {
                'square meters': 1,
                'square miles': 2590000,
                'square yards': 0.836127,
                'square feet': 0.092903,
                acres: 4046.86,
                hectares: 10000
            },
            volume: {
                liters: 1,
                milliliters: 0.001,
                gallons: 3.78541,
                quarts: 0.946353,
                pints: 0.473176,
                cups: 0.236588,
                'cubic feet': 28.3168,
                'cubic inches': 0.0163871
            },
            speed: {
                'm/s': 1,
                'km/h': 0.277778,
                mph: 0.44704,
                knots: 0.514444
            },
            time: {
                seconds: 1,
                minutes: 60,
                hours: 3600,
                days: 86400,
                weeks: 604800
            },
            data: {
                bytes: 1,
                kilobytes: 1024,
                megabytes: 1048576,
                gigabytes: 1073741824,
                terabytes: 1099511627776
            }
        };
        this.init();
    }

    init() {
        this.categorySelect = document.getElementById('category-select');
        this.fromUnitSelect = document.getElementById('from-unit');
        this.toUnitSelect = document.getElementById('to-unit');
        this.inputValue = document.getElementById('input-value');
        this.outputValue = document.getElementById('output-value');

        this.categorySelect.addEventListener('change', () => this.populateUnits());
        this.inputValue.addEventListener('input', () => this.convert());
        this.fromUnitSelect.addEventListener('change', () => this.convert());
        this.toUnitSelect.addEventListener('change', () => this.convert());
        
        this.populateUnits();
    }

    populateUnits() {
        const category = this.categorySelect.value;
        const unitKeys = Object.keys(this.units[category]);

        this.fromUnitSelect.innerHTML = '';
        this.toUnitSelect.innerHTML = '';

        unitKeys.forEach(unit => {
            const option1 = document.createElement('option');
            option1.value = unit;
            option1.textContent = unit;
            this.fromUnitSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = unit;
            option2.textContent = unit;
            this.toUnitSelect.appendChild(option2);
        });

        // Set default different units
        this.fromUnitSelect.value = unitKeys[0];
        this.toUnitSelect.value = unitKeys[1] || unitKeys[0];
        
        this.convert();
    }

    convert() {
        const fromUnit = this.fromUnitSelect.value;
        const toUnit = this.toUnitSelect.value;
        const category = this.categorySelect.value;
        const value = parseFloat(this.inputValue.value);

        if (isNaN(value)) {
            this.outputValue.value = '';
            return;
        }

        let result;
        // Special handling for temperature
        if (category === 'temperature') {
            result = this.convertTemperature(value, fromUnit, toUnit);
        } else {
            const baseValue = value * this.units[category][fromUnit];
            result = baseValue / this.units[category][toUnit];
        }

        this.outputValue.value = parseFloat(result.toFixed(6));
    }

    convertTemperature(value, from, to) {
        if (from === to) return value;
        
        let celsius;
        // Convert input to Celsius first
        if (from === 'fahrenheit') {
            celsius = (value - 32) * 5 / 9;
        } else if (from === 'kelvin') {
            celsius = value - 273.15;
        } else {
            celsius = value;
        }

        // Convert from Celsius to target unit
        if (to === 'fahrenheit') {
            return (celsius * 9 / 5) + 32;
        } else if (to === 'kelvin') {
            return celsius + 273.15;
        } else {
            return celsius;
        }
    }
}

// Initialize unit converter
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (calculator) {
            new UnitConverter(calculator);
        }
    }, 100);
});
