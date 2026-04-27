from typing import Literal

from pydantic import BaseModel, Field, model_validator


class QuestCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=30)
    city_area: str = Field(min_length=1, max_length=255)
    difficulty: int = Field(ge=1, le=5)
    duration_minutes: int = Field(gt=0)
    rules: str | None = None


class QuestCheckpointCreate(BaseModel):
    order_index: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=255)
    lat: float
    lon: float
    task_type: Literal["codeword", "quiz"]
    task_text: str = Field(min_length=20)
    codeword_answer: str | None = None
    quiz_question: str | None = None
    quiz_options: list[str] | None = None
    quiz_correct_index: int | None = None
    hint: str | None = None
    safety_rules: str | None = None

    @model_validator(mode="after")
    def validate_task_payload(self):
        if self.task_type == "codeword":
            if not self.codeword_answer or not self.codeword_answer.strip():
                raise ValueError("codeword_answer is required for codeword task")
            return self

        if not self.quiz_question or not self.quiz_question.strip():
            raise ValueError("quiz_question is required for quiz task")
        if not self.quiz_options or len(self.quiz_options) != 4:
            raise ValueError("quiz_options must contain exactly 4 items")
        if self.quiz_correct_index is None or self.quiz_correct_index < 0 or self.quiz_correct_index > 3:
            raise ValueError("quiz_correct_index must be between 0 and 3")

        return self
