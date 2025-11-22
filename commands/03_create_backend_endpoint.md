# Create Backend Endpoint

Follow this guide to add a new API endpoint to the FastAPI backend.

## 1. Define Pydantic Schemas
Create request and response models in `backend/schemas/`.

```python
# backend/schemas/item.py
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str | None = None

class ItemResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
```

## 2. Create Service Logic (Optional)
If the logic is complex, add it to `backend/services/`.

```python
# backend/services/item_service.py
def create_item(data: ItemCreate):
    # Business logic here
    return saved_item
```

## 3. Create Route Handler
Add the endpoint in `backend/api/routes/`.

```python
# backend/api/routes/items.py
from fastapi import APIRouter, Depends
from schemas.item import ItemCreate, ItemResponse
from services import item_service

router = APIRouter()

@router.post("/", response_model=ItemResponse)
async def create_new_item(item: ItemCreate):
    return item_service.create_item(item)
```

## 4. Register Router
Import and include the router in `backend/api/routes/__init__.py` or `backend/main.py`.

```python
# backend/main.py
from api.routes import items
app.include_router(items.router, prefix="/items", tags=["Items"])
```

## 5. Test
Run the server and verify via Swagger UI (`/docs`).
