import os
import sys
import re
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from course.models import Course, CourseModule

def clean_course_title(title):
    if not title:
        return ""
    cleaned = re.sub(r'\s*Masterclass\s*', ' ', title, flags=re.IGNORECASE)
    cleaned = re.sub(r'&\s*&', '&', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_module_title(title):
    if not title:
        return ""
    cleaned = title
    cleaned = re.sub(r'^(Topic\s*\d+(\.\d+)?[:\s_-]*)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(Unit\s*\d+[:\s_-]*)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(\d+(\.\d+)?[:\s._-]+)', '', cleaned)
    return cleaned.strip()

print("--- Cleaning Course Titles (Removing 'Masterclass') ---")
for course in Course.objects.all():
    old_title = course.title
    new_title = clean_course_title(old_title)
    if old_title != new_title:
        course.title = new_title
        course.save()
        print(f"Course ID {course.course_id}: '{old_title}' -> '{new_title}'")

print("\n--- Cleaning Module Titles (Removing leading topic numbers/Unit prefixes) ---")
updated_count = 0
for module in CourseModule.objects.all():
    old_title = module.title
    new_title = clean_module_title(old_title)
    
    old_pdf_title = module.pdf_title
    new_pdf_title = clean_module_title(old_pdf_title)
    
    if old_title != new_title or old_pdf_title != new_pdf_title:
        module.title = new_title
        module.pdf_title = new_pdf_title
        module.save()
        updated_count += 1

print(f"Successfully cleaned {updated_count} module titles across all courses!")
