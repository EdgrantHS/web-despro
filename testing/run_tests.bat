@echo off
echo Installing dependencies and running performance tests...
echo.

cd testing

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing requirements...
pip install -r requirements.txt

echo.
echo Installing Playwright browsers...
playwright install chromium

echo.
echo Starting performance tests with multiple iterations...
echo Make sure your Next.js app is running on port 3001!
echo.

python performance_test.py

echo.
echo Tests completed! Check the results directory for CSV files.
pause