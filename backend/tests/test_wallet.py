from decimal import Decimal
import pytest
from app.services.wallet_service import admin_credit_wallet


def test_initial_wallet_balance_zero(authenticated_client):
    auth_client, user_data = authenticated_client
    res = auth_client.get("/wallet")
    assert res.status_code == 200
    data = res.json()
    assert float(data["balance"]) == 0.00
    assert data["status"] == "active"


def test_demo_topup(authenticated_client):
    auth_client, user_data = authenticated_client
    
    # Topup 1000
    res = auth_client.post("/wallet/topup", json={"amount": 1000.00})
    assert res.status_code == 200
    assert float(res.json()["balance"]) == 1000.00

    # Topup exceeds 10000 max limit
    res_exceed = auth_client.post("/wallet/topup", json={"amount": 15000.00})
    assert res_exceed.status_code == 422


def test_admin_credit_script_registered_user(db_session, authenticated_client):
    auth_client, user_data = authenticated_client
    student_id = user_data["student_id"]

    tx = admin_credit_wallet(
        db=db_session,
        student_id=student_id,
        amount=Decimal("750.00"),
        description="Campus scholarship test credit"
    )
    assert tx.status == "success"
    assert tx.type == "credit"
    assert tx.amount == Decimal("750.00")

    # Check via API
    res = auth_client.get("/wallet")
    assert float(res.json()["balance"]) == 750.00


def test_admin_credit_fails_for_unregistered_student(db_session):
    with pytest.raises(ValueError) as exc:
        admin_credit_wallet(
            db=db_session,
            student_id="NON_EXISTENT_ID_9999",
            amount=Decimal("100.00")
        )
    assert "not registered" in str(exc.value)
