from pydantic import BaseModel, Field


class ModerationRejectRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=2000)
