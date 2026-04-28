import random
import secrets
import sys
from pathlib import Path
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

# Ensure `/app` is on sys.path when running as a standalone script inside Docker
# (python sets sys.path[0] to the script directory: `/app/scripts`).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.quest import Quest, QuestCheckpoint
from app.models.run import RunCheckpointProgress, RunSession
from app.models.team import Team, TeamMember
from app.models.user import User
from app.models.complaint import Complaint


def _create_users(db: Session) -> tuple[list[User], User]:
    """
    Creates realistic demo users for Nizhny Novgorod.

    Note: for MVP roles are only: user, moderator.
    """
    demo_password = "demo123"
    users: list[User] = []

    demo_users = [
        {"email": "masha.nn@example.com", "nickname": "masha_nn", "age_group": "14-15"},
        {"email": "dima.nn@example.com", "nickname": "dima_walks", "age_group": "14-15"},
        {"email": "katya.nn@example.com", "nickname": "katya_pokrovka", "age_group": "14-15"},
        {"email": "artem.nn@example.com", "nickname": "artem_gorky", "age_group": "16-17"},
        {"email": "lena.nn@example.com", "nickname": "lena_sormovo", "age_group": "16-17"},
        {"email": "nikita.nn@example.com", "nickname": "nikita_auto", "age_group": "16-17"},
        {"email": "sonya.nn@example.com", "nickname": "sonya_river", "age_group": "14-15"},
        {"email": "ivan.nn@example.com", "nickname": "ivan_nn52", "age_group": "16-17"},
    ]

    for row in demo_users:
        user = User(
            email=row["email"],
            nickname=row["nickname"],
            age_group=row["age_group"],
            hashed_password=hash_password(demo_password),
            role="user",
        )
        db.add(user)
        users.append(user)

    moderator = User(
        # For jury convenience we keep login exactly "moderator"
        email="moderator",
        nickname="moderator",
        age_group=None,
        hashed_password=hash_password(demo_password),
        role="moderator",
    )
    db.add(moderator)

    db.flush()
    return users, moderator


def _create_teams(db: Session, users: list[User]) -> tuple[list[Team], dict[int, list[int]]]:
    # Fixed-ish teams for realism; join codes are random but deterministic via random.seed().
    by_nick = {u.nickname: u for u in users if u.nickname}

    team_specs = [
        {
            "name": "Покровские искатели",
            "description": "Любим центр и задания на внимательность.",
            "owner": "katya_pokrovka",
            "members": ["katya_pokrovka", "masha_nn", "dima_walks"],
        },
        {
            "name": "Сормово GO",
            "description": "Парки, дворы и безопасные маршруты — наше всё.",
            "owner": "lena_sormovo",
            "members": ["lena_sormovo", "ivan_nn52", "sonya_river"],
        },
        {
            "name": "Автозаводские профи",
            "description": "Если квест далеко — всё равно дойдём.",
            "owner": "nikita_auto",
            "members": ["nikita_auto", "artem_gorky"],
        },
        {
            "name": "Горький квест-клуб",
            "description": "Умеем играть быстро, но честно.",
            "owner": "artem_gorky",
            "members": ["artem_gorky", "masha_nn", "ivan_nn52"],
        },
    ]

    teams: list[Team] = []
    members_map: dict[int, list[int]] = {}

    for spec in team_specs:
        owner = by_nick[spec["owner"]]
        team = Team(
            name=spec["name"],
            description=spec["description"],
            join_code=secrets.token_hex(4).upper(),
            owner_user_id=owner.id,
        )
        db.add(team)
        db.flush()
        teams.append(team)

        member_ids: list[int] = []
        for nick in spec["members"]:
            u = by_nick[nick]
            member_ids.append(u.id)
            db.add(
                TeamMember(
                    team_id=team.id,
                    user_id=u.id,
                    role="owner" if u.id == owner.id else "member",
                )
            )
        members_map[team.id] = member_ids

    return teams, members_map


