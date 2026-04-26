from fastapi.testclient import TestClient


def test_register_login_me_refresh(app):
    client = TestClient(app)

    email = "test@example.com"
    password = "secret123"

    resp = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == email

    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]

    access_token = data["data"]["access_token"]
    refresh_token = data["data"]["refresh_token"]

    resp = client.get("/api/v1/user/me", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == email

    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]


def test_login_invalid_credentials_returns_envelope(app):
    client = TestClient(app)

    resp = client.post("/api/v1/auth/login", json={"email": "nope@example.com", "password": "wrong"})
    assert resp.status_code == 401
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "HTTP_ERROR"
