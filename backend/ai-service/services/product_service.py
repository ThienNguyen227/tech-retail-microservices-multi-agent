import os

import httpx
from dotenv import load_dotenv


load_dotenv()

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL")


async def search_products(keyword: str):
    url = f"{PRODUCT_SERVICE_URL}/api/v1/ai/product-service/search"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params={
                "keyword": keyword
            },
        )

        response.raise_for_status()

        return response.json()