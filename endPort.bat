@echo off
set /p port="Enter the port number to find and end the process: "
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%port%') do set pid=%%a
if defined pid (
    taskkill /PID %pid% /F
    echo Process with PID %pid% using port %port% has been ended.
) else (
    echo No process found using port %port%.
)
pause
