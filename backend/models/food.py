from datetime import date, datetime, timezone
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field


class ParsedFoodItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    food_name: str
    estimated_qty: str | None = None
    nutritional_data: dict | None = None


class DeficiencyFlag(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    nutrient: str
    severity: Literal['mild', 'moderate', 'high']
    detail: str
    profile_relevance: str


class FoodSymptomCorrelation(BaseModel):
    food: str
    symptom: str
    mechanism: str


class AdditiveWarning(BaseModel):
    additive: str
    e_number: str | None = None
    concern: str
    profile_interaction: str | None = None


class SubstitutionSuggestion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    replace: str
    with_food: str = Field(alias='with')
    reason: str
    budget_friendly: bool = True


class NutritionalSummary(BaseModel):
    calories_kcal: float | None = None
    protein_g: float | None = None
    carbohydrates_g: float | None = None
    fat_g: float | None = None
    fibre_g: float | None = None
    sugar_g: float | None = None
    sodium_mg: float | None = None
    iron_mg: float | None = None
    calcium_mg: float | None = None
    vitamin_c_mg: float | None = None
    vitamin_d_iu: float | None = None
    vitamin_b12_mcg: float | None = None


class DietAnalysis(BaseModel):
    nutritional_summary: NutritionalSummary
    deficiency_flags: list[DeficiencyFlag] = Field(default_factory=list)
    food_symptom_correlations: list[FoodSymptomCorrelation] = Field(default_factory=list)
    additive_warnings: list[AdditiveWarning] = Field(default_factory=list)
    substitution_suggestions: list[SubstitutionSuggestion] = Field(default_factory=list)


class FoodLogEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    log_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    date: date
    food_log_text: str
    parsed_items: list[ParsedFoodItem] = Field(default_factory=list)
    analysis: DietAnalysis | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DietLogRequest(BaseModel):
    food_log_text: str = Field(min_length=3, max_length=5000)
    date: str


class DietAnalyzeRequest(BaseModel):
    food_log_text: str | None = None
    date: str
