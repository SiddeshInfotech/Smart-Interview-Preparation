from pydantic import BaseModel


class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    input: str = ""


class CodeExecutionResponse(BaseModel):
    status: str
    output: str = ""
    error: str = ""
    solution: str = ""