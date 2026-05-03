@echo off
echo ========================================================
echo   Fake Job Post Detection - Setup and Run Script
echo ========================================================

set PATH=C:\Program Files\nodejs;%PATH%

set PYTHON_CMD=py

%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    set PYTHON_CMD=python
)

echo.
echo [1/4] Setting up Python Backend...
cd backend
if not exist venv (
    %PYTHON_CMD% -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo Running Data Preprocessing (this might take a moment)...
%PYTHON_CMD% preprocessing.py
cd ..

echo.
echo [2/4] Setting up React Frontend...
if not exist frontend (
    echo Creating React Vite App...
    call npx -y create-vite frontend --template react
    
    echo Installing dependencies...
    cd frontend
    call npm install
    call npm install @react-oauth/google
    
    echo Copying premium UI components...
    copy /Y ..\frontend_components\App.jsx src\App.jsx
    copy /Y ..\frontend_components\index.css src\index.css
    cd ..
) else (
    echo Frontend folder already exists. Skipping creation.
)

echo.
echo [3/4] Starting FastAPI Backend...
start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload"

echo.
echo [4/4] Starting React Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Setup Complete! 
echo   Backend is running on http://localhost:8000
echo   Frontend is running on http://localhost:5173
echo ========================================================
pause
