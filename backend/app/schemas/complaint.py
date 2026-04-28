from pydantic import BaseModel, Field, model_validator


class ComplaintCreate(BaseModel):
    quest_id: int | None = None
    checkpoint_id: int | None = None
    reason: str = Field(min_length=10, max_length=2000)

    @model_validator(mode="after")
    def _validate_target(self):
        if (self.quest_id is None) == (self.checkpoint_id is None):
            raise ValueError("Exactly one of quest_id or checkpoint_id must be provided")
        return self


class ComplaintResolveRequest(BaseModel):
    status: str = Field(default="handled", pattern="^(handled)$")

