from django.test import TestCase
from ai.quiz_service import _is_subjective_or_variable_question, get_fallback_chapter_quiz_questions
from ai.prompts import chapter_quiz_generation_prompt


class ChapterQuizGenerationTests(TestCase):
    def test_subjective_or_variable_question_filter(self):
        """Test that subjective or student/developer-variable questions are identified and rejected."""
        subjective_questions = [
            "What is the file name of homepage of web browser?",
            "Which file is typically loaded by default when a user visits a website?",
            "Which file is loaded by default?",
            "What is the file name of the homepage?",
            "What file name did the author choose for main page?",
            "What variable name is declared in line 5?",
            "What is the name of the variable storing user input?",
            "What is the exact file name created for the project?",
        ]
        for q in subjective_questions:
            self.assertTrue(
                _is_subjective_or_variable_question(q),
                f"Expected question to be flagged as subjective/variable: '{q}'"
            )

        valid_conceptual_questions = [
            "What is the primary role of a web server root index document by standard HTTP convention?",
            "Which fundamental principle governs modular component separation in web applications?",
            "How does document object model (DOM) tree rendering handle layout reflows?",
            "What core security mechanism prevents cross-site scripting (XSS) attacks?",
        ]
        for q in valid_conceptual_questions:
            self.assertFalse(
                _is_subjective_or_variable_question(q),
                f"Expected question to be accepted as conceptual: '{q}'"
            )

    def test_chapter_quiz_prompt_contains_concept_mandate(self):
        """Test that chapter quiz generation prompt emphasizes concept-based questions and forbids subjective choices."""
        prompt = chapter_quiz_generation_prompt(
            course_name="Web Development 101",
            chapter_name="Introduction to HTML & Web Browsers",
            pdf_content="Web browsers display HTML pages. Index document serves as default root file.",
            count=10,
            difficulty="Medium",
        )
        self.assertIn("CONCEPT-BASED NOT SENTENCE-BY-SENTENCE", prompt)
        self.assertIn("FORBID SUBJECTIVE, VARIABLE, OR STUDENT-SPECIFIC DETAILS", prompt)
        self.assertIn("What is the file name of homepage of web browser?", prompt)

    def test_fallback_chapter_quiz_questions_generation(self):
        """Test fallback quiz question generator produces concept-grounded questions with valid schema."""
        pdf_text = """
        HTML is the standard markup language for creating Web pages.
        Cascading Style Sheets (CSS) describe how HTML elements are to be displayed on screen.
        JavaScript is the programming language of the Web that adds dynamic interactivity.
        For example, a developer can set index.html or homepage.html as their start page.
        """
        questions = get_fallback_chapter_quiz_questions(
            chapter_name="Web Basics",
            pdf_content=pdf_text,
            count=5,
            materials_list=[{"filename": "web_basics.pdf"}],
        )

        self.assertEqual(len(questions), 5)
        for q in questions:
            self.assertIn("text", q)
            self.assertIn("options", q)
            self.assertEqual(len(q["options"]), 4)
            self.assertIn("correct", q)
            self.assertIn("explanation", q)
            self.assertIn("source_material", q)
            # Ensure subjective file name question is NOT in generated fallback text
            self.assertNotIn("homepage", q["text"].lower())
            self.assertFalse(_is_subjective_or_variable_question(q["text"]))

