@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "ARG=%~1"

if "%ARG%"=="" (
    echo 用法:
    echo   1. 拖拽 scene.glb 文件到本文件上
    echo   2. 或拖拽模型文件夹到本文件上
    echo   3. 或在命令行运行: init-model.bat ^<模型文件夹名^>
    echo.
    pause
    exit /b 1
)

set "MODEL_NAME="

rem 检查是否是 .glb 文件拖拽
if /i "%~x1"==".glb" (
    for %%i in ("%ARG%") do set "FOLDER=%%~dpi"
    for %%i in ("%FOLDER%..") do set "MODEL_NAME=%%~ni"
) else if exist "%ARG%\scene.glb" (
    rem 拖拽的是文件夹，且里面有 scene.glb
    for %%i in ("%ARG%") do set "MODEL_NAME=%%~ni"
) else if exist "models\%ARG%\scene.glb" (
    set "MODEL_NAME=%ARG%"
)

if "%MODEL_NAME%"=="" (
    echo 找不到 models\%ARG%\scene.glb
    echo 请确保模型文件夹内有 scene.glb 文件
    pause
    exit /b 1
)

echo 模型: %MODEL_NAME%
echo 正在从 scene.glb 提取 mesh 名称并生成配置文件...
node "%SCRIPT_DIR%init-model.mjs" "%MODEL_NAME%"

if errorlevel 1 (
    echo.
    echo 生成失败，请确认已安装 Node.js
    pause
    exit /b 1
)

echo.
echo 配置文件已生成，接下来请手动填写:
echo   1. model.json 里的 name/desc 字段
echo   2. doc.md 里的 SFM 代码和样板供应器设置
echo   3. labels 里的编号，按你的 SFM 程序调整
pause
