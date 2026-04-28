from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field, model_validator


class VitalsEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    vitals_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    hr_bpm: float | None = Field(default=None, gt=0, le=300)
    bp_systolic: float | None = Field(default=None, gt=0, le=300)
    bp_diastolic: float | None = Field(default=None, gt=0, le=200)
    spo2: float | None = Field(default=None, ge=50, le=100)
    temperature: float | None = Field(default=None, ge=30, le=45)
    weight_kg: float | None = Field(default=None, gt=0, le=500)


class VitalsLogRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    hr_bpm: float | None = Field(default=None, gt=0, le=300)
    bp_systolic: float | None = Field(default=None, gt=0, le=300)
    bp_diastolic: float | None = Field(default=None, gt=0, le=200)
    spo2: float | None = Field(default=None, ge=50, le=100)
    temperature: float | None = Field(default=None, ge=30, le=45)
    weight_kg: float | None = Field(default=None, gt=0, le=500)

    @model_validator(mode='after')
    def at_least_one_metric(self) -> 'VitalsLogRequest':
        fields = (self.hr_bpm, self.bp_systolic, self.bp_diastolic, self.spo2, self.temperature, self.weight_kg)
        if all(v is None for v in fields):
            raise ValueError('At least one vitals metric must be provided.')
        return self


class VitalsTrend(BaseModel):
    metric: str
    average_7d: float
    average_30d: float | None = None
    baseline: float | None = None
    trend_direction: Literal['rising', 'falling', 'stable']
    anomaly: bool = False


class VitalsAlert(BaseModel):
    metric: str
    trend_direction: Literal['rising', 'falling', 'stable']
    deviation_from_baseline: str
    concern_level: Literal['normal', 'watch', 'concern', 'urgent']
    plain_description: str
    recommendation: str


class ConstellationPattern(BaseModel):
    pattern_name: str
    metrics_involved: list[str]
    clinical_significance: str
    action: str


class VitalsAnalysisResponse(BaseModel):
    trends: list[VitalsTrend]
    alerts: list[VitalsAlert]
    constellation_patterns: list[ConstellationPattern]
    overall_trend: str
    follow_up_recommended: bool