def _nn_quests_dataset() -> list[dict]:
    """
    Realistic routes in Nizhny Novgorod (approx coordinates, on land).
    Task texts are safe and "PG": no risky actions.
    """
    return [
        {
            "title": "Центр за 60 минут: от Кремля до Покровки",
            "description": (
                "Неспешный городской маршрут по историческому центру: Кремль, Чкаловская лестница, "
                "пешеходная Покровка и пара уютных площадей. Без захода на проезжую часть."
            ),
            "city_area": "Нижний Новгород, Нижегородский район",
            "difficulty": 2,
            "duration_minutes": 60,
            "rules": "Переходите дороги только по переходам. Не подходите к обрыву у набережной.",
            "status": "published",
            "checkpoints": [
                {
                    "title": "Нижегородский кремль (у Дмитриевской башни)",
                    "lat": 56.3286,
                    "lon": 44.0020,
                    "task_type": "quiz",
                    "task_text": "Осмотритесь вокруг и выберите верный ответ про главную башню входа в Кремль.",
                    "quiz_question": "Как называется главная входная башня Нижегородского кремля?",
                    "quiz_options": ["Дмитриевская", "Зачатская", "Борисоглебская", "Ильинская"],
                    "quiz_correct_index": 0,
                    "hint": "Подсказка: это «лицевая» башня у площади Минина.",
                    "safety_rules": "Не заходите за ограждения, держитесь тротуаров.",
                },
                {
                    "title": "Площадь Минина и Пожарского",
                    "lat": 56.3299,
                    "lon": 44.0088,
                    "task_type": "codeword",
                    "task_text": "Найдите на площади название и введите код-слово (подсказка ниже).",
                    "codeword_answer": "MININ",
                    "hint": "Код-слово — фамилия героя площади латиницей.",
                    "safety_rules": "Не выходите на проезжую часть, переходите по переходам.",
                },
                {
                    "title": "Чкаловская лестница (верхняя площадка)",
                    "lat": 56.3291,
                    "lon": 44.0125,
                    "task_type": "quiz",
                    "task_text": "На верхней площадке выберите правильный факт о лестнице.",
                    "quiz_question": "Сколько примерно ступеней у Чкаловской лестницы (принятое число)?",
                    "quiz_options": ["560", "800", "1200", "200"],
                    "quiz_correct_index": 0,
                    "hint": "Число широко известно и часто встречается в описаниях.",
                    "safety_rules": "Держитесь перил, не бегайте по ступеням.",
                },
                {
                    "title": "Большая Покровская (пешеходная часть)",
                    "lat": 56.3207,
                    "lon": 44.0027,
                    "task_type": "codeword",
                    "task_text": "Найдите пешеходную улицу и введите код-слово по теме маршрута.",
                    "codeword_answer": "POKROVKA",
                    "hint": "Местные часто называют улицу одним коротким словом.",
                    "safety_rules": "Не мешайте прохожим, уважайте правила общественных мест.",
                },
            ],
        },
        {
            "title": "Стрелка и Ярмарка: вид на слияние рек",
            "description": (
                "Маршрут по Стрелке и вокруг Нижегородской ярмарки: красивые виды, просторные площади, "
                "безопасные тротуары и набережные."
            ),
            "city_area": "Нижний Новгород, Канавинский район",
            "difficulty": 2,
            "duration_minutes": 75,
            "rules": "Не подходите к кромке воды. Фотографируйте только с безопасных площадок.",
            "status": "published",
            "checkpoints": [
                {
                    "title": "Собор Александра Невского",
                    "lat": 56.3376,
                    "lon": 43.9633,
                    "task_type": "quiz",
                    "task_text": "Осмотритесь у собора и ответьте на вопрос.",
                    "quiz_question": "Какой собор находится на Стрелке у слияния Оки и Волги?",
                    "quiz_options": [
                        "Александра Невского",
                        "Покровский",
                        "Архангельский",
                        "Спасо-Преображенский",
                    ],
                    "quiz_correct_index": 0,
                    "hint": "Подсказка: имя связано с князем.",
                    "safety_rules": "Не заходите на проезжую часть, держитесь тротуаров.",
                },
                {
                    "title": "Пакгаузы (территория у Стрелки)",
                    "lat": 56.3366,
                    "lon": 43.9574,
                    "task_type": "codeword",
                    "task_text": "Найдите слово, связанное со старинными конструкциями, и введите код-слово.",
                    "codeword_answer": "PAGGAUZ",
                    "hint": "Код-слово — созвучно названию места, латиницей.",
                    "safety_rules": "Не перелезайте ограждения и не заходите на стройплощадки.",
                },
                {
                    "title": "Нижегородская ярмарка (главный корпус)",
                    "lat": 56.3230,
                    "lon": 43.9550,
                    "task_type": "quiz",
                    "task_text": "У ярмарки выберите правильный вариант.",
                    "quiz_question": "В каком районе находится Нижегородская ярмарка?",
                    "quiz_options": ["Канавинский", "Сормовский", "Автозаводский", "Приокский"],
                    "quiz_correct_index": 0,
                    "hint": "Подсказка: район начинается на «К».",
                    "safety_rules": "Переходите дороги только по переходам.",
                },
            ],
        },
        {
            "title": "Парк «Швейцария»: зелёный маршрут",
            "description": (
                "Прогулка по парку «Швейцария» и окрестным видовым точкам. "
                "Подходит для команды, задания на внимательность и знание города."
            ),
            "city_area": "Нижний Новгород, Приокский район",
            "difficulty": 3,
            "duration_minutes": 90,
            "rules": "Ходите по дорожкам, не сходите на крутые склоны. В тёмное время лучше не проходить.",
            "status": "moderation",
            "checkpoints": [
                {
                    "title": "Вход в парк «Швейцария» (основной вход)",
                    "lat": 56.2919,
                    "lon": 44.0318,
                    "task_type": "codeword",
                    "task_text": "Найдите название парка и введите код-слово.",
                    "codeword_answer": "SWISS",
                    "hint": "Код-слово — «швейцария» по смыслу, коротко.",
                    "safety_rules": "Не бегайте по лестницам, соблюдайте правила парка.",
                },
                {
                    "title": "Аллея в парке (любой стенд с картой)",
                    "lat": 56.2928,
                    "lon": 44.0297,
                    "task_type": "quiz",
                    "task_text": "Найдите информационный стенд и ответьте на вопрос.",
                    "quiz_question": "Как лучше всего передвигаться по парку для безопасности?",
                    "quiz_options": ["По дорожкам", "По склонам", "Через кусты", "По краю обрыва"],
                    "quiz_correct_index": 0,
                    "hint": "Очевидный вариант — самый безопасный.",
                    "safety_rules": "Не сходите с троп, не перелезайте ограждения.",
                },
                {
                    "title": "Смотровая площадка (в пределах парка)",
                    "lat": 56.2898,
                    "lon": 44.0269,
                    "task_type": "codeword",
                    "task_text": "Сделайте фото вида (не людей) и введите код-слово по теме.",
                    "codeword_answer": "VIEW",
                    "hint": "Код-слово — «вид» по-английски.",
                    "safety_rules": "Не подходите близко к краю, держитесь за перила.",
                },
            ],
        },
        {
            "title": "Сормово: парк и уютные места",
            "description": (
                "Маршрут по Сормовскому району: парк, прогулочные дорожки и спокойные локации. "
                "Подойдёт новичкам."
            ),
            "city_area": "Нижний Новгород, Сормовский район",
            "difficulty": 1,
            "duration_minutes": 55,
            "rules": "Не заходите на детские площадки без необходимости. Следите за временем и погодой.",
            "status": "published",
            "checkpoints": [
                {
                    "title": "Сормовский парк (вход)",
                    "lat": 56.3362,
                    "lon": 43.8675,
                    "task_type": "quiz",
                    "task_text": "Старт в Сормовском парке: ответьте на простой вопрос.",
                    "quiz_question": "Какой тип места это локация?",
                    "quiz_options": ["Парк", "Торговый центр", "Вокзал", "Аэропорт"],
                    "quiz_correct_index": 0,
                    "hint": "Посмотрите вокруг: деревья и дорожки.",
                    "safety_rules": "Держитесь дорожек, не подходите к аттракционам без взрослых.",
                },
                {
                    "title": "Аллея в парке",
                    "lat": 56.3367,
                    "lon": 43.8691,
                    "task_type": "codeword",
                    "task_text": "Найдите место для прогулки и введите код-слово.",
                    "codeword_answer": "SORMOVO",
                    "hint": "Код-слово — название района латиницей.",
                    "safety_rules": "Не бегайте по велосипедным дорожкам, смотрите по сторонам.",
                },
                {
                    "title": "Площадка у парка (без выхода на проезжую часть)",
                    "lat": 56.3353,
                    "lon": 43.8710,
                    "task_type": "quiz",
                    "task_text": "Финиш: вопрос на внимательность.",
                    "quiz_question": "Что важнее всего при прохождении квеста в городе?",
                    "quiz_options": ["Безопасность", "Скорость любой ценой", "Риск", "Шум"],
                    "quiz_correct_index": 0,
                    "hint": "Правильный ответ всегда один и он очевиден.",
                    "safety_rules": "Не выходите на дорогу, переходите только по переходам.",
                },
            ],
        },
        {
            "title": "Автозавод: районный квест для команды",
            "description": (
                "Короткий маршрут по Автозаводскому району: парк, площади и задания для команды. "
                "Никаких опасных мест и промзон."
            ),
            "city_area": "Нижний Новгород, Автозаводский район",
            "difficulty": 3,
            "duration_minutes": 70,
            "rules": "Соблюдайте ПДД, не заходите на закрытые территории.",
            "status": "archived",
            "checkpoints": [
                {
                    "title": "Автозаводский парк (вход)",
                    "lat": 56.2400,
                    "lon": 43.8604,
                    "task_type": "codeword",
                    "task_text": "Найдите парк и введите код-слово.",
                    "codeword_answer": "AUTOZAVOD",
                    "hint": "Код-слово — название района коротко латиницей.",
                    "safety_rules": "Переходите по переходам, не заходите за ограждения.",
                },
                {
                    "title": "Аллея в парке",
                    "lat": 56.2410,
                    "lon": 43.8620,
                    "task_type": "quiz",
                    "task_text": "Ответьте на вопрос о командной игре.",
                    "quiz_question": "Оптимальный размер команды по ТЗ — это…",
                    "quiz_options": ["2–6", "1–2", "7–12", "любое число"],
                    "quiz_correct_index": 0,
                    "hint": "Смотри ограничения MVP.",
                    "safety_rules": "Не бегайте, не мешайте другим посетителям.",
                },
                {
                    "title": "Скамейка/зона отдыха",
                    "lat": 56.2394,
                    "lon": 43.8632,
                    "task_type": "codeword",
                    "task_text": "Отдохните минуту и введите код-слово по теме прохождения.",
                    "codeword_answer": "TEAM",
                    "hint": "Код-слово — «команда» по-английски.",
                    "safety_rules": "Не оставляйте мусор, соблюдайте правила парка.",
                },
            ],
        },
        {
            "title": "Квест-черновик: тест маршрута по центру",
            "description": (
                "Черновик квеста для автора: точки и задания уже есть, но маршрут ещё дорабатывается "
                "и будет отправлен на модерацию позже."
            ),
            "city_area": "Нижний Новгород, Нижегородский район",
            "difficulty": 4,
            "duration_minutes": 80,
            "rules": "Черновик. Не публиковать без проверки.",
            "status": "draft",
            "checkpoints": [
                {
                    "title": "Площадь Горького",
                    "lat": 56.3156,
                    "lon": 44.0048,
                    "task_type": "quiz",
                    "task_text": "Тестовый вопрос для черновика.",
                    "quiz_question": "Что нужно сделать с квестом перед публикацией?",
                    "quiz_options": ["Отправить на модерацию", "Сразу скрыть", "Удалить", "Не добавлять точки"],
                    "quiz_correct_index": 0,
                    "hint": "Сначала — модерация.",
                    "safety_rules": "Стандартные правила безопасности.",
                },
                {
                    "title": "Сквер у площади",
                    "lat": 56.3149,
                    "lon": 44.0062,
                    "task_type": "codeword",
                    "task_text": "Тестовое код-слово (для проверки функционала).",
                    "codeword_answer": "DRAFT",
                    "hint": "Код-слово — статус квеста.",
                    "safety_rules": "Стандартные правила безопасности.",
                },
                {
                    "title": "Финишная точка (черновик)",
                    "lat": 56.3142,
                    "lon": 44.0038,
                    "task_type": "quiz",
                    "task_text": "Тестовый вопрос для проверки.",
                    "quiz_question": "Сколько минимум чекпоинтов должно быть в квесте?",
                    "quiz_options": ["3", "1", "2", "10"],
                    "quiz_correct_index": 0,
                    "hint": "Минимум — три.",
                    "safety_rules": "Стандартные правила безопасности.",
                },
            ],
        },
        {
            "title": "Опасный маршрут (пример для отклонения)",
            "description": (
                "Пример квеста, который будет отклонён модератором: описание содержит сомнительные идеи. "
                "Нужен для демонстрации отклонения с причиной."
            ),
            "city_area": "Нижний Новгород, Нижегородский район",
            "difficulty": 5,
            "duration_minutes": 50,
            "rules": None,
            "status": "rejected",
            "reject_reason": "Описание/задания содержат потенциально опасные действия. Уберите риск и переформулируйте.",
            "checkpoints": [
                {
                    "title": "Точка 1 (пример)",
                    "lat": 56.3272,
                    "lon": 44.0060,
                    "task_type": "codeword",
                    "task_text": "Пример задания, которое требует переписать в безопасном виде (текст > 20 символов).",
                    "codeword_answer": "SAFE",
                    "hint": "Сделайте задания безопасными.",
                    "safety_rules": "Не нарушайте правила безопасности.",
                },
                {
                    "title": "Точка 2 (пример)",
                    "lat": 56.3265,
                    "lon": 44.0049,
                    "task_type": "quiz",
                    "task_text": "Пример вопроса для демонстрации.",
                    "quiz_question": "Какой статус у отклонённого квеста?",
                    "quiz_options": ["rejected", "published", "draft", "archived"],
                    "quiz_correct_index": 0,
                    "hint": "Статус хранится в поле status.",
                    "safety_rules": "Не нарушайте правила безопасности.",
                },
                {
                    "title": "Точка 3 (пример)",
                    "lat": 56.3258,
                    "lon": 44.0037,
                    "task_type": "codeword",
                    "task_text": "Ещё одно тестовое задание (минимум 20 символов).",
                    "codeword_answer": "FIXME",
                    "hint": "Перепишите квест и отправьте снова.",
                    "safety_rules": "Не нарушайте правила безопасности.",
                },
            ],
        },
        {
            "title": "Скрытый квест: временно недоступен",
            "description": (
                "Квест был опубликован, но временно скрыт модератором (например, по жалобам). "
                "Нужен для демонстрации статуса hidden."
            ),
            "city_area": "Нижний Новгород, Канавинский район",
            "difficulty": 2,
            "duration_minutes": 65,
            "rules": "Временно скрыт. После проверки будет возвращён.",
            "status": "hidden",
            "checkpoints": [
                {
                    "title": "Московский вокзал (площадь перед входом)",
                    "lat": 56.3226,
                    "lon": 43.9468,
                    "task_type": "quiz",
                    "task_text": "Старт у вокзала: ответьте на вопрос.",
                    "quiz_question": "Что важно делать рядом с транспортными узлами?",
                    "quiz_options": ["Соблюдать правила и быть внимательным", "Бежать через дорогу", "Заходить в служебные зоны", "Игнорировать знаки"],
                    "quiz_correct_index": 0,
                    "hint": "Правильный ответ — про безопасность.",
                    "safety_rules": "Не заходите в служебные зоны, следуйте указателям.",
                },
                {
                    "title": "Сквер рядом (без перехода через пути)",
                    "lat": 56.3232,
                    "lon": 43.9482,
                    "task_type": "codeword",
                    "task_text": "Введите код-слово по теме маршрута.",
                    "codeword_answer": "STATION",
                    "hint": "Код-слово — «вокзал» по-английски.",
                    "safety_rules": "Не приближайтесь к путям и ограждениям.",
                },
                {
                    "title": "Финиш (площадь, безопасная зона)",
                    "lat": 56.3214,
                    "lon": 43.9486,
                    "task_type": "quiz",
                    "task_text": "Финишный вопрос для демонстрации.",
                    "quiz_question": "Скрытый квест виден в ленте публичных квестов?",
                    "quiz_options": ["Нет", "Да", "Только ночью", "Только без фильтров"],
                    "quiz_correct_index": 0,
                    "hint": "В ленте показываются только published.",
                    "safety_rules": "Следите за безопасностью в людных местах.",
                },
            ],
        },
    ]


