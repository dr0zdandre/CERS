import httpx
import xml.etree.ElementTree as ET
from datetime import date
from typing import Dict

from src.config import Config

_cache: Dict = {"date": None, "rates": {}}

def get_cache_info():
    return {"date": str(_cache["date"]) if _cache["date"] else None}

async def fetch_cbr_rates() -> dict:
    today = date.today()
    if _cache["date"] == today and _cache["rates"]:
        return _cache["rates"]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    URL = "https://www.cbr.ru/scripts/XML_daily.asp"

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        response = await client.get(URL)
        response.raise_for_status()

    root = ET.fromstring(response.text)
    rates = {}
    for valute in root.findall("Valute"):
        char_code = valute.find("CharCode").text
        nominal = int(valute.find("Nominal").text)
        value = float(valute.find("Value").text.replace(",", "."))
        rates[char_code] = value / nominal

    if 'RUB' not in rates:
        rates['RUB'] = 1.0

    _cache["date"] = today
    _cache["rates"] = rates
    return rates