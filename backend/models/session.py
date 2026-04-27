from datetime import datetime
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field


class SymptomInput(BaseModel):
    symptom_text: str = Field(min_length=3, max_length=2000)
    language: str = 'en'


class ExtractedSymptom(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    description: str
    body_location: str | None = None
    duration: str | None = None
    severity: Literal['mild', 'moderate', 'severe', 'unknown'] = 'unknown'
    onset_type: Literal['sudden', 'gradual', 'unknown'] = 'unknown'
    aggravating_factors: list[str] = Field(default_factory=list)
    relieving_factors: list[str] = Field(default_factory=list)


class ICD11Candidate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    icd_code: str
    name: str
    probability_reasoning: str
    plain_explanation: str
    urgency: Literal['routine', 'soon', 'urgent', 'emergency']
    what_to_tell_doctor: str


class SymptomSession(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    symptom_text: str
    language: str = 'en'
    extracted_symptoms: list[ExtractedSymptom] = Field(default_factory=list)
    red_flag: bool = False
    red_flag_message: str | None = None
    ranked_conditions: list[ICD11Candidate] = Field(default_factory=list)
    doctor_talking_points: list[str] = Field(default_factory=list)
    brief_generated: bool = False


class SymptomAnalyzeResponse(BaseModel):
    session_id: str
    shortlist: list[ICD11Candidate]
    red_flag: bool
    red_flag_message: str | None
    doctor_talking_points: list[str]
