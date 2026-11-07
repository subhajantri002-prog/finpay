"""initial tables

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-11-06 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('student_id', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index('ix_users_id', ['id'], unique=False)
        batch_op.create_index('ix_users_email', ['email'], unique=True)
        batch_op.create_index('ix_users_student_id', ['student_id'], unique=True)

    # 2. wallets table
    op.create_table(
        'wallets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    with op.batch_alter_table('wallets', schema=None) as batch_op:
        batch_op.create_index('ix_wallets_id', ['id'], unique=False)

    # 3. merchants table
    op.create_table(
        'merchants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('merchants', schema=None) as batch_op:
        batch_op.create_index('ix_merchants_id', ['id'], unique=False)

    # 4. transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('wallet_id', sa.Integer(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('idempotency_key', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key')
    )
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.create_index('ix_transactions_id', ['id'], unique=False)
        batch_op.create_index('ix_transactions_wallet_id', ['wallet_id'], unique=False)
        batch_op.create_index('ix_transactions_merchant_id', ['merchant_id'], unique=False)

    # 5. cashback table
    op.create_table(
        'cashback',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='credited'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('cashback', schema=None) as batch_op:
        batch_op.create_index('ix_cashback_id', ['id'], unique=False)
        batch_op.create_index('ix_cashback_user_id', ['user_id'], unique=False)
        batch_op.create_index('ix_cashback_transaction_id', ['transaction_id'], unique=False)

    # 6. cashback_config table
    op.create_table(
        'cashback_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('min_transaction_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('cashback_config', schema=None) as batch_op:
        batch_op.create_index('ix_cashback_config_id', ['id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('cashback_config', schema=None) as batch_op:
        batch_op.drop_index('ix_cashback_config_id')
    op.drop_table('cashback_config')

    with op.batch_alter_table('cashback', schema=None) as batch_op:
        batch_op.drop_index('ix_cashback_transaction_id')
        batch_op.drop_index('ix_cashback_user_id')
        batch_op.drop_index('ix_cashback_id')
    op.drop_table('cashback')

    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_index('ix_transactions_merchant_id')
        batch_op.drop_index('ix_transactions_wallet_id')
        batch_op.drop_index('ix_transactions_id')
    op.drop_table('transactions')

    with op.batch_alter_table('merchants', schema=None) as batch_op:
        batch_op.drop_index('ix_merchants_id')
    op.drop_table('merchants')

    with op.batch_alter_table('wallets', schema=None) as batch_op:
        batch_op.drop_index('ix_wallets_id')
    op.drop_table('wallets')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_student_id')
        batch_op.drop_index('ix_users_email')
        batch_op.drop_index('ix_users_id')
    op.drop_table('users')
