@echo off
:: איפוס בראנצ' העבודה - מאפס את הבראנצ' שיהיה זהה ל-main
:: להריץ מתיקיית הפרויקט (omer-taicher-site)

cd /d "C:\Users\Demo\Documents\GitHub\omer-taicher-site"
if not exist ".git" (
    echo [!] לא מצאתי את תיקיית הפרויקט!
    echo     תבדוק את הנתיב בשורה 5 של הקובץ הזה
    pause
    exit /b
)

echo.
echo [*] עובר ל-main ומעדכן...
git checkout main
git pull origin main
git fetch --prune

echo.
echo [*] מאפס את בראנצ' העבודה...
git branch -D claude/work-in-progress-418DV 2>nul
git checkout -b claude/work-in-progress-418DV
git push -u origin claude/work-in-progress-418DV --force

echo.
echo [V] הבראנצ' נקי ומוכן!
echo.
pause
