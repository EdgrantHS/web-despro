# Performance Testing Setup and Execution Guide

This directory contains comprehensive performance testing tools for the web application.

## Quick Start

### Option 1: Using the Batch Script (Windows)
```bash
# Make sure your Next.js app is running on port 3001
npx next start -p 3001

# In another terminal, run:
cd testing
run_tests.bat
```

### Option 2: Manual Setup
```bash
cd testing

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Run tests
python performance_test.py
```

## Configuration

### Test Iterations
In `performance_test.py`, modify these variables:
- `NUM_ITERATIONS = 30` - Number of test iterations (default: 30)
- `DELAY_BETWEEN_ITERATIONS = 2` - Seconds between test cycles
- `DELAY_BETWEEN_TESTS = 0.5` - Seconds between individual tests

### In Jupyter Notebook
In `performance_analysis.ipynb`, modify:
- `NUM_ITERATIONS = 30` - Number of iterations for notebook testing

## Files Overview

- **`performance_test.py`** - Main testing script with multiple iterations
- **`performance_analysis.ipynb`** - Jupyter notebook for data analysis
- **`requirements.txt`** - Python dependencies
- **`run_tests.bat`** - Windows batch script for easy execution
- **`results/`** - Directory containing test results (CSV files and reports)

## Test Results

Results are saved as CSV files with columns:
- Type (Page/API)
- Name
- Path/Endpoint
- Load Time/Response Time (ms)
- Size (KB)
- Status
- Timestamp
- Iteration

## Statistical Analysis

The testing suite provides:
- Mean, median, standard deviation
- Min/max response times
- 95th and 99th percentiles
- Coefficient of variation (reliability metric)
- Comprehensive visualizations

## Interpretation

### Performance Categories
- **Excellent**: < 100ms
- **Good**: 100-500ms
- **Fair**: 500-1000ms
- **Poor**: > 1000ms

### Reliability (Coefficient of Variation)
- **High**: CV < 20% (consistent performance)
- **Medium**: CV 20-50% (moderate variation)
- **Low**: CV > 50% (high variation)

## Troubleshooting

1. **Server not running**: Make sure Next.js is running on port 3001
2. **Playwright errors**: Run `playwright install chromium`
3. **Permission errors**: Run terminal as administrator
4. **Python errors**: Ensure Python 3.7+ is installed

## Example Usage

```python
# In Jupyter notebook
df_stats = analyze_multiple_iterations(df_clean)
create_advanced_visualizations(df_stats, df_clean)
```

This will generate comprehensive performance analysis with statistical confidence!