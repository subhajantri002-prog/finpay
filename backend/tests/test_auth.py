import uuid
import pytest


def test_register_success(client):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "full_name": f"Student {suffix}",
        "student_id": f"SID_{suffix}",
        "email": f"stud_{suffix}@campus.ac.in",
        "phone": "9876543210",
        "password": "ValidPassword123!"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == payload["student_id"]
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]
    assert "password_hash" not in data


def test_register_duplicate_email(client, create_test_user):
    user1 = create_test_user()
    suffix2 = uuid.uuid4().hex[:8]
    duplicate_email_payload = {
        "full_name": "Another Student",
        "student_id": f"DIFF_{suffix2}",
        "email": user1["email"],
        "password": "ValidPassword123!"
    }
    response = client.post("/auth/register", json=duplicate_email_payload)
    assert response.status_code == 409
    assert "Email is already registered" in response.json()["detail"]


def test_register_duplicate_student_id(client, create_test_user):
    user1 = create_test_user()
    suffix2 = uuid.uuid4().hex[:8]
    duplicate_student_payload = {
        "full_name": "Another Student",
        "student_id": user1["student_id"],
        "email": f"diff_{suffix2}@campus.ac.in",
        "password": "ValidPassword123!"
    }
    response = client.post("/auth/register", json=duplicate_student_payload)
    assert response.status_code == 409
    assert "Student ID is already registered" in response.json()["detail"]


@pytest.mark.parametrize("weak_pwd", [
    "short1!",        # less than 8 chars
    "alllowercase1!", # missing uppercase
    "ALLUPPERCASE1!", # missing lowercase
    "NoNumbersHere!", # missing number
    "NoSpecialChar12" # missing special character
])
def test_register_weak_password(client, weak_pwd):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "full_name": f"Student {suffix}",
        "student_id": f"SID_{suffix}",
        "email": f"stud_{suffix}@campus.ac.in",
        "password": weak_pwd
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_email(client, create_test_user):
    user = create_test_user()
    response = client.post("/auth/login", json={
        "identifier": user["email"],
        "password": user["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == user["email"]


def test_login_success_student_id(client, create_test_user):
    user = create_test_user()
    response = client.post("/auth/login", json={
        "identifier": user["student_id"],
        "password": user["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["student_id"] == user["student_id"]


def test_login_wrong_password(client, create_test_user):
    user = create_test_user()
    response = client.post("/auth/login", json={
        "identifier": user["email"],
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_unknown_user(client):
    suffix = uuid.uuid4().hex[:8]
    response = client.post("/auth/login", json={
        "identifier": f"nonexistent_{suffix}@campus.edu",
        "password": "SomePassword123!"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_protected_route_without_token(client):
    response = client.get("/wallet")
    assert response.status_code == 401

    response = client.get("/users/me")
    assert response.status_code == 401

    response = client.get("/transactions")
    assert response.status_code == 401
