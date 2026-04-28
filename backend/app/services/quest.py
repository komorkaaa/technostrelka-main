import secrets
from pathlib import Path

from datetime import datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.quest import Quest, QuestCheckpoint
from app.models.user import User
from app.schemas.quest import ModerationQuestUpdate, QuestCheckpointCreate, QuestCreate


def create_quest(db: Session, user: User, data: QuestCreate) -> Quest:
    quest = Quest(
        author_user_id=user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        city_area=data.city_area.strip(),
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        rules=data.rules,
        status="draft",
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest


def _validate_checkpoint_payload(data: QuestCheckpointCreate) -> None:
    task_type = data.task_type

    if task_type == "codeword":
        if not data.codeword_answer:
            raise HTTPException(status_code=400, detail="Нужно заполнить код-слово (codeword_answer)")
        return

    if not data.quiz_options or len(data.quiz_options) != 4:
        raise HTTPException(status_code=400, detail="Вариантов ответа должно быть ровно 4 (quiz_options)")
    if data.quiz_correct_index is None or data.quiz_correct_index < 0 or data.quiz_correct_index > 3:
        raise HTTPException(status_code=400, detail="Правильный вариант должен быть от 0 до 3 (quiz_correct_index)")
    if not data.quiz_question:
        raise HTTPException(status_code=400, detail="Нужно заполнить вопрос (quiz_question)")


def add_checkpoint(db: Session, user: User, quest_id: int, data: QuestCheckpointCreate) -> QuestCheckpoint:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Редактировать точки может только автор квеста")
    if quest.status != "draft":
        raise HTTPException(status_code=409, detail="Точки можно редактировать только в статусе draft")

    _validate_checkpoint_payload(data)
    task_type = data.task_type

    checkpoint = QuestCheckpoint(
        quest_id=quest.id,
        order_index=data.order_index,
        title=data.title.strip(),
        lat=data.lat,
        lon=data.lon,
        task_type=task_type,
        task_text=data.task_text.strip(),
        codeword_answer=data.codeword_answer.strip() if data.codeword_answer else None,
        quiz_question=data.quiz_question.strip() if data.quiz_question else None,
        quiz_options=data.quiz_options,
        quiz_correct_index=data.quiz_correct_index,
        hint=data.hint,
        safety_rules=data.safety_rules,
    )
    db.add(checkpoint)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Номер точки (order_index) должен быть уникальным в квесте")
    db.refresh(checkpoint)
    return checkpoint


def submit_quest_for_moderation(db: Session, user: User, quest_id: int) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Отправить квест может только автор")
    if quest.status != "draft":
        raise HTTPException(status_code=409, detail="Отправить на модерацию можно только квест в статусе draft")

    checkpoints_count = db.query(QuestCheckpoint).filter(QuestCheckpoint.quest_id == quest.id).count()
    if checkpoints_count < 3:
        raise HTTPException(status_code=400, detail="Квест должен содержать минимум 3 точки")

    quest.status = "moderation"
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def _difficulty_range_for_preset(preset: str) -> tuple[int, int] | None:
    preset = preset.strip().lower()
    if preset == "ask":
        return (1, 2)
    if preset == "play":
        return (3, 3)
    if preset == "pro":
        return (4, 5)
    return None


def list_published_quests(
    db: Session,
    page: int,
    min_duration: int | None = None,
    max_duration: int | None = None,
    difficulty_preset: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_m: float | None = None,
) -> tuple[list[Quest], bool]:
    offset = (page - 1) * 10

    q = db.query(Quest).filter(Quest.status == "published")

    if min_duration is not None:
        q = q.filter(Quest.duration_minutes >= min_duration)
    if max_duration is not None:
        q = q.filter(Quest.duration_minutes <= max_duration)

    if difficulty_preset:
        rng = _difficulty_range_for_preset(difficulty_preset)
        if not rng:
            raise HTTPException(status_code=400, detail="Некорректный preset сложности")
        lo, hi = rng
        q = q.filter(Quest.difficulty >= lo, Quest.difficulty <= hi)

    # Nearby filter: by start checkpoint (order_index=1).
    if lat is not None or lon is not None or radius_m is not None:
        if lat is None or lon is None or radius_m is None:
            raise HTTPException(status_code=400, detail="lat, lon и radius_m должны быть переданы вместе")
        if radius_m <= 0:
            raise HTTPException(status_code=400, detail="radius_m должен быть больше 0")

        start_cp = QuestCheckpoint
        q = q.join(
            start_cp,
            and_(start_cp.quest_id == Quest.id, start_cp.order_index == 1),
        )

        # Cheap bounding box prefilter (degrees).
        # 1 deg latitude ~= 111_320 m; longitude depends on latitude.
        deg_lat = radius_m / 111_320.0
        q = q.filter(start_cp.lat.between(lat - deg_lat, lat + deg_lat))

        # Avoid division by zero near the poles.
        import math

        cos_lat = max(0.1, abs(math.cos(math.radians(lat))))
        deg_lon = radius_m / (111_320.0 * cos_lat)
        q = q.filter(start_cp.lon.between(lon - deg_lon, lon + deg_lon))

        # Precise haversine (meters) using SQL functions.
        from sqlalchemy import func

        r = 6_371_000.0
        lat1 = func.radians(lat)
        lon1 = func.radians(lon)
        lat2 = func.radians(start_cp.lat)
        lon2 = func.radians(start_cp.lon)

        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = func.pow(func.sin(dlat / 2.0), 2) + func.cos(lat1) * func.cos(lat2) * func.pow(
            func.sin(dlon / 2.0), 2
        )
        c = 2.0 * func.atan2(func.sqrt(a), func.sqrt(1.0 - a))
        distance_m = r * c

        q = q.filter(distance_m <= radius_m)

    rows = (
        q.order_by(Quest.created_at.desc())
        .offset(offset)
        .limit(11)
        .all()
    )
    has_next = len(rows) > 10
    return rows[:10], has_next


def get_published_quest_with_checkpoints(db: Session, quest_id: int) -> tuple[Quest, list[QuestCheckpoint]]:
    quest = db.get(Quest, quest_id)
    if not quest or quest.status != "published":
        raise HTTPException(status_code=404, detail="Квест не найден")

    checkpoints = (
        db.query(QuestCheckpoint)
        .filter(QuestCheckpoint.quest_id == quest.id)
        .order_by(QuestCheckpoint.order_index.asc())
        .all()
    )
    return quest, checkpoints


def list_moderation_quests(db: Session, statuses: list[str] | None = None) -> list[Quest]:
    allowed_statuses = {"draft", "moderation", "published", "rejected", "hidden", "archived"}
    filtered_statuses = [status for status in (statuses or ["moderation"]) if status in allowed_statuses]
    if not filtered_statuses:
        filtered_statuses = ["moderation"]

    return (
        db.query(Quest)
        .filter(Quest.status.in_(filtered_statuses))
        .order_by(Quest.created_at.asc())
        .all()
    )


def get_quest_with_checkpoints_for_moderation(db: Session, quest_id: int) -> tuple[Quest, list[QuestCheckpoint]]:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="РљРІРµСЃС‚ РЅРµ РЅР°Р№РґРµРЅ")

    checkpoints = (
        db.query(QuestCheckpoint)
        .filter(QuestCheckpoint.quest_id == quest.id)
        .order_by(QuestCheckpoint.order_index.asc())
        .all()
    )
    return quest, checkpoints


