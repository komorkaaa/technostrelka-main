from typing import Literal

from pydantic import BaseModel, Field, model_validator


class RunStartRequest(BaseModel):
    quest_id: int = Field(gt=0)
    mode: Literal["solo", "team"]
    team_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_mode_payload(self):
        if self.mode == "team" and self.team_id is None:
            raise ValueError("team_id is required for team mode")
        if self.mode == "solo" and self.team_id is not None:
            raise ValueError("team_id must be empty for solo mode")
        return self


class RunSubmitRequest(BaseModel):
    codeword_answer: str | None = None
    quiz_selected_index: int | None = None
