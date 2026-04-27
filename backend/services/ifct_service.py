import json
import os
from difflib import get_close_matches

_ifct_data: list[dict] = []


def load_ifct() -> None:
    global _ifct_data
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'ifct_2017.json')
    if os.path.exists(data_path):
        with open(data_path) as f:
            _ifct_data = json.load(f)
    else:
        _ifct_data = []


def lookup(food_name: str) -> dict | None:
    if not _ifct_data:
        load_ifct()
    food_lower = food_name.lower()
    for item in _ifct_data:
        if food_lower in item.get('name', '').lower():
            return item
    names = [item.get('name', '') for item in _ifct_data]
    matches = get_close_matches(food_name, names, n=1, cutoff=0.6)
    if matches:
        return next((item for item in _ifct_data if item.get('name') == matches[0]), None)
    return None


def lookup_batch(food_list: list[str]) -> list[dict]:
    return [{'food': f, 'data': lookup(f)} for f in food_list]
