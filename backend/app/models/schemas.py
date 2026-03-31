from pydantic import BaseModel
from typing import Optional, List

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Session"
    mood_before: Optional[str] = None
    mood_word: Optional[str] = None
    opening_context: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    preferred_name: Optional[str] = None
    life_phase: Optional[str] = None
    life_goal: Optional[str] = None
    current_situation: Optional[str] = None
    persistent_context: Optional[str] = None

class UpdateTherapistSettingsRequest(BaseModel):
    therapist_name: Optional[str] = None
    therapist_tone: Optional[str] = None
    therapist_focus: Optional[List[str]] = None
    response_length: Optional[str] = None
    preferred_language: Optional[str] = None

class UpdateIntakeAnswerRequest(BaseModel):
    question_id: str
    new_answer: str

class SendMessageRequest(BaseModel):
    session_id: str
    content: str

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    mood_after: Optional[str] = None
    summary: Optional[str] = None

class AddMemoryNoteRequest(BaseModel):
    note: str
    tags: Optional[List[str]] = []

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

class SessionResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None
    created_at: str
    messages: Optional[List[MessageResponse]] = None
