from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from uuid import UUID

class PersonalityProfile(BaseModel):
    attachment_style: str
    neuroticism_score: int
    extraversion: str
    conscientiousness: str
    core_belief_valence: str
    therapy_style_preference: str
    primary_stressor_domains: List[str]
    emotional_expression_style: str
    coping_style: str
    free_text_reflection: Optional[str] = None
    flag_needs_care: bool = False

class IntakeRequest(BaseModel):
    responses: Dict[str, Any]
    personality_profile: PersonalityProfile
