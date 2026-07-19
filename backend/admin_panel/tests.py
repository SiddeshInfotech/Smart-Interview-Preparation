from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Submission


class RunCodeViewTests(APITestCase):
    @patch("compiler.views.submit_code")
    def test_run_code_success(self, mock_submit):
        mock_submit.return_value = {
            "token": "abc-123",
            "status_id": 3,
            "status_description": "Accepted",
            "stdout": "hello\n",
            "stderr": "",
            "compile_output": "",
            "time": "0.02",
            "memory": 3392,
        }

        response = self.client.post(
            reverse("compiler-run"),
            {"language": "python", "source_code": "print('hello')", "stdin": ""},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "completed")
        self.assertEqual(response.data["stdout"], "hello\n")
        self.assertEqual(Submission.objects.count(), 1)

    @patch("compiler.views.submit_code")
    def test_run_code_judge0_failure_returns_502(self, mock_submit):
        from .judge0 import Judge0Error

        mock_submit.side_effect = Judge0Error("boom")

        response = self.client.post(
            reverse("compiler-run"),
            {"language": "python", "source_code": "print(1)", "stdin": ""},
            format="json",
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["status"], "error")

    def test_run_code_requires_valid_language(self):
        response = self.client.post(
            reverse("compiler-run"),
            {"language": "cobol", "source_code": "x", "stdin": ""},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class LanguageListViewTests(APITestCase):
    def test_languages_returned(self):
        response = self.client.get(reverse("compiler-languages"))
        self.assertEqual(response.status_code, 200)
        values = [item["value"] for item in response.data]
        self.assertIn("python", values)
        self.assertIn("cpp", values)
