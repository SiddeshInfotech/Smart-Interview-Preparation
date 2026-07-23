from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def home():
    return {
        "status": "success",
        "message": "PrepMaster AI Code Executor is Running 🚀"
    }

    
@router.get("/health")
def health():
    return {
        "status": "healthy"
    }