import statistics
from datetime import datetime, timedelta, timezone


def _parse_ts(ts) -> datetime:
    if isinstance(ts, datetime):
        return ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else ts
    return datetime.fromisoformat(str(ts)).replace(tzinfo=timezone.utc)


def _values_for_metric(readings: list[dict], metric: str) -> list[float]:
    return [float(r[metric]) for r in readings if r.get(metric) is not None]


def calculate_baseline(readings: list[dict], metric: str, days: int = 7) -> float | None:
    if not readings:
        return None
    sorted_readings = sorted(readings, key=lambda r: _parse_ts(r['timestamp']))
    first_ts = _parse_ts(sorted_readings[0]['timestamp'])
    cutoff = first_ts + timedelta(days=days)
    baseline_vals = [
        float(r[metric])
        for r in sorted_readings
        if r.get(metric) is not None and _parse_ts(r['timestamp']) <= cutoff
    ]
    return round(statistics.mean(baseline_vals), 2) if len(baseline_vals) >= 2 else None


def calculate_rolling_average(readings: list[dict], metric: str, days: int = 7) -> float | None:
    if not readings:
        return None
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    values = [
        float(r[metric])
        for r in readings
        if r.get(metric) is not None and _parse_ts(r['timestamp']) >= cutoff
    ]
    return round(statistics.mean(values), 2) if values else None


def detect_anomaly(current: float, baseline: float, threshold_std: float = 2.0) -> bool:
    if baseline == 0:
        return False
    one_std = baseline * 0.10
    return abs(current - baseline) > threshold_std * one_std


def detect_constellations(trends: list[dict]) -> list[dict]:
    patterns = []
    trend_map = {t['metric']: t for t in trends}

    hr = trend_map.get('hr_bpm', {})
    bp_sys = trend_map.get('bp_systolic', {})
    bp_dia = trend_map.get('bp_diastolic', {})
    spo2 = trend_map.get('spo2', {})
    weight = trend_map.get('weight_kg', {})

    # Elevated resting heart rate
    if hr.get('anomaly') and (hr.get('average_7d') or 0) > 85:
        patterns.append({
            'pattern_name': 'elevated_resting_hr',
            'metrics_involved': ['hr_bpm'],
            'clinical_significance': f'Resting HR averaging {hr.get("average_7d")} bpm — elevated above personal baseline',
            'action': 'Monitor closely. Consider cardiovascular evaluation if trend persists 3+ days.',
        })

    # Hypertensive urgency
    if (bp_sys.get('average_7d') or 0) > 140 and (bp_dia.get('average_7d') or 0) > 90 and bp_sys.get('anomaly'):
        patterns.append({
            'pattern_name': 'hypertensive_urgency',
            'metrics_involved': ['bp_systolic', 'bp_diastolic'],
            'clinical_significance': f'7-day average BP is {bp_sys.get("average_7d"):.0f}/{bp_dia.get("average_7d"):.0f} mmHg, sustained above 140/90.',
            'action': 'Contact your cardiologist or GP today. Do not adjust medications without medical guidance.',
        })

    # Respiratory concern
    if (spo2.get('average_7d') or 100) < 94 and hr.get('trend_direction') == 'rising':
        patterns.append({
            'pattern_name': 'respiratory_concern',
            'metrics_involved': ['spo2', 'hr_bpm'],
            'clinical_significance': f'SpO2 averaging {spo2.get("average_7d")}% alongside rising heart rate.',
            'action': 'Seek medical attention promptly. If SpO2 drops below 90%, go to emergency.',
        })

    # Metabolic risk
    baseline_w = weight.get('baseline') or 0
    avg_w = weight.get('average_7d') or 0
    if (avg_w - baseline_w) > 2 and bp_sys.get('trend_direction') == 'rising':
        patterns.append({
            'pattern_name': 'metabolic_risk_signals',
            'metrics_involved': ['weight_kg', 'bp_systolic'],
            'clinical_significance': 'Rising weight combined with elevated BP — possible metabolic syndrome risk.',
            'action': 'Request metabolic panel (fasting glucose, lipid profile, thyroid). Review diet.',
        })

    return patterns
