import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

def reset_tables():
    cursor = connection.cursor()
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    
    tables_to_drop = [
        "Candidate_Topic_Progress",
        "Course_Progress",
        "Course_Material",
        "Course_Topic",
        "Course_Module",
        "Domain_Course",
        "Course",
        "Course_Technology",
        "Course_Domain",
    ]
    
    for t in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS `{t}`;")
            print(f"Dropped table `{t}`")
        except Exception as e:
            print(f"Error dropping `{t}`: {e}")
            
    try:
        cursor.execute("DELETE FROM django_migrations WHERE app = 'course';")
        print("Cleared course migrations from django_migrations table.")
    except Exception as e:
        print(f"Error clearing django_migrations: {e}")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("Database reset completed successfully!")

if __name__ == "__main__":
    reset_tables()
