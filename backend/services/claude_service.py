import anthropic
import json
import logging
from ..config import get_settings
from .prompts import (
    SYMPTOM_EXTRACTOR_PROMPT,
    DIAGNOSTIC_REASONER_PROMPT,
    DIET_ANALYST_PROMPT,
    INGREDIENT_ANALYSER_PROMPT,
    VITALS_PATTERN_ANALYST_PROMPT,
    DOCTOR_BRIEF_WRITER_PROMPT,
    EXERCISE_RECOMMENDER_PROMPT,
    LAB_REPORT_ANALYST_PROMPT,
    WELLNESS_TIP_PROMPT,
    AYURVEDIC_PLANT_PROMPT,
    SKIN_ANALYSER_PROMPT,
    XRAY_ANALYSER_PROMPT,
    HERBS_REMEDY_PROMPT,
)

logger = logging.getLogger(__name__)
MODEL = 'claude-sonnet-4-5'


def _get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=get_settings().anthropic_api_key)


def _strip_fences(text: str) -> str:
    """Strip markdown code fences from Claude's response, including ```json ... ``` patterns."""
    text = text.strip()
    if text.startswith('```'):
        # Remove opening fence line (handles ```json, ```python, ``` etc.)
        lines = text.split('\n', 1)
        text = lines[1] if len(lines) > 1 else ''
        # Remove closing fence
        text = text.rsplit('```', 1)[0]
    return text.strip()


async def _call_claude(system_prompt: str, user_message: str, max_tokens: int = 4096) -> dict:
    client = _get_client()
    response = await client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{'role': 'user', 'content': user_message}],
    )
    text = _strip_fences(response.content[0].text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error('Claude returned non-JSON response. Raw text: %s', text[:500])
        raise ValueError(f'Claude returned non-JSON output. Parse error: {e}') from e


async def analyze_symptoms(symptom_text: str, language: str, user_profile: dict) -> dict:
    user_msg = f'Language: {language}\nSymptoms: {symptom_text}'
    return await _call_claude(SYMPTOM_EXTRACTOR_PROMPT, user_msg)


async def rank_conditions(icd_candidates: list, user_profile: dict) -> dict:
    user_msg = (
        f'User Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        f'ICD-11 Candidates:\n{json.dumps(icd_candidates, default=str)}'
    )
    # If no ICD candidates, Claude will generate its own differential
    if not icd_candidates:
        user_msg += '\n\nNote: No ICD-11 candidates available. Generate a clinical differential based on profile and symptom context.'
    return await _call_claude(DIAGNOSTIC_REASONER_PROMPT, user_msg)


async def analyze_diet(food_log_text: str, user_profile: dict, ifct_data: list | None = None) -> dict:
    ifct_section = ''
    if ifct_data:
        ifct_section = f'\n\nIFCT 2017 Nutritional Data (matched items):\n{json.dumps(ifct_data, default=str)}'
    user_msg = (
        f'User Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        f'Food Log:\n{food_log_text}'
        f'{ifct_section}'
    )
    return await _call_claude(DIET_ANALYST_PROMPT, user_msg)


async def analyze_label(image_base64: str, scan_mode: str, user_profile: dict) -> dict:
    client = _get_client()
    response = await client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=INGREDIENT_ANALYSER_PROMPT,
        messages=[{
            'role': 'user',
            'content': [
                {
                    'type': 'image',
                    'source': {
                        'type': 'base64',
                        'media_type': 'image/jpeg',
                        'data': image_base64,
                    },
                },
                {
                    'type': 'text',
                    'text': (
                        f'Scan mode: {scan_mode}\n'
                        f'User Profile:\n{json.dumps(user_profile, default=str)}\n\n'
                        'Extract all ingredients from this label image and analyze each one. '
                        'Return JSON with product_name, overall_score (A/B/C/D), score_explanation, '
                        'ingredients array, critical_warnings array, and overall_suitable_for_patient bool.'
                    ),
                },
            ],
        }],
    )
    text = _strip_fences(response.content[0].text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error('Claude (analyze_label) returned non-JSON. Raw text: %s', text[:500])
        raise ValueError(f'Claude returned non-JSON output for label analysis. Parse error: {e}') from e


async def analyze_vitals(trend_data: dict, user_profile: dict) -> dict:
    user_msg = (
        f'User Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        f'Vitals Trend Data:\n{json.dumps(trend_data, default=str)}'
    )
    return await _call_claude(VITALS_PATTERN_ANALYST_PROMPT, user_msg)


async def recommend_exercise(
    profile: dict,
    vitals_trend: list,
    symptom_context: dict,
    exercise_library: list,
) -> dict:
    client = _get_client()
    user_msg = (
        f'User Profile:\n{json.dumps(profile, default=str)}\n\n'
        f'Recent Vitals Trend:\n{json.dumps(vitals_trend, default=str)}\n\n'
        f'Recent Symptom Context:\n{json.dumps(symptom_context, default=str)}\n\n'
        f'Available Exercises (pre-filtered for contraindications):\n{json.dumps(exercise_library[:20], default=str)}\n\n'
        'Select the best exercise for this user today. Return JSON: '
        '{"primary": {exercise + "why_for_you": string}, "alternatives": [2 exercises], '
        '"rest_day_recommended": bool, "rest_reason": string | null}'
    )
    response = await client.messages.create(
        model=MODEL,
        max_tokens=3500,
        system=EXERCISE_RECOMMENDER_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )
    text = _strip_fences(response.content[0].text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error('Claude (recommend_exercise) returned non-JSON. Raw text: %s', text[:500])
        raise ValueError(f'Claude returned non-JSON output for exercise recommendation. Parse error: {e}') from e


async def generate_brief(all_data: dict) -> dict:
    user_msg = f'Session Data:\n{json.dumps(all_data, default=str)}'
    return await _call_claude(DOCTOR_BRIEF_WRITER_PROMPT, user_msg, max_tokens=3000)


async def analyze_lab_report(image_base64: str, media_type: str, user_profile: dict) -> dict:
    """Analyze a lab report image or PDF using Claude Vision / Document API."""
    client = _get_client()

    if media_type == 'application/pdf':
        content_block = {
            'type': 'document',
            'source': {'type': 'base64', 'media_type': 'application/pdf', 'data': image_base64},
        }
    else:
        content_block = {
            'type': 'image',
            'source': {'type': 'base64', 'media_type': media_type, 'data': image_base64},
        }

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=LAB_REPORT_ANALYST_PROMPT,
            messages=[{
                'role': 'user',
                'content': [
                    content_block,
                    {
                        'type': 'text',
                        'text': (
                            f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
                            'Analyze this lab report. Extract all test values, flag abnormal ones, '
                            'and provide plain language explanations. Cross-reference with the patient profile provided.'
                        ),
                    },
                ],
            }],
        )
        text = _strip_fences(response.content[0].text)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error('Claude (analyze_lab_report) returned non-JSON. Raw text: %s', text[:500])
            raise ValueError(f'Lab report analysis failed to parse: {e}') from e
    except Exception as e:
        logger.error('analyze_lab_report error: %s', str(e))
        raise


async def generate_wellness_content(user_profile: dict) -> dict:
    """Return both a daily wellness tip and an Ayurvedic plant suggestion via two parallel Claude calls."""
    import asyncio

    tip_msg = (
        f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        'Generate a personalized wellness tip for today.'
    )
    plant_msg = (
        f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        'Suggest one Ayurvedic plant or herb relevant to this patient.'
    )

    tip_result, plant_result = await asyncio.gather(
        _call_claude(WELLNESS_TIP_PROMPT, tip_msg, max_tokens=1024),
        _call_claude(AYURVEDIC_PLANT_PROMPT, plant_msg, max_tokens=1024),
    )
    return {'tip': tip_result, 'plant': plant_result}


async def analyze_skin(image_base64: str, media_type: str, user_profile: dict) -> dict:
    """Analyze a skin photo using Claude Vision cross-referenced with patient profile."""
    client = _get_client()
    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SKIN_ANALYSER_PROMPT,
            messages=[{
                'role': 'user',
                'content': [
                    {
                        'type': 'image',
                        'source': {'type': 'base64', 'media_type': media_type, 'data': image_base64},
                    },
                    {
                        'type': 'text',
                        'text': (
                            f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
                            'Analyze this skin image. Cross-reference with the patient profile '
                            'for any relevant conditions or medications that affect your assessment.'
                        ),
                    },
                ],
            }],
        )
        text = _strip_fences(response.content[0].text)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error('analyze_skin returned non-JSON: %s', text[:500])
            raise ValueError(f'Skin analysis failed to parse: {e}') from e
    except Exception as e:
        logger.error('analyze_skin error: %s', str(e))
        raise


