import course.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('candidate', '0004_candidate_profile_target_domain'),
    ]

    operations = [
        migrations.CreateModel(
            name='Domain',
            fields=[
                ('domain_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'Course_Domain',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Course',
            fields=[
                ('course_id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('technology', models.CharField(blank=True, help_text='e.g. Python, C#, React, Linux', max_length=100, null=True)),
                ('sequence', models.PositiveIntegerField(default=1)),
                ('is_required', models.BooleanField(default=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('domain', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='courses', to='course.domain')),
            ],
            options={
                'db_table': 'Course',
                'ordering': ['sequence', 'course_id'],
            },
        ),
        migrations.CreateModel(
            name='CourseModule',
            fields=[
                ('module_id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('sequence', models.PositiveIntegerField(default=1)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='modules', to='course.course')),
            ],
            options={
                'db_table': 'Course_Module',
                'ordering': ['sequence', 'module_id'],
            },
        ),
        migrations.CreateModel(
            name='CourseTopic',
            fields=[
                ('topic_id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('sequence', models.PositiveIntegerField(default=1)),
                ('pdf_file', models.FileField(blank=True, null=True, upload_to='course_materials/%Y/%m/', validators=[course.validators.validate_pdf_file])),
                ('pdf_title', models.CharField(blank=True, max_length=200, null=True)),
                ('file_size', models.PositiveIntegerField(default=0, help_text='File size in bytes')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='topics', to='course.coursemodule')),
            ],
            options={
                'db_table': 'Course_Topic',
                'ordering': ['sequence', 'topic_id'],
            },
        ),
        migrations.CreateModel(
            name='CourseProgress',
            fields=[
                ('progress_id', models.AutoField(primary_key=True, serialize=False)),
                ('progress_percentage', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
                ('completed_topic_ids', models.JSONField(blank=True, default=list, help_text='List of completed topic IDs for this course')),
                ('completed', models.BooleanField(default=False)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('last_accessed_at', models.DateTimeField(auto_now=True)),
                ('candidate', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='course_progresses', to='candidate.candidate_profile')),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='course_progresses', to='course.course')),
                ('domain', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='course_progresses', to='course.domain')),
            ],
            options={
                'db_table': 'Course_Progress',
                'ordering': ['-last_accessed_at'],
                'unique_together': {('candidate', 'domain', 'course')},
            },
        ),
    ]
