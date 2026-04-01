@echo off
:: החזרת השעה האמיתית מהאינטרנט
:: יש להריץ כמנהל (קליק ימני > הפעל כמנהל)

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] צריך להריץ כמנהל!
    echo     קליק ימני על הקובץ ^> הפעל כמנהל
    echo.
    pause
    exit /b
)

w32tm /resync /force >nul 2>&1
net start w32time >nul 2>&1
w32tm /resync /force >nul 2>&1

echo.
echo [V] השעה חזרה לזמן אמיתי!
echo.
pause
