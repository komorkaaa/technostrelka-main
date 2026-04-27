from fastapi.testclient import TestClient


def test_publish_quest_and_start_run(app):
    client = TestClient(app)

    # Author registers and logs in
    author_email = "author@example.com"
    author_password = "secret123"
    resp = client.post("/api/v1/auth/register", json={"email": author_email, "password": author_password})
    assert resp.status_code == 201

    resp = client.post("/api/v1/auth/login", json={"email": author_email, "password": author_password})
    assert resp.status_code == 200
    author_token = resp.json()["data"]["access_token"]

    # Create quest (draft)
    resp = client.post(
        "/api/v1/quests",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "title": "Demo quest",
            "description": "This is a demo quest description with enough length (30+).",
            "city_area": "Kirov",
            "difficulty": 3,
            "duration_minutes": 45,
            "rules": "Be safe",
        },
    )
    assert resp.status_code == 200
    quest_id = resp.json()["data"]["quest_id"]

    # Add 3 checkpoints
    resp = client.post(
        f"/api/v1/quests/{quest_id}/checkpoints",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "order_index": 1,
            "title": "Point 1",
            "lat": 58.6036,
            "lon": 49.668,
            "task_type": "codeword",
            "task_text": "Find the plaque and enter the word.",
            "codeword_answer": "Kirov",
        },
    )
    assert resp.status_code == 200

    resp = client.post(
        f"/api/v1/quests/{quest_id}/checkpoints",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "order_index": 2,
            "title": "Point 2",
            "lat": 58.604,
            "lon": 49.669,
            "task_type": "quiz",
            "task_text": "Answer the question.",
            "quiz_question": "2+2?",
            "quiz_options": ["1", "2", "3", "4"],
            "quiz_correct_index": 3,
        },
    )
    assert resp.status_code == 200

    resp = client.post(
        f"/api/v1/quests/{quest_id}/checkpoints",
        headers={"Authorization": f"Bearer {author_token}"},
        json={
            "order_index": 3,
            "title": "Point 3",
            "lat": 58.605,
            "lon": 49.67,
            "task_type": "codeword",
            "task_text": "Enter the final word.",
            "codeword_answer": "Finish",
        },
    )
    assert resp.status_code == 200

    # Submit for moderation
    resp = client.post(
        f"/api/v1/quests/{quest_id}/submit",
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "moderation"

    # Create moderator user directly in DB (login accepts "moderator")
    from app.core.security import hash_password
    from app.db.session import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        moderator = User(email="moderator", hashed_password=hash_password("demo123"), role="moderator")
        db.add(moderator)
        db.commit()
    finally:
        db.close()

    resp = client.post("/api/v1/auth/login", json={"email": "moderator", "password": "demo123"})
    assert resp.status_code == 200
    mod_token = resp.json()["data"]["access_token"]

    # Approve quest
    resp = client.post(
        f"/api/v1/moderation/quests/{quest_id}/approve",
        headers={"Authorization": f"Bearer {mod_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "published"

    # Start run (now allowed)
    resp = client.post(
        "/api/v1/runs/start",
        headers={"Authorization": f"Bearer {author_token}"},
        json={"quest_id": quest_id, "mode": "solo"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "started"

