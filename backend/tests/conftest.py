import os
import sys
import uuid
from typing import Generator
import email_validator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Ensure email_validator operates offline without DNS queries
email_validator.TEST_ENVIRONMENT = True

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, get_db
from app.main import app
from app.models.merchant import Merchant

TEST_DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_finpay.db")
TEST_DB_URL = os.getenv("TEST_DATABASE_URL", f"sqlite:///{TEST_DB_FILE.replace(os.sep, '/')}")

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_test_user(client: TestClient):
    def _create_user(password="StrongPass123!"):
        unique_suffix = uuid.uuid4().hex[:8]
        user_data = {
            "full_name": f"Student {unique_suffix}",
            "student_id": f"STU_{unique_suffix}",
            "email": f"student_{unique_suffix}@campus.edu",
            "phone": "9876543210",
            "password": password
        }
        res = client.post("/auth/register", json=user_data)
        assert res.status_code == 201
        return user_data
    return _create_user


@pytest.fixture
def authenticated_client(client: TestClient, create_test_user):
    user_data = create_test_user()
    login_res = client.post("/auth/login", json={
        "identifier": user_data["email"],
        "password": user_data["password"]
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    
    auth_client = TestClient(app)
    auth_client.headers.update({"Authorization": f"Bearer {token}"})
    return auth_client, user_data


@pytest.fixture
def test_merchant(db_session: Session):
    suffix = uuid.uuid4().hex[:6]
    merchant = Merchant(name=f"Merchant {suffix}", is_active=True, balance=0.00)
    db_session.add(merchant)
    db_session.commit()
    db_session.refresh(merchant)
    return merchant
