@echo off
title Todo Orbit (Production)
cd /d "%~dp0"
echo Building Todo Orbit...
call npm run build
echo Starting preview server...
start "" http://localhost:4173
npx vite preview
