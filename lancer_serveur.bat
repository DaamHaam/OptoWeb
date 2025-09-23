@echo off
echo Tentative d'arret des serveurs existants sur le port 8000...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr ":8000"') DO (
    IF NOT "%%P"=="0" (
        echo Arret du processus avec le PID %%P
        taskkill /F /PID %%P
    )
)
echo.
echo Lancement du serveur de developpement OPTO VR...

REM Lance le serveur Python en arriere-plan
start "OPTO VR Server" python -m http.server 8000

echo Serveur lance.

echo Ouverture de l'application dans votre navigateur...

REM Attend 2 secondes pour que le serveur soit pret
timeout /t 2 /nobreak > nul

REM Ouvre l'URL dans le navigateur par defaut
start http://localhost:8000

echo Termine. Vous pouvez fermer cette fenetre.