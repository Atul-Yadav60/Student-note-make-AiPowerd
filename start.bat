@echo off
echo ================================================
echo    Student Notes Maker - Quick Start
echo ================================================
echo.

REM Check if .env exists
if not exist .env (
    echo [STEP 1] Creating .env file...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env and add your Gemini  API key!
    echo.
    echo    1. Open .env file in a text editor
    echo    2. Replace 'your_gemini_api_key_here' with your actual API key
    echo    3. Get your API key from: https://platform.openai.com/api-keys
    echo.
    pause
) else (
    echo [✓] .env file exists
    echo.
)

echo [STEP 2] Installing dependencies (if needed)...
echo.
call npm install
echo.

echo [STEP 3] Starting development server...
echo.
echo ================================================
echo    Opening app at http://localhost:3000
echo ================================================
echo.
echo 📚 Ready to generate study materials!
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
