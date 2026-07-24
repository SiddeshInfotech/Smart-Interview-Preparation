from fastapi import APIRouter

from code_executor.app.schemas.execute_schema import (
    CodeExecutionRequest,
    CodeExecutionResponse,
)

from code_executor.app.services.executor import execute_code

router = APIRouter()


@router.post("/run-code", response_model=CodeExecutionResponse)
def run_code(request: CodeExecutionRequest):
    return execute_code(request)