from datetime import datetime
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field


class ScanRequest(BaseModel):
    image_base64: str
    scan_mode: Literal['food', 'medicine']


class IngredientResult(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    ingredient_name: str
    category: Literal[
        'preservative', 'colorant', 'sweetener', 'flavour_enhancer',
        'emulsifier', 'antioxidant', 'active_pharma', 'excipient',
        'nutrient', 'natural', 'other'
    ]
    function_in_product: str
    effect_on_body: str
    daily_safe_limit: str | None = None
    safety_level: Literal['safe', 'caution', 'avoid']
    profile_interaction: bool = False
    interaction_detail: str | None = None
    score_weight: int = Field(ge=0)


class ScanResult(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    scan_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    scan_mode: Literal['food', 'medicine']
    product_name: str | None = None
    overall_score: Literal['A', 'B', 'C', 'D']
    ingredients: list[IngredientResult] = Field(default_factory=list)
    drug_interactions: list[str] = Field(default_factory=list)


class ScanResponse(BaseModel):
    scan_id: str
    timestamp: datetime
    scan_mode: Literal['food', 'medicine']
    product_name: str | None
    overall_score: Literal['A', 'B', 'C', 'D']
    ingredients: list[IngredientResult]
    drug_interactions: list[str]
