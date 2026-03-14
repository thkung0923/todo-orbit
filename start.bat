@echo off
title Todo Orbit
cd /d "%~dp0"
echo Starting Todo Orbit...
start "" http://localhost:5173
npm run dev
