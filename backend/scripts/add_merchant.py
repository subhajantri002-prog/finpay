#!/usr/bin/env python3
"""
FinPay Admin Script: add_merchant.py
Adds a campus merchant (name only).
Seeds NO users and NO wallets.
"""
import argparse
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.merchant import Merchant


def main():
    parser = argparse.ArgumentParser(description="Add a campus merchant to FinPay.")
    parser.add_argument(
        "--name",
        required=True,
        help="Name of the campus merchant (e.g. 'Campus Cafeteria', 'Bookstore')"
    )

    args = parser.parse_args()
    name = args.name.strip()
    if not name:
        print("Error: Merchant name cannot be empty.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(Merchant).filter(Merchant.name.ilike(name)).first()
        if existing:
            print(f"Merchant '{existing.name}' already exists with ID {existing.id}.")
            return

        merchant = Merchant(name=name, is_active=True, balance=0.00)
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        print(f"Success! Added merchant '{merchant.name}' with ID {merchant.id}.")
    except Exception as e:
        print(f"Error adding merchant: {str(e)}", file=sys.stderr)
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