def _create_quests(db: Session, authors: list[User]) -> tuple[list[Quest], dict[int, list[int]]]:
    """
    Creates quests with real-ish Nizhny Novgorod POIs and realistic statuses.
    Returns quests and mapping quest_id -> checkpoint_ids (ordered).
    """
    quests: list[Quest] = []
    checkpoints_by_quest: dict[int, list[int]] = {}

    dataset = _nn_quests_dataset()
    # Spread authors across quests but keep stable selection.
    author_cursor = 0

    for row in dataset:
        author = authors[author_cursor % len(authors)]
        author_cursor += 1

        status = row["status"]
        published_at = None
        if status in {"published", "archived", "hidden"}:
            published_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))

        quest = Quest(
            author_user_id=author.id,
            title=row["title"],
            description=row["description"],
            city_area=row["city_area"],
            difficulty=int(row["difficulty"]),
            duration_minutes=int(row["duration_minutes"]),
            rules=row.get("rules"),
            status=status,
            reject_reason=row.get("reject_reason"),
            published_at=published_at,
        )
        db.add(quest)
        db.flush()
        quests.append(quest)

        cp_ids: list[int] = []
        for idx, cp in enumerate(row["checkpoints"], start=1):
            task_type = cp["task_type"]
            checkpoint = QuestCheckpoint(
                quest_id=quest.id,
                order_index=idx,
                title=cp["title"],
                lat=float(cp["lat"]),
                lon=float(cp["lon"]),
                task_text=cp["task_text"],
                task_type=task_type,
                codeword_answer=(cp.get("codeword_answer") if task_type == "codeword" else None),
                quiz_question=(cp.get("quiz_question") if task_type == "quiz" else None),
                quiz_options=(cp.get("quiz_options") if task_type == "quiz" else None),
                quiz_correct_index=(cp.get("quiz_correct_index") if task_type == "quiz" else None),
                hint=cp.get("hint"),
                safety_rules=cp.get("safety_rules"),
            )
            db.add(checkpoint)
            db.flush()
            cp_ids.append(checkpoint.id)

        checkpoints_by_quest[quest.id] = cp_ids

    return quests, checkpoints_by_quest


