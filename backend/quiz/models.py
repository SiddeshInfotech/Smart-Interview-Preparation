from django.db import models
from django.conf import settings


class QuizPerformance(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    domain = models.ForeignKey(
        "course.Domain",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quiz_performances",
    )
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    wrong_answers = models.IntegerField()
    skipped_answers = models.IntegerField()
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "score"]),
            models.Index(fields=["user", "domain", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.score}%"


class ChapterQuiz(models.Model):
    quiz_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(
        "course.Course", on_delete=models.CASCADE, related_name="chapter_quizzes"
    )
    module = models.ForeignKey(
        "course.CourseModule", on_delete=models.CASCADE, related_name="chapter_quizzes"
    )
    candidate = models.ForeignKey(
        "candidate.Candidate_Profile",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chapter_quizzes",
    )
    title = models.CharField(max_length=250)
    difficulty = models.CharField(max_length=50, default="Medium")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Quiz_ChapterQuiz"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.course.title} | {self.module.title} | Quiz #{self.quiz_id}"


class ChapterQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    quiz = models.ForeignKey(
        ChapterQuiz, on_delete=models.CASCADE, related_name="questions"
    )
    question_text = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_answer = models.CharField(max_length=200)
    explanation = models.TextField(blank=True, null=True)
    source_material = models.ForeignKey(
        "course.CourseMaterial",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questions",
    )
    source_material_name = models.CharField(max_length=250, blank=True, null=True)
    source_topic = models.CharField(max_length=250, blank=True, null=True)

    class Meta:
        db_table = "Quiz_ChapterQuestion"
        ordering = ["question_id"]

    def __str__(self):
        return f"Q#{self.question_id}: {self.question_text[:50]}"
