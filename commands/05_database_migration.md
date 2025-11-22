# Database Migration

This guide explains how to manage database schema changes using Alembic.

## 1. Modify Models
Update or create SQLAlchemy models in `backend/db/models/`.

```python
# backend/db/models/user.py
class User(Base):
    # ... existing fields
    new_field = Column(String, nullable=True)
```

## 2. Generate Migration
Run the following command in the `backend` directory:

```bash
alembic revision --autogenerate -m "Add new field to user"
```
This creates a new migration script in `backend/alembic/versions/`.

## 3. Review Migration
Always inspect the generated migration file to ensure it accurately reflects your changes.

## 4. Apply Migration
Apply the changes to the database:

```bash
alembic upgrade head
```

## 5. Rollback (If needed)
To undo the last migration:

```bash
alembic downgrade -1
```