def update_quest_for_moderation(db: Session, quest_id: int, data: ModerationQuestUpdate) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="РљРІРµСЃС‚ РЅРµ РЅР°Р№РґРµРЅ")
    if quest.status not in {"moderation", "hidden", "rejected"}:
        raise HTTPException(status_code=409, detail="Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ РєРІРµСЃС‚ РЅР° РјРѕРґРµСЂР°С†РёРё, СЃРєСЂС‹С‚С‹Р№ РёР»Рё РѕС‚РєР»РѕРЅС‘РЅРЅС‹Р№")

    quest.title = data.title.strip()
    quest.description = data.description.strip()
    quest.city_area = data.city_area.strip()
    quest.difficulty = data.difficulty
    quest.duration_minutes = data.duration_minutes
    quest.rules = data.rules.strip() if data.rules else None
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def approve_quest(db: Session, quest_id: int) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.status != "moderation":
        raise HTTPException(status_code=409, detail="Одобрить можно только квест в статусе moderation")

    quest.status = "published"
    quest.reject_reason = None
    quest.published_at = datetime.utcnow()
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def reject_quest(db: Session, quest_id: int, reason: str) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.status != "moderation":
        raise HTTPException(status_code=409, detail="Отклонить можно только квест в статусе moderation")

    quest.status = "rejected"
    quest.reject_reason = reason.strip()
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def archive_quest(db: Session, user: User, quest_id: int) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Архивировать квест может только автор")
    if quest.status != "published":
        raise HTTPException(status_code=409, detail="Архивировать можно только опубликованный квест")

    quest.status = "archived"
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def hide_quest(db: Session, quest_id: int) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.status != "published":
        raise HTTPException(status_code=409, detail="Скрыть можно только опубликованный квест")

    quest.status = "hidden"
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


def set_quest_cover(db: Session, user: User, quest_id: int, file: UploadFile) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if quest.author_user_id != user.id:
        raise HTTPException(status_code=403, detail="Загрузить обложку может только автор")
    if quest.status != "draft":
        raise HTTPException(status_code=409, detail="Обложку можно загрузить только в статусе draft")

    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Обложка должна быть изображением")

    original_name = (file.filename or "cover").strip()
    suffix = Path(original_name).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        # Keep it simple for MVP; prevents tricky content types masquerading as images.
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения")

    upload_dir = Path(settings.media_dir_path)
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"quest_{quest.id}_{secrets.token_hex(8)}{suffix}"
    dest_path = upload_dir / filename

    total = 0
    with dest_path.open("wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > settings.QUEST_COVER_MAX_BYTES:
                try:
                    dest_path.unlink(missing_ok=True)
                except Exception:
                    pass
                raise HTTPException(status_code=400, detail="Слишком большой файл обложки (макс. 5 МБ)")
            out.write(chunk)

    quest.cover_path = f"/uploads/{filename}"
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest
