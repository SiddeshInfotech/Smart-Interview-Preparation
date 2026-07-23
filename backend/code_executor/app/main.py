from fastapi import FastAPI

from code_executor.app.routes.home import router as home_router

app = FastAPI(
    title="PrepMaster AI Code Executor",
    description="Service for executing coding submissions",
    version="1.0.0"
)

# Register Routes
app.include_router(home_router)