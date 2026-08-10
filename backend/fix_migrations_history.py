import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection
from course.models import Domain, Course, CourseModule, CourseTopic, CourseProgress

def fix_migration_history():
    cursor = connection.cursor()
    
    # 1. Create tables for 5 models if they don't exist
    with connection.schema_editor() as schema_editor:
        for model in [Domain, Course, CourseModule, CourseTopic, CourseProgress]:
            try:
                schema_editor.create_model(model)
                print(f"Created table for {model._meta.object_name}")
            except Exception as e:
                print(f"Table for {model._meta.object_name} already exists or note: {e}")

    # 2. Record course migration as applied in django_migrations
    try:
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES ('course', '0001_initial', NOW());"
        )
        print("Recorded course.0001_initial in django_migrations!")
    except Exception as e:
        print(f"Migration record notice: {e}")

    print("Migration history fix complete!")

if __name__ == "__main__":
    fix_migration_history()
