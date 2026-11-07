# FinPay – Campus Wallet Platform

A production-style campus digital wallet built with FastAPI, SQLite (for local demo use), and React. FinPay enables university students to manage their campus digital wallets, execute atomic merchant payments, view transaction histories, track cashback rewards, and audit real-time financial reconciliation statements.

---

## Architecture Overview

FinPay is organized as two independent projects that communicate exclusively over a REST API:

```
finpay/
├── frontend/   (React + TypeScript + Tailwind CSS, runs on Vite port 5173)
├── backend/    (FastAPI + SQLAlchemy + SQLite + Alembic, runs on Uvicorn port 8000)
└── README.md   (Setup and execution guide)
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite (`finpay.db`), Alembic migrations, PyJWT authentication, Bcrypt password hashing.
- **Integrity**: Enforces zero starting balance at registration, SQLite atomic transactions (`BEGIN IMMEDIATE` write serialization), idempotency keys, and atomic rollbacks.

---

## Prerequisites

Before starting, ensure the following are installed on your machine:
- **Python**: Version 3.11 or higher
- **Node.js**: Version 18 or higher (with npm)

---

## 1. Backend Setup

### Step 1.1: Navigate to Backend
```bash
cd backend
```

### Step 1.2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

The default `.env` is preconfigured for local SQLite demo use:
```ini
DATABASE_URL=sqlite:///./finpay.db
JWT_SECRET_KEY=<YOUR_RANDOM_SECRET_KEY>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGIN=http://localhost:5173
DEMO_MODE=true
CASHBACK_PERCENTAGE=0
CASHBACK_MIN_AMOUNT=0
```

### Step 1.3: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Step 1.4: Run Alembic Database Migrations
Run Alembic migrations to create all database tables in `finpay.db`:
```bash
alembic upgrade head
```

### Step 1.5: Add Campus Merchants
Add authorized campus merchants using the merchant script:
```bash
python scripts/add_merchant.py --name "Campus Cafeteria"
python scripts/add_merchant.py --name "University Bookstore"
python scripts/add_merchant.py --name "Central Library Printing"
python scripts/add_merchant.py --name "Student Union Store"
```

### Step 1.6: Start the Backend Server
Start FastAPI with Uvicorn on port `8000`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is available at: `http://localhost:8000/docs`.

---

## 2. Frontend Setup

### Step 2.1: Navigate to Frontend
In a new terminal window:
```bash
cd frontend
```

### Step 2.2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Verify that `.env` points to the backend server:
```ini
VITE_API_BASE_URL=http://localhost:8000
```

### Step 2.3: Install Frontend Dependencies
```bash
npm install
```

### Step 2.4: Start the Frontend Dev Server
Start the Vite development server on port `5173`:
```bash
npm run dev
```
Open your browser at: `http://localhost:5173`.

---

## 3. Wallet Funding & Payment Testing

Per security requirements, users cannot edit or manipulate their balances from the frontend. All money logic is backend-enforced.

### Option A: Demo Top-Up (When DEMO_MODE=true)
1. Register a student account at `/register` and log in at `/login`.
2. Navigate to **My Wallet** (`/wallet`).
3. Click **Add Money (Demo Mode)**, input an amount up to ₹10,000, and confirm.
4. The backend records a transaction of type `topup` and updates the wallet balance.

### Option B: Backend Admin Credit Script
The administrator can credit a registered user's wallet by student ID:
```bash
python scripts/credit_wallet.py --student-id <REGISTERED_STUDENT_ID> --amount <AMOUNT> --description "Scholarship credit"
```
*Note: This script verifies registration and will exit with an error if the student ID is not registered.*

---

## 4. Running Backend Automated Tests

Run the full pytest suite in the `backend/` directory:
```bash
cd backend
python -m pytest -v
```

The test suite runs against an isolated temporary SQLite database and validates:
- User registration and validation (required fields, email format, password strength)
- Duplicate email and duplicate student ID rejection (HTTP 409)
- Authentication restrictions (unknown user, invalid password, HTTP 401 error messages)
- Protected endpoints token enforcement
- Atomic payment execution and SQLite write serialization (`BEGIN IMMEDIATE`)
- Insufficient balance rejections
- Duplicate idempotency key protection (prevents double charging)
- Atomic transaction rollbacks on failure
- User isolation across transactions and records

---

## 5. Building Frontend for Production

Verify the production build:
```bash
cd frontend
npm run build
```
This runs TypeScript checking (`tsc -b`) and bundles optimized static assets into `frontend/dist/`.
