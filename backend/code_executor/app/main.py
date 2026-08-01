from fastapi import FastAPI

from app.services.executor import execute_code
from app.schemas.execute_schema import (
    CodeExecutionRequest,
    CodeExecutionResponse
)


app = FastAPI(
    title="PrepMaster Code Executor"
)


@app.get("/")
def home():
    return {
        "message": "Code Executor Service Running"
    }


@app.post("/execute", response_model=CodeExecutionResponse)
def execute(request: CodeExecutionRequest):

    return execute_code(request)