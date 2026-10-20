@echo off
rem Starts Parsons Puzzles for local development (Windows).
rem This file only runs "npm start". All the logic is in scripts\dev.mjs, plain
rem JavaScript you can read first. It installs nothing without asking.
rem Options are passed through, e.g.  start.cmd --web-only
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required: https://nodejs.org/
  pause
  exit /b 1
)
call npm start -- %*
if errorlevel 1 pause
