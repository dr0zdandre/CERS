from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from src.integrations import fetch_cbr_rates

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