from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None


class TeamJoin(BaseModel):
    code: str = Field(min_length=4, max_length=16)
