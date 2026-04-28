from datetime import date, datetime, timezone
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field


class UserRegister(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)


class UserLogin(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    user_id: str = Field(default_factory=lambda: str(uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EyePrescription(BaseModel):
    sphere: float | None = None     # e.g. -2.5
    cylinder: float | None = None   # e.g. -0.75
    axis: int | None = None         # degrees 0-180


class EmergencyContact(BaseModel):
    name: str | None = None
    phone: str | None = None
    relation: str | None = None     # e.g. Spouse, Parent, Sibling


class PersonalInfo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120)
    dob: date | None = None
    gender: Literal['male', 'female', 'other'] | None = None
    height_cm: float | None = Field(default=None, gt=0, le=300)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    blood_type: Literal['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] | None = None
    city: str | None = None
    state: str | None = None
    language_pref: Literal['en', 'hi', 'ta'] = 'en'
    right_eye: EyePrescription = Field(default_factory=EyePrescription)
    left_eye: EyePrescription = Field(default_factory=EyePrescription)
    emergency_contact: EmergencyContact = Field(default_factory=EmergencyContact)


class MedicalHistory(BaseModel):
    conditions: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    surgeries: list[str] = Field(default_factory=list)
    family_history: list[str] = Field(default_factory=list)


class DietInfo(BaseModel):
    type: Literal['veg', 'non_veg', 'vegan', 'eggetarian'] | None = None
    restrictions: list[str] = Field(default_factory=list)
    cuisine_region: str | None = None


class ProfileCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    personal: PersonalInfo
    medical_history: MedicalHistory = Field(default_factory=MedicalHistory)
    diet: DietInfo = Field(default_factory=DietInfo)


class ProfileResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    user_id: str
    personal: PersonalInfo
    medical_history: MedicalHistory
    diet: DietInfo | None

    @computed_field
    @property
    def bmi(self) -> float | None:
        h = self.personal.height_cm
        w = self.personal.weight_kg
        if h and w and h > 0:
            return round(w / ((h / 100) ** 2), 1)
        return None

    @computed_field
    @property
    def age(self) -> int | None:
        dob = self.personal.dob
        if not dob:
            return None
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
