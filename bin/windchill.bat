@echo off
setlocal
set WINDCHILL_HOME=%~dp0..
set JAVA_OPTS=-Xms512m -Xmx2g -Dspring.profiles.active=prod

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="status" goto status
if "%1"=="restart" goto restart
echo Usage: windchill {start^|stop^|restart^|status}
goto :eof

:start
echo Starting Windchill PLM...
start "Windchill" /B java -jar %JAVA_OPTS% -Dspring.datasource.password=%DB_PASSWORD% -Dapp.jwtSecret=%JWT_SECRET% "%WINDCHILL_HOME%\windchill-backend\backend-api\target\backend-api-1.0.0-SNAPSHOT.jar" > "%WINDCHILL_HOME%\logs\windchill.log" 2>&1
echo Windchill started. Check logs\windchill.log
goto :eof

:stop
echo Stopping Windchill...
taskkill /FI "WINDOWTITLE eq Windchill" /F 2>nul
echo Windchill stopped.
goto :eof

:status
tasklist /FI "WINDOWTITLE eq Windchill" 2>nul | find "java" >nul && echo Windchill is RUNNING || echo Windchill is STOPPED
goto :eof

:restart
call %0 stop
timeout /t 3 >nul
call %0 start
goto :eof
