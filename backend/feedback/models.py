from django.db import models


class Feedback(models.Model):

    EXPERIENCE_CHOICES = [
        ("Excellent", "Excellent"),
        ("Good", "Good"),
        ("Average", "Average"),
        ("Poor", "Poor"),
    ]


    RECOMMEND_CHOICES = [
        ("Yes", "Yes"),
        ("No", "No"),
    ]


    feedback_id = models.AutoField(primary_key=True)


    name = models.CharField(max_length=100)


    email = models.EmailField()



    overall_experience = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES
    )



    mock_interview = models.TextField()



    coding_assessment = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES
    )



    aptitude_test = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES
    )



    suggestions = models.TextField(
        blank=True
    )



    comments = models.TextField(
        blank=True
    )



    recommend = models.CharField(
        max_length=10,
        choices=RECOMMEND_CHOICES
    )



    recommendation_reason = models.TextField(
        blank=True
    )



    submitted_at = models.DateTimeField(
        auto_now_add=True
    )



    class Meta:

        db_table = "feedback"



    def __str__(self):

        return f"{self.name} - {self.email}"