async def analyze_xray(image_base64: str, media_type: str, user_profile: dict) -> dict:
    """Analyze an X-ray image using Claude Vision with patient profile context."""
    client = _get_client()

    if media_type == 'application/pdf':
        content_block = {
            'type': 'document',
            'source': {'type': 'base64', 'media_type': 'application/pdf', 'data': image_base64},
        }
    else:
        content_block = {
            'type': 'image',
            'source': {'type': 'base64', 'media_type': media_type, 'data': image_base64},
        }

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=XRAY_ANALYSER_PROMPT,
            messages=[{
                'role': 'user',
                'content': [
                    content_block,
                    {
                        'type': 'text',
                        'text': (
                            f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
                            'Analyze this X-ray. Describe the visible structures and findings, '
                            'provide density assessments, and cross-reference with the patient profile.'
                        ),
                    },
                ],
            }],
        )
        text = _strip_fences(response.content[0].text)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error('analyze_xray returned non-JSON: %s', text[:500])
            raise ValueError(f'X-ray analysis failed to parse: {e}') from e
    except Exception as e:
        logger.error('analyze_xray error: %s', str(e))
        raise


async def generate_remedies(user_profile: dict) -> dict:
    """Generate personalized Indian home remedy suggestions based on user profile."""
    client = _get_client()
    user_msg = (
        f'Patient Profile:\n{json.dumps(user_profile, default=str)}\n\n'
        'Generate 3-4 personalized Indian home remedies.'
    )
    response = await client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=HERBS_REMEDY_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )
    text = _strip_fences(response.content[0].text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error('Claude (generate_remedies) returned non-JSON: %s', text[:300])
        raise ValueError(f'Non-JSON response from Claude: {e}') from e
