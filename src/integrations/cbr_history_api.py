import httpx
import xml.etree.ElementTree as ET
from datetime import date
from typing import Dict, List, Optional

# Маппинг валют: код ЦБ -> (EngName, Nominal)
CURRENCY_CODES = {
    "AUD": {"code": "R01010", "name": "Australian Dollar", "nominal": 1},
    "AZN": {"code": "R01020A", "name": "Azerbaijan Manat", "nominal": 1},
    "GBP": {"code": "R01035", "name": "Pound Sterling", "nominal": 1},
    "AMD": {"code": "R01060", "name": "Armenian Dram", "nominal": 100},
    "BYN": {"code": "R01090B", "name": "Belarusian Ruble", "nominal": 1},
    "BGN": {"code": "R01100", "name": "Bulgarian Lev", "nominal": 1},
    "BRL": {"code": "R01115", "name": "Brazilian Real", "nominal": 1},
    "HUF": {"code": "R01135", "name": "Hungarian Forint", "nominal": 100},
    "VND": {"code": "R01150", "name": "Vietnamese Dong", "nominal": 1000},
    "HKD": {"code": "R01200", "name": "Hong Kong Dollar", "nominal": 10},
    "GEL": {"code": "R01210", "name": "Georgian Lari", "nominal": 1},
    "DKK": {"code": "R01215", "name": "Danish Krone", "nominal": 10},
    "AED": {"code": "R01230", "name": "UAE Dirham", "nominal": 1},
    "USD": {"code": "R01235", "name": "US Dollar", "nominal": 1},
    "EUR": {"code": "R01239", "name": "Euro", "nominal": 1},
    "EGP": {"code": "R01250", "name": "Egyptian Pound", "nominal": 10},
    "INR": {"code": "R01270", "name": "Indian Rupee", "nominal": 100},
    "IDR": {"code": "R01280", "name": "Indonesian Rupiah", "nominal": 1000},
    "IRR": {"code": "R01300", "name": "Iranian Rial", "nominal": 1000000},
    "ISK": {"code": "R01310", "name": "Iceland Krona", "nominal": 10000},
    "KZT": {"code": "R01335", "name": "Kazakhstan Tenge", "nominal": 100},
    "CAD": {"code": "R01350", "name": "Canadian Dollar", "nominal": 1},
    "QAR": {"code": "R01355", "name": "Qatari Rial", "nominal": 1},
    "KGS": {"code": "R01370", "name": "Kyrgyzstan Som", "nominal": 100},
    "CNY": {"code": "R01375", "name": "Yuan Renminbi", "nominal": 1},
    "KWD": {"code": "R01390", "name": "Kuwaiti Dinar", "nominal": 10},
    "CUP": {"code": "R01395", "name": "Cuban Peso", "nominal": 10},
    "LBP": {"code": "R01420", "name": "Lebanese Pound", "nominal": 100000},
    "MNT": {"code": "R01503", "name": "Mongolian Tugrik", "nominal": 1000},
    "MDL": {"code": "R01530", "name": "Moldovan Leu", "nominal": 10},
    "NOK": {"code": "R01535", "name": "Norwegian Krone", "nominal": 10},
    "OMR": {"code": "R01540", "name": "Omani Rial", "nominal": 1},
    "PLN": {"code": "R01565", "name": "Polish Zloty", "nominal": 1},
    "RON": {"code": "R01585F", "name": "Romanian Leu", "nominal": 1},
    "SAR": {"code": "R01580", "name": "Saudi Riyal", "nominal": 1},
    "SGD": {"code": "R01625", "name": "Singapore Dollar", "nominal": 1},
    "TJS": {"code": "R01670", "name": "Tajikistani Somoni", "nominal": 10},
    "THB": {"code": "R01675", "name": "Thai Baht", "nominal": 100},
    "BDT": {"code": "R01685", "name": "Bangladesh Taka", "nominal": 100},
    "TRY": {"code": "R01700J", "name": "Turkish Lira", "nominal": 10},
    "TMT": {"code": "R01710A", "name": "Turkmenistani Manat", "nominal": 1},
    "UZS": {"code": "R01717", "name": "Uzbekistan Sum", "nominal": 10000},
    "UAH": {"code": "R01720A", "name": "Ukrainian Hryvnia", "nominal": 1},
    "CZK": {"code": "R01760", "name": "Czech Koruna", "nominal": 10},
    "SEK": {"code": "R01770", "name": "Swedish Krona", "nominal": 10},
    "CHF": {"code": "R01775", "name": "Swiss Franc", "nominal": 1},
    "ETB": {"code": "R01800", "name": "Ethiopian Birr", "nominal": 100},
    "RSD": {"code": "R01805F", "name": "Serbian Dinar", "nominal": 100},
    "ZAR": {"code": "R01810", "name": "South African Rand", "nominal": 10},
    "KRW": {"code": "R01815", "name": "South Korean Won", "nominal": 1000},
    "JPY": {"code": "R01820", "name": "Japanese Yen", "nominal": 100},
    "ETB": {"code": "R01800", "name": "Ethiopian Birr", "nominal": 100},
    "MMK": {"code": "R02005", "name": "Myanmar Kyat", "nominal": 1000},
}

