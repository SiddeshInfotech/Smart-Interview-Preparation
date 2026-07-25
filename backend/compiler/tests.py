from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from compiler.models import ExecutionHistory


class CompilerAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_runtimes_endpoint(self):
        response = self.client.get("/api/compiler/runtimes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertIn("supported_languages", response.data)

    def test_execute_python_code(self):
        payload = {
            "language": "python",
            "code": "print(10 + 20)",
            "stdin": ""
        }
        response = self.client.post("/api/compiler/execute/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        # Verify ExecutionHistory DB entry was created
        self.assertEqual(ExecutionHistory.objects.count(), 1)
        history_item = ExecutionHistory.objects.first()
        self.assertEqual(history_item.language, "python")
        self.assertEqual(history_item.source_code, "print(10 + 20)")
