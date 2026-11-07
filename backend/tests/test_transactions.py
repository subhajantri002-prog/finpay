import uuid
import pytest


def test_transactions_listing_and_isolation(authenticated_client, create_test_user, client, test_merchant):
    auth_client_1, user1 = authenticated_client

    # Fund and make payment for user 1
    auth_client_1.post("/wallet/topup", json={"amount": 300.00})
    pay_res = auth_client_1.post(
        "/payments",
        json={"merchant_id": test_merchant.id, "amount": 80.00, "description": "Tea and snacks"},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert pay_res.status_code == 200
    tx1_id = pay_res.json()["id"]

    # Verify user 1 can see their transactions
    tx_list = auth_client_1.get("/transactions")
    assert tx_list.status_code == 200
    items = tx_list.json()["items"]
    assert len(items) >= 2  # topup + debit
    assert any(t["id"] == tx1_id for t in items)

    # Register user 2 and check isolation
    user2 = create_test_user()
    login2 = client.post("/auth/login", json={"identifier": user2["email"], "password": user2["password"]})
    token2 = login2.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token2}"})

    # User 2 should have 0 transactions initially
    user2_txs = client.get("/transactions")
    assert user2_txs.status_code == 200
    assert len(user2_txs.json()["items"]) == 0

    # User 2 cannot access user 1's transaction by ID
    single_res = client.get(f"/transactions/{tx1_id}")
    assert single_res.status_code == 404
