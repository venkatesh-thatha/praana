import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER

PRAANA_TEAL = colors.HexColor('#0d9488')
PRAANA_DARK = colors.HexColor('#0f172a')
PRAANA_LIGHT = colors.HexColor('#f0fdfa')


def build_pdf(brief_data: dict, profile: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('PTitle', parent=styles['Heading1'], textColor=PRAANA_TEAL, fontSize=20, spaceAfter=4)
    h2_style = ParagraphStyle('PH2', parent=styles['Heading2'], textColor=PRAANA_DARK, fontSize=13, spaceAfter=4, spaceBefore=12)
    body_style = ParagraphStyle('PBody', parent=styles['Normal'], fontSize=10, leading=14)
    small_style = ParagraphStyle('PSmall', parent=styles['Normal'], fontSize=8, textColor=colors.grey, leading=11)

    story = []

    story.append(Paragraph('PRAANA — Patient Consultation Brief', title_style))
    story.append(Paragraph(f'Generated: {datetime.now().strftime("%d %B %Y, %I:%M %p")}', small_style))
    story.append(HRFlowable(width='100%', thickness=2, color=PRAANA_TEAL, spaceAfter=8))

    # Patient card
    patient = brief_data.get('patient_card', {})
    story.append(Paragraph('Patient Identity', h2_style))
    patient_rows = [
        ['Name', patient.get('name', '—')],
        ['Age / Gender', f"{patient.get('age', '—')} / {patient.get('gender', '—')}"],
        ['Blood Type', patient.get('blood_type', '—') or '—'],
        ['BMI', str(patient.get('bmi', '—')) if patient.get('bmi') else '—'],
        ['Known Conditions', ', '.join(patient.get('known_conditions', [])) or 'None'],
        ['Medications', ', '.join(patient.get('current_medications', [])) or 'None'],
        ['Allergies', ', '.join(patient.get('allergies', [])) or 'None'],
    ]
    pt = Table(patient_rows, colWidths=[5*cm, 12*cm])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), PRAANA_LIGHT),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, PRAANA_LIGHT]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.4*cm))

    # Presenting symptoms
    story.append(Paragraph('Presenting Symptoms', h2_style))
    story.append(Paragraph(brief_data.get('presenting_symptoms_clinical', '—'), body_style))

    # AI differential
    story.append(Paragraph('AI Differential Shortlist', h2_style))
    story.append(Paragraph(
        'These are possibilities for clinical consideration — not a diagnosis. All findings require physician verification.',
        small_style
    ))
    story.append(Spacer(1, 0.2*cm))
    for i, cond in enumerate(brief_data.get('ai_differential', []), 1):
        story.append(Paragraph(
            f'<b>{i}. {cond.get("condition", "")} ({cond.get("icd_code", "")})</b><br/>{cond.get("one_line_reasoning", "")}',
            body_style
        ))
        story.append(Spacer(1, 0.15*cm))

    # Vitals summary
    vitals = brief_data.get('vitals_summary', {})
    key_metrics = vitals.get('key_metrics', []) if isinstance(vitals, dict) else []
    if key_metrics:
        story.append(Paragraph(f'Vitals — Last {vitals.get("period_days", 30)} Days', h2_style))
        vm_rows = [['Metric', 'Average', 'Trend', 'Flag']]
        for m in key_metrics:
            vm_rows.append([m.get('metric', ''), m.get('average', ''), m.get('trend', ''), m.get('flag', '') or '—'])
        vt = Table(vm_rows, colWidths=[4*cm, 4*cm, 4*cm, 5*cm])
        vt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRAANA_TEAL),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PRAANA_LIGHT]),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(vt)

    # Dietary flags
    dietary_flags = brief_data.get('dietary_flags', [])
    if dietary_flags:
        story.append(Paragraph('Dietary Flags', h2_style))
        for flag in dietary_flags:
            story.append(Paragraph(f'• {flag}', body_style))

    # Questions for doctor
    questions = brief_data.get('questions_for_doctor', [])
    if questions:
        story.append(Paragraph('Suggested Questions for Doctor', h2_style))
        for q in questions:
            story.append(Paragraph(f'• {q}', body_style))

    story.append(Spacer(1, 0.8*cm))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.lightgrey))
    story.append(Spacer(1, 0.2*cm))

    disclaimer = brief_data.get(
        'disclaimer',
        'Generated by Praana AI to assist consultation — all findings require clinical verification by a licensed physician. This document does not constitute a medical diagnosis.'
    )
    story.append(Paragraph(f'⚠ {disclaimer}', small_style))
    story.append(Paragraph('Powered by Praana · praana.health', small_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
