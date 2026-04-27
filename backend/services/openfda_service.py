import httpx
import logging

logger = logging.getLogger(__name__)


async def check_drug_interactions(apis: list[str], user_medications: list[str]) -> list[str]:
    interactions = []
    try:
        async with httpx.AsyncClient() as client:
            for api in apis[:5]:  # limit to avoid rate issues
                query = f'openfda.generic_name:"{api}"'
                resp = await client.get(
                    'https://api.fda.gov/drug/label.json',
                    params={'search': query, 'limit': 1},
                    timeout=5.0,
                )
                if resp.status_code != 200:
                    continue
                data = resp.json()
                results = data.get('results', [])
                if not results:
                    continue
                label = results[0]
                interactions_text = ' '.join(label.get('drug_interactions', ['']))
                for med in user_medications:
                    if med.lower() in interactions_text.lower():
                        interactions.append(
                            f'{api} may interact with {med}. Consult your doctor before taking.'
                        )
    except Exception as e:
        logger.warning('OpenFDA API error: %s', e)
    return interactions