def _pick_team_for_quest(
    quests_author_id: int,
    teams: list[Team],
    team_members: dict[int, list[int]],
) -> Team | None:
    eligible = [t for t in teams if quests_author_id not in team_members.get(t.id, [])]
    return random.choice(eligible) if eligible else None


def _pick_user_for_quest(quests_author_id: int, users: list[User]) -> User:
    eligible = [u for u in users if u.role == "user" and u.id != quests_author_id]
    return random.choice(eligible) if eligible else random.choice([u for u in users if u.role == "user"])


def _create_runs(
    db: Session,
    teams: list[Team],
    team_members: dict[int, list[int]],
    users: list[User],
    quests: list[Quest],
) -> None:
    published_quests = [quest for quest in quests if quest.status == "published"]
    if not published_quests:
        return

    run_count = random.randint(10, 14)
    possible_statuses = ["finished", "abandoned", "in_progress", "started"]

    for _ in range(run_count):
        quest = random.choice(published_quests)
        mode = random.choice(["team", "solo"])
        started_at = datetime.utcnow() - timedelta(hours=random.randint(2, 72))
        status = random.choices(possible_statuses, weights=[5, 3, 2, 1], k=1)[0]

        finished_at = None
        if status in {"finished", "abandoned"}:
            finished_at = started_at + timedelta(minutes=random.randint(20, max(25, quest.duration_minutes)))

        if mode == "team":
            team = _pick_team_for_quest(quest.author_user_id, teams, team_members) or random.choice(teams)
            run = RunSession(
                quest_id=quest.id,
                mode="team",
                team_id=team.id,
                user_id=None,
                status=status,
                current_checkpoint_order=1,
                started_at=started_at,
                finished_at=finished_at,
                score_total=0,
            )
        else:
            user = _pick_user_for_quest(quest.author_user_id, users)
            run = RunSession(
                quest_id=quest.id,
                mode="solo",
                user_id=user.id,
                team_id=None,
                status=status,
                current_checkpoint_order=1,
                started_at=started_at,
                finished_at=finished_at,
                score_total=0,
            )

        db.add(run)
        db.flush()

        checkpoints = (
            db.query(QuestCheckpoint)
            .filter(QuestCheckpoint.quest_id == quest.id)
            .order_by(QuestCheckpoint.order_index.asc())
            .all()
        )
        total = len(checkpoints)
        if total == 0:
            continue

        if status == "started":
            passed_count = 0
        elif status == "finished":
            passed_count = total
        else:
            passed_count = random.randint(1, max(1, total - 1))

        run.score_total = passed_count * 10 + (50 if status == "finished" else 0)
        run.current_checkpoint_order = min(max(1, passed_count + 1), total)

        for cp in checkpoints:
            cp_status = "locked"
            answered_at = None
            attempts = 0

            if cp.order_index <= passed_count:
                cp_status = "passed"
                attempts = random.randint(1, 2)
                answered_at = (finished_at if finished_at else started_at + timedelta(minutes=random.randint(5, 30)))
            elif cp.order_index == passed_count + 1 and status != "finished":
                cp_status = "active"
                attempts = random.randint(0, 2)

            db.add(
                RunCheckpointProgress(
                    run_id=run.id,
                    checkpoint_id=cp.id,
                    status=cp_status,
                    attempts=attempts,
                    answered_at=answered_at,
                )
            )


