@echo off
setlocal
cd /d "%~dp0backend"
echo ===========================================================================
echo  DANG KHOI CHAY AGENTIC SDLC GOVERNANCE LABORATORY (MUHAMMAD AWAIS 2026)
echo ===========================================================================
echo.
echo 1. Chay single Epic mac dinh:
echo    python main.py --mode single --governance STRICT
echo.
echo 2. Chay voi file User Stories mau (smart_pms_ai\input_user_stories_mau.json):
echo    python main.py --mode single --stories-file "..\input_user_stories_mau.json" --governance STRICT
echo.
echo 3. So sanh 3 che do quan tri (OFF vs BASIC vs STRICT):
echo    python main.py --mode automated_sprints
echo.
python main.py --mode single --stories-file "..\input_user_stories_mau.json" --governance STRICT
echo.
echo [DA XUAT XUONG BAO CAO SDLC DELIVERABLES TAI:]
echo %~dp0BAO_CAO_SDLC_DELIVERABLES.md
echo.
pause
