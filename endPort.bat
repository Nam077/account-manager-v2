@echo off
set /p port=Enter the port to terminate (e.g., 3000):
echo Terminating process listening on port %port%...

rem Find the process ID (PID) of the process listening on the specified port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%port%') do set pid=%%a

rem Check if PID is found
if "%pid%"=="" (
    echo No process found listening on port %port%.
) else (
    rem Terminate the process
    taskkill /F /PID %pid%
    echo Process listening on port %port% (PID: %pid%) has been terminated.
)

pause