def _create_complaints(db: Session, users: list[User], quests: list[Quest]) -> None:
    regulars = [u for u in users if u.role == "user"]
    if not regulars or not quests:
        return

    # Add 2-3 realistic complaints for moderation demo.
    target_quests = [q for q in quests if q.status in {"published", "hidden"}]
    if not target_quests:
        return

    quest = random.choice(target_quests)
    db.add(
        Complaint(
            author_user_id=random.choice(regulars).id,
            quest_id=quest.id,
            checkpoint_id=None,
            reason="Описание содержит спорный совет. Проверьте формулировки на безопасность, пожалуйста.",
            status="new",
        )
    )

    # Complaint on a checkpoint.
    checkpoint = (
        db.query(QuestCheckpoint)
        .filter(QuestCheckpoint.quest_id == quest.id)
        .order_by(QuestCheckpoint.order_index.asc())
        .first()
    )
    if checkpoint:
        db.add(
            Complaint(
                author_user_id=random.choice(regulars).id,
                quest_id=None,
                checkpoint_id=checkpoint.id,
                reason="Точка отмечена неточно: маркер стоит далеко от дорожки. Просьба уточнить координаты.",
                status="new",
            )
        )


def main():
    random.seed(42)
    db = SessionLocal()
    try:
        db.query(Complaint).delete()
        db.query(RunCheckpointProgress).delete()
        db.query(RunSession).delete()
        db.query(TeamMember).delete()
        db.query(Team).delete()
        db.query(QuestCheckpoint).delete()
        db.query(Quest).delete()
        db.query(User).delete()
        db.commit()

        users, moderator = _create_users(db)
        teams, team_members = _create_teams(db, users)
        quests, _ = _create_quests(db, [u for u in users if u.role == "user"])
        _create_runs(db, teams, team_members, users + [moderator], quests)
        _create_complaints(db, users, quests)

        db.commit()
        print("Seed complete: users, teams, quests, runs, moderator, complaints")
    finally:
        db.close()


if __name__ == "__main__":
    main()