# Кэш для истории
_cache: Dict = {}

def _cache_key(code: str, date_from: str, date_to: str) -> str:
    return f"{code}_{date_from}_{date_to}"


async def fetch_currency_history(currency_code: str, date_from: str, date_to: str) -> List[dict]:
    """
    Получить историю курса валюты к рублю через XML Dynamic API ЦБ.
    """
    if currency_code not in CURRENCY_CODES:
        raise ValueError(f"Неизвестная валюта: {currency_code}")
    
    cur_info = CURRENCY_CODES[currency_code]
    cbr_code = cur_info["code"]
    nominal = cur_info["nominal"]
    
    key = _cache_key(cbr_code, date_from, date_to)
    if key in _cache:
        return _cache[key]
    
    url = "http://www.cbr.ru/scripts/XML_dynamic.asp"
    params = {
        "date_req1": date_from,
        "date_req2": date_to,
        "VAL_NM_RQ": cbr_code
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
    
    content = response.content.decode('windows-1251')
    root = ET.fromstring(content)
    
    result = []
    for record in root.findall('Record'):
        date_str = record.get('Date', '')
        value_elem = record.find('Value')
        if value_elem is not None:
            value_str = value_elem.text.replace(',', '.')
            value = float(value_str) / nominal
            result.append({
                "date": date_str,
                "value": round(value, 6)
            })
    
    result.sort(key=lambda x: _parse_date(x["date"]))
    
    _cache[key] = result
    return result


async def fetch_cross_rate_history(
    from_code: str,
    to_code: str,
    date_from: str,
    date_to: str
) -> List[dict]:
    """
    Получить историю кросс-курса через RUB.
    Кросс-курс: FROM/TO = (FROM_RUB) / (TO_RUB)
    """
    if to_code == "RUB":
        return await fetch_currency_history(from_code, date_from, date_to)
    if from_code == "RUB":
        history = await fetch_currency_history(to_code, date_from, date_to)
        return [{"date": h["date"], "value": round(1.0 / h["value"], 6) if h["value"] > 0 else 0} for h in history]
    
    from_history = await fetch_currency_history(from_code, date_from, date_to)
    to_history = await fetch_currency_history(to_code, date_from, date_to)
    
    to_by_date = {h["date"]: h["value"] for h in to_history}
    
    result = []
    for from_record in from_history:
        date_str = from_record["date"]
        from_val = from_record["value"]
        to_val = to_by_date.get(date_str)
        
        if to_val and to_val > 0:
            cross_rate = from_val / to_val
            result.append({
                "date": date_str,
                "value": round(cross_rate, 6)
            })
    
    return result


def get_available_currencies() -> List[dict]:
    """Получить список доступных валют."""
    result = []
    for code, info in CURRENCY_CODES.items():
        result.append({
            "code": code,
            "name": info["name"],
            "nominal": info["nominal"]
        })
    return sorted(result, key=lambda x: x["code"])


def _parse_date(date_str: str) -> date:
    """Парсить дату из формата DD.MM.YYYY."""
    try:
        parts = date_str.split('.')
        return date(int(parts[2]), int(parts[1]), int(parts[0]))
    except:
        return date(1900, 1, 1)
