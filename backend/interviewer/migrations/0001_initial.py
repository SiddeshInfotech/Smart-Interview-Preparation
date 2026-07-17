from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Interviewer_Profile",
            fields=[
                ("interviewer_id", models.AutoField(primary_key=True, serialize=False)),
                ("profile_picture", models.ImageField(blank=True, default="profile_pics/default.png", upload_to="profile_pics/")),
                ("department", models.CharField(blank=True, max_length=150, null=True)),
                ("designation", models.CharField(blank=True, max_length=150, null=True)),
                ("organization", models.CharField(blank=True, max_length=255, null=True)),
                ("expertise_area", models.TextField(blank=True, null=True)),
                ("years_of_experience", models.DecimalField(decimal_places=1, default=0.0, max_digits=4)),
                ("bio", models.TextField(blank=True, null=True)),
                ("linkedin_url", models.URLField(blank=True, max_length=255, null=True)),
                ("is_available", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(db_column="user_id", on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table": "Interviewer_Profile"},
        ),
    ]
