from rest_framework.response import Response
from rest_framework.decorators import api_view

# Create your views here.
@api_view(["GET"])
def get_dashboard(request):
    return Response({"message": "dashboard loaded successfully"})