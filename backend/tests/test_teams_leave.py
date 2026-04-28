from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 201
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["data"]["access_token"]


def test_leave_team_deletes_team_when_last_member_leaves(app):
    client = TestClient(app)
    token = _register_and_login(client, "solo_owner@example.com", "secret123")

    resp = client.post(
        "/api/v1/teams",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Solo Team", "description": "Only one member"},
    )
    assert resp.status_code == 200
    team_id = resp.json()["data"]["id"]

    resp = client.post(
        f"/api/v1/teams/{team_id}/leave",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["team_deleted"] is True
    assert data["team_id"] == team_id

    resp = client.get("/api/v1/teams/my", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["items"] == []


def test_leave_team_keeps_team_when_members_remain(app):
    client = TestClient(app)
    owner_token = _register_and_login(client, "owner2@example.com", "secret123")
    member_token = _register_and_login(client, "member2@example.com", "secret123")

    resp = client.post(
        "/api/v1/teams",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"name": "Duo Team", "description": "Two members"},
    )
    assert resp.status_code == 200
    team_id = resp.json()["data"]["id"]
    join_code = resp.json()["data"]["join_code"]

    resp = client.post(
        "/api/v1/teams/join",
        headers={"Authorization": f"Bearer {member_token}"},
        json={"code": join_code},
    )
    assert resp.status_code == 200

    resp = client.post(
        f"/api/v1/teams/{team_id}/leave",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["team_deleted"] is False
    assert data["team_id"] == team_id

    resp = client.get("/api/v1/teams/my", headers={"Authorization": f"Bearer {owner_token}"})
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == team_id
    assert items[0]["members_count"] == 1
