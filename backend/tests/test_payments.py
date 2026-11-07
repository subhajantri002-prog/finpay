import uuid
from decimal import Decimal
import pytest
from app.models.wallet import Wallet
from app.models.merchant import Merchant


def test_payment_zero_and_negative_amount(authenticated_client, test_merchant):
    auth_client, user_data = authenticated_client

    # Zero amount
    res_zero = auth_client.post(
        "/payments",
        json={"merchant_id": test_merchant.id, "amount": 0},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert res_zero.status_code == 422

    # Negative amount
    res_neg = auth_client.post(
        "/payments",
        json={"merchant_id": test_merchant.id, "amount": -50.0},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert res_neg.status_code == 422


def test_payment_insufficient_balance(authenticated_client, test_merchant):
    auth_client, user_data = authenticated_client

    # Balance starts at 0.00
    res = auth_client.post(
        "/payments",
        json={"merchant_id": test_merchant.id, "amount": 100.0},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert res.status_code == 400
    assert "Insufficient balance" in res.json()["detail"]


def test_payment_success_and_atomic_balance_update(authenticated_client, test_merchant, db_session):
    auth_client, user_data = authenticated_client

    # Fund wallet using demo topup
    topup_res = auth_client.post("/wallet/topup", json={"amount": 500.00})
    assert topup_res.status_code == 200
    assert float(topup_res.json()["balance"]) == 500.00

    idem_key = str(uuid.uuid4())
    pay_res = auth_client.post(
        "/payments",
        json={
            "merchant_id": test_merchant.id,
            "amount": 150.00,
            "description": "Lunch at campus cafeteria"
        },
        headers={"Idempotency-Key": idem_key}
    )
    assert pay_res.status_code == 200
    tx_data = pay_res.json()
    assert float(tx_data["amount"]) == 150.00
    assert tx_data["status"] == "success"
    assert tx_data["type"] == "debit"
    assert tx_data["idempotency_key"] == idem_key

    # Check updated wallet balance from API
    w_res = auth_client.get("/wallet")
    assert w_res.status_code == 200
    assert float(w_res.json()["balance"]) == 350.00


def test_duplicate_idempotency_key_does_not_double_charge(authenticated_client, test_merchant):
    auth_client, user_data = authenticated_client

    # Fund wallet
    auth_client.post("/wallet/topup", json={"amount": 400.00})

    idem_key = f"key_{uuid.uuid4().hex}"
    payment_body = {
        "merchant_id": test_merchant.id,
        "amount": 100.00,
        "description": "Test Idempotent Payment"
    }

    # First attempt
    res1 = auth_client.post("/payments", json=payment_body, headers={"Idempotency-Key": idem_key})
    assert res1.status_code == 200
    tx1 = res1.json()

    # Second attempt with same key
    res2 = auth_client.post("/payments", json=payment_body, headers={"Idempotency-Key": idem_key})
    assert res2.status_code == 200
    tx2 = res2.json()

    # Same transaction ID returned
    assert tx1["id"] == tx2["id"]

    # Balance should only have been deducted ONCE (400 - 100 = 300)
    w_res = auth_client.get("/wallet")
    assert float(w_res.json()["balance"]) == 300.00


def test_payment_rollback_on_failure(authenticated_client, db_session):
    auth_client, user_data = authenticated_client

    # Fund wallet
    auth_client.post("/wallet/topup", json={"amount": 250.00})

    # Inactive merchant
    suffix = uuid.uuid4().hex[:6]
    inactive_merchant = Merchant(name=f"Closed Shop {suffix}", is_active=False, balance=0.00)
    db_session.add(inactive_merchant)
    db_session.commit()
    db_session.refresh(inactive_merchant)

    res = auth_client.post(
        "/payments",
        json={"merchant_id": inactive_merchant.id, "amount": 100.00},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert res.status_code == 400
    assert "inactive" in res.json()["detail"].lower()

    # Balance must remain exactly 250.00 (not debited)
    w_res = auth_client.get("/wallet")
    assert float(w_res.json()["balance"]) == 250.00
