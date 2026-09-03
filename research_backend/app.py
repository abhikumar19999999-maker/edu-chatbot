from main import app
from features import router

app.include_router(router, prefix="/app")
