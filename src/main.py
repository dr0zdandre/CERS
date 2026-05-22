from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from datetime import datetime
from src.integrations.cbrf_api import fetch_cbr_rates
from src.integrations.cbr_history_api import fetch_currency_history, fetch_cross_rate_history, get_available_currencies

app = FastAPI(title="Currency Converter")

app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).parent / "static"),
    name="static"
)

@app.get("/rates")
async def get_rates():
    try:
        rates = await fetch_cbr_rates()
        rates['RUB'] = 1.0

        return {
            "status": "ok",
            "date": str(__import__('src.integrations.cbrf_api')),
            "rates": rates
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.get("/")
async def read_index():
    return FileResponse(Path(__file__).parent / "static" / "index.html")


# === API для истории курсов ===

@app.get("/api/currencies")
async def api_currencies():
    """Список всех доступных валют."""
    return get_available_currencies()


@app.get("/api/history/{currency}")
async def api_history(
    currency: str,
    year_from: int = Query(default=2005, ge=1990, le=2026),
    year_to: int = Query(default=None, ge=1990, le=2026)
):
    """История курса валюты к RUB."""
    try:
        if year_to is None:
            year_to = datetime.now().year
        date_from = f"01/01/{year_from}"
        date_to = f"31/12/{year_to}"
        history = await fetch_currency_history(currency, date_from, date_to)
        return {"status": "ok", "currency": currency, "base": "RUB", "data": history}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/cross/{from_currency}/{to_currency}")
async def api_cross_history(
    from_currency: str,
    to_currency: str,
    year_from: int = Query(default=2005, ge=1990, le=2026),
    year_to: int = Query(default=None, ge=1990, le=2026)
):
    """История кросс-курса FROM/TO."""
    try:
        if year_to is None:
            year_to = datetime.now().year
        date_from = f"01/01/{year_from}"
        date_to = f"31/12/{year_to}"
        history = await fetch_cross_rate_history(from_currency, to_currency, date_from, date_to)
        return {"status": "ok", "from": from_currency, "to": to_currency, "data": history}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))