@echo off
echo Windchill PLM Environment Setup
echo ===============================
set /p DB_PASS="Database password [windchill123]: " || set DB_PASS=windchill123
set /p JWT_KEY="JWT secret key [press Enter for default]: " || set JWT_KEY=windchill-dev-jwt-secret-key-please-change-this-to-a-64-bytes-minimum-value-1234567890
setx DB_PASSWORD %DB_PASS%
setx JWT_SECRET %JWT_KEY%
echo Environment configured.
