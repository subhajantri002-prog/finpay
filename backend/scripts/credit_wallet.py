#!/usr/bin/env python3
"""
FinPay Admin Script: credit_wallet.py
Credits a registered user's wallet by student ID and amount.
Records as a transaction of type 'credit'.
Fails if the user is not registered.
"""
import argparse
import sys
import os
from decimal import Decimal, InvalidOperation

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.wallet_service import admin_credit_wallet


def main():
    parser = argparse.ArgumentParser(
        description="Credit a registered student's FinPay wallet."
    )
    parser.add_argument(
        "--student-id",
        required=True,
        help="Unique student ID of the registered user (required)"
    )
    parser.add_argument(
        "--amount",
        required=True,
        help="Amount to credit in INR (e.g., 500.00)"
    )
    parser.add_argument(
        "--description",
        default="Admin campus wallet credit",
        help="Optional transaction description"
    )

    args = parser.parse_args()

    try:
        amount = Decimal(args.amount)
        if amount <= Decimal("0.00"):
            print("Error: Amount must be greater than zero.", file=sys.stderr)
            sys.exit(1)
    except InvalidOperation:
        print(f"Error: Invalid amount format '{args.amount}'.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        tx = admin_credit_wallet(
            db=db,
            student_id=args.student_id,
            amount=amount,
            description=args.description
        )
        print(f"Success! Credited ₹{tx.amount:.2f} to student ID '{args.student_id}'.")
        print(f"Transaction ID: {tx.id} | Status: {tx.status} | Type: {tx.type}")
    except ValueError as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
