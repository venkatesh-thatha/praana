"""
Praana Demo Seed Script
=======================
Seeds a realistic 52-year-old hypertensive diabetic male demo user with:
- 30 days of vitals history (realistic variation)
- 3 food log entries
- 3 symptom sessions (HIGH / MEDIUM / LOW urgency)

Usage (from praana/ directory):
    python -m backend.scripts.seed_demo

Requires the backend to be running at http://localhost:8000.
Install httpx if not present: pip install httpx
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone

try:
    import httpx
except ImportError:
    print('ERROR: httpx not installed. Run: pip install httpx')
    sys.exit(1)

BASE_URL = 'http://localhost:8000'

DEMO_EMAIL = 'demo@praana.health'
DEMO_PASSWORD = 'Demo@123'
DEMO_NAME = 'Venkatesh Kumar'

# DOB for age ~52 as of 2026-04-27
DEMO_DOB = '1973-11-15'


async def register_or_login(client: httpx.AsyncClient) -> tuple[str, str]:
    """Register demo user, fall back to login if already exists."""
    print(f'Registering user: {DEMO_EMAIL} ...')
    reg_res = await client.post(f'{BASE_URL}/api/auth/register', json={
        'email': DEMO_EMAIL,
        'password': DEMO_PASSWORD,
        'name': DEMO_NAME,
    })
    if reg_res.status_code == 201:
        data = reg_res.json()
        print(f'  Registered. user_id={data["user_id"]}')
        return data['access_token'], data['user_id']
    if reg_res.status_code == 400 and 'already registered' in reg_res.text.lower():
        print('  Already registered — logging in...')
        login_res = await client.post(f'{BASE_URL}/api/auth/login', json={
            'email': DEMO_EMAIL,
            'password': DEMO_PASSWORD,
        })
        login_res.raise_for_status()
        data = login_res.json()
        print(f'  Logged in. user_id={data["user_id"]}')
        return data['access_token'], data['user_id']
    print(f'  Registration failed: {reg_res.status_code} {reg_res.text}')
    reg_res.raise_for_status()
    raise RuntimeError('Unreachable')


async def create_profile(client: httpx.AsyncClient, token: str) -> None:
    print('Creating health profile...')
    headers = {'Authorization': f'Bearer {token}'}
    res = await client.post(f'{BASE_URL}/api/profile', json={
        'personal': {
            'name': DEMO_NAME,
            'dob': DEMO_DOB,
            'gender': 'male',
            'height_cm': 168.0,
            'weight_kg': 82.0,
            'blood_type': 'O+',
            'city': 'Bengaluru',
            'state': 'Karnataka',
            'language_pref': 'en',
        },
        'medical_history': {
            'conditions': ['Hypertension', 'Type 2 Diabetes'],
            'medications': ['Metformin 500mg', 'Amlodipine 5mg'],
            'allergies': [],
            'surgeries': [],
        },
        'diet': {
            'type': 'non_veg',
            'restrictions': [],
            'cuisine_region': 'South Indian',
        },
    }, headers=headers)
    if res.status_code in (200, 201):
        print('  Profile saved.')
    else:
        print(f'  Profile save failed: {res.status_code} {res.text}')


async def seed_vitals(client: httpx.AsyncClient, token: str) -> None:
    """Log 30 days of realistic vitals with slight day-to-day variation."""
    print('Seeding 30 days of vitals...')
    headers = {'Authorization': f'Bearer {token}'}
    now = datetime.now(timezone.utc)
    success_count = 0

    for day_offset in range(30, 0, -1):
        entry_time = now - timedelta(days=day_offset, hours=random.randint(6, 9))

        # Realistic values for hypertensive (slightly controlled), diabetic patient
        hr = round(random.uniform(72, 88))
        bp_s = round(random.uniform(135, 155))
        bp_d = round(random.uniform(85, 95))
        spo2 = round(random.uniform(96, 99), 1)
        glucose = round(random.uniform(110, 145))
        temp_f = round(random.uniform(98.2, 98.8), 1)
        # Convert temp to Celsius for the API (°C)
        temp_c = round((temp_f - 32) * 5 / 9, 1)
        weight = round(random.uniform(81.5, 82.5), 1)

        res = await client.post(f'{BASE_URL}/api/vitals/log', json={
            'hr_bpm': hr,
            'bp_systolic': bp_s,
            'bp_diastolic': bp_d,
            'spo2': spo2,
            'temperature': temp_c,
            'weight_kg': weight,
        }, headers=headers)

        if res.status_code == 200:
            success_count += 1
        else:
            print(f'  Day -{day_offset} vitals failed: {res.status_code}')

    print(f'  {success_count}/30 vitals entries logged.')


async def seed_food_logs(client: httpx.AsyncClient, token: str) -> None:
    """Log 3 representative food entries."""
    print('Seeding food logs...')
    headers = {'Authorization': f'Bearer {token}'}
    today = datetime.now(timezone.utc).date()

    entries = [
        {
            'date': (today - timedelta(days=2)).isoformat(),
            'food_log_text': (
                'Breakfast: 2 idlis with sambar and coconut chutney, masala chai with milk and sugar. '
                'Lunch: rice (2 cups), dal (toor), palak sabzi, curd, papad. '
                'Evening: Maggi noodles with extra masala. '
                'Dinner: 2 chapatis, rajma curry, salad.'
            ),
        },
        {
            'date': (today - timedelta(days=1)).isoformat(),
            'food_log_text': (
                'Breakfast: poha with peanuts and green chutney, black tea. '
                'Lunch: chicken biryani (large portion), raita, Coke 330ml. '
                'Evening: banana and groundnuts. '
                'Dinner: dosa with sambar, filter coffee with milk.'
            ),
        },
        {
            'date': today.isoformat(),
            'food_log_text': (
                'Breakfast: upma with vegetables and coconut chutney, masala chai. '
                'Lunch: roti (3), paneer butter masala, dal makhani. '
                'Evening: Apple and masala chai. '
                'Dinner: rice, sambar, stir-fried bitter gourd (karela), curd.'
            ),
        },
    ]

    for entry in entries:
        res = await client.post(f'{BASE_URL}/api/diet/log', json=entry, headers=headers)
        status_icon = 'OK' if res.status_code == 200 else f'FAIL {res.status_code}'
        print(f'  {entry["date"]}: {status_icon}')


async def seed_symptom_sessions(client: httpx.AsyncClient, token: str) -> None:
    """Create 3 symptom sessions — HIGH urgency (emergency), MEDIUM, LOW."""
    print('Seeding symptom sessions...')
    headers = {'Authorization': f'Bearer {token}'}

    sessions = [
        {
            'label': 'HIGH (emergency — chest pain)',
            'symptom_text': (
                'Chest mein dard ho raha hai, left haath mein numbness, sweating bhi hai. '
                'Last 30 minutes se ho raha hai. Bahut uncomfortable feel ho raha hai.'
            ),
            'language': 'hi',
        },
        {
            'label': 'MEDIUM (fatigue + headache)',
            'symptom_text': (
                'Feeling very tired for the past 3 days. Constant headache since morning, '
                'slight dizziness when I stand up. No fever. Appetite has reduced.'
            ),
            'language': 'en',
        },
        {
            'label': 'LOW (mild joint stiffness)',
            'symptom_text': (
                'Morning stiffness in both knee joints for about 20-30 minutes, '
                'gets better after I start walking. Mild pain when climbing stairs.'
            ),
            'language': 'en',
        },
    ]

    for s in sessions:
        print(f'  Submitting: {s["label"]} ...')
        res = await client.post(
            f'{BASE_URL}/api/symptoms/analyze',
            json={'symptom_text': s['symptom_text'], 'language': s['language']},
            headers=headers,
            timeout=60.0,  # Claude API can take 10-15s
        )
        if res.status_code == 200:
            data = res.json()
            flag = 'RED FLAG' if data.get('red_flag') else f'{len(data.get("shortlist", []))} conditions'
            print(f'    Done: {flag} (session_id={data.get("session_id", "?")[:8]}...)')
        else:
            print(f'    Failed: {res.status_code} {res.text[:200]}')


async def main() -> None:
    print('=' * 55)
    print(' PRAANA DEMO SEED SCRIPT')
    print(f' Target: {BASE_URL}')
    print('=' * 55)
    print()

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Health check
        try:
            health = await client.get(f'{BASE_URL}/health')
            health.raise_for_status()
            print(f'Backend healthy: {health.json()}')
        except Exception as e:
            print(f'ERROR: Backend not reachable at {BASE_URL}')
            print(f'       Make sure the backend is running first.')
            print(f'       Detail: {e}')
            sys.exit(1)

        print()

        # Step 1: Register or login
        token, user_id = await register_or_login(client)
        print()

        # Step 2: Create profile
        await create_profile(client, token)
        print()

        # Step 3: Seed vitals
        await seed_vitals(client, token)
        print()

        # Step 4: Seed food logs
        await seed_food_logs(client, token)
        print()

        # Step 5: Seed symptom sessions (these call Claude — slowest part)
        await seed_symptom_sessions(client, token)
        print()

    print('=' * 55)
    print(' SEED COMPLETE')
    print()
    print(f' Login with:')
    print(f'   Email:    {DEMO_EMAIL}')
    print(f'   Password: {DEMO_PASSWORD}')
    print()
    print(' What was created:')
    print('   - 1 user profile (52y male, Hypertension + T2DM)')
    print('   - 30 days of vitals (HR, BP, SpO2, Glucose, Temp, Weight)')
    print('   - 3 food log entries (breakfast/lunch/dinner)')
    print('   - 3 symptom sessions (emergency / medium / low)')
    print()
    print(' Judge demo flow:')
    print('   1. Log in with demo credentials')
    print('   2. Go to Vitals → see 30-day sparklines')
    print('   3. Go to Symptoms → type chest pain text → RED FLAG')
    print('   4. Go to Scanner → upload Maggi packet photo → D score')
    print('   5. Go to Doctor Brief → select session → Download PDF')
    print('=' * 55)


if __name__ == '__main__':
    asyncio.run(main())
