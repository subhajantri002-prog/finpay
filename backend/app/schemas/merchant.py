from pydantic import BaseModel, ConfigDict


class MerchantResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
