from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from app.core.config import settings
from app.routers import auth, users, wallet, merchants, payments, transactions, cashback, reports

app = FastAPI(
    title="FinPay – Campus Wallet Platform API",
    description="Production-style Campus Digital Wallet REST API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format validation errors clearly."""
    errors = exc.errors()
    error_msg = "; ".join([f"{err.get('loc', ['field'])[-1]}: {err.get('msg')}" for err in errors])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": error_msg, "errors": jsonable_encoder(errors)}
    )


# Register all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(wallet.router)
app.include_router(merchants.router)
app.include_router(payments.router)
app.include_router(transactions.router)
app.include_router(cashback.router)
app.include_router(reports.router)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": "FinPay Campus Wallet Platform"}
