@echo off
setlocal
pushd "%~dp0"
if errorlevel 1 goto location_error
where node.exe >nul 2>nul
if errorlevel 1 goto missing_node
set "NODE_OPTIONS="
set "NODE_PATH="
node.exe tools\collaudo-locale.cjs
set "CAF_TEST_EXIT=%ERRORLEVEL%"
echo.
echo Puoi inviare la schermata finale alla chat. Non inserire dati degli assistiti.
pause
popd
exit /b %CAF_TEST_EXIT%
:missing_node
echo Node.js non e installato o non e disponibile nel PATH.
echo Installa Node.js LTS per Windows da https://nodejs.org/en/download
echo Poi riapri questo file. Nessun altro software viene scaricato automaticamente.
pause
popd
exit /b 1
:location_error
echo Estrai prima tutta la cartella ZIP in una cartella locale, poi riapri questo file.
pause
exit /b 1
