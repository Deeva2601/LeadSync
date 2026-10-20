@echo off
echo Starting LeadSync backend...
cd /d "%~dp0backend"
start "LeadSync Backend" cmd /k "npm start"
echo Backend started on port 3001.
pause
