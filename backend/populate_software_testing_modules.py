import os
import sys
import re
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from course.models import Domain, Course, CourseModule
from django.core.files import File

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

PYTHON_PDF_DIR = os.path.join(PROJECT_ROOT, "downloads", "Python_Notes_Topic_PDFs")
TESTING_PDF_DIR = os.path.join(PROJECT_ROOT, "downloads", "Software_Testing_Notes_Topic_PDFs")
USER_TESTING_DIR = r"C:\Users\Admin\Downloads\Software Testing"

if not os.path.exists(TESTING_PDF_DIR) or not os.listdir(TESTING_PDF_DIR):
    if os.path.exists(USER_TESTING_DIR) and os.listdir(USER_TESTING_DIR):
        TESTING_PDF_DIR = USER_TESTING_DIR

def clean_title(title):
    if not title:
        return ""
    cleaned = title.replace(".pdf", "").replace("_", " ")
    cleaned = re.sub(r'^(Topic\s*\d+(\.\d+)?[:\s_-]*)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(Unit\s*\d+[:\s_-]*)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(\d+(\.\d+)?[:\s._-]+)', '', cleaned)
    return cleaned.strip()

# 1. Get or create Software Testing domain
domain, _ = Domain.objects.get_or_create(
    name="Software Testing",
    defaults={"description": "Master manual QA testing, automated testing with Selenium, Pytest, API & DB testing, and Python scripting."}
)
domain.description = "Master manual QA testing, automated testing with Selenium, Pytest, API & DB testing, and Python scripting."
domain.save()

print(f"Targeting Domain: '{domain.name}' (ID: {domain.domain_id})")

# ==============================================================================
# COURSE 1: Python Programming Notes (Software Testing)
# ==============================================================================
python_course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="Python",
    defaults={
        "title": "Python Programming Notes",
        "description": "Comprehensive Python programming notes, data structures, control flow, functions, OOP, and automation scripting.",
        "sequence": 1,
        "is_required": True,
        "is_active": True
    }
)
python_course.title = "Python Programming Notes"
python_course.sequence = 1
python_course.save()

if os.path.exists(PYTHON_PDF_DIR):
    python_files = sorted([f for f in os.listdir(PYTHON_PDF_DIR) if f.endswith(".pdf")])
    print(f"Populating {len(python_files)} Python PDFs into Software Testing Course #1...")
    
    for idx, filename in enumerate(python_files, start=1):
        file_path = os.path.join(PYTHON_PDF_DIR, filename)
        module_title = clean_title(filename)
        
        module, created = CourseModule.objects.get_or_create(
            course=python_course,
            sequence=idx,
            defaults={
                "title": module_title,
                "pdf_title": f"{module_title} Notes",
                "description": f"Study material for {module_title}"
            }
        )
        module.title = module_title
        module.pdf_title = f"{module_title} Notes"
        module.sequence = idx
        
        with open(file_path, "rb") as f:
            module.pdf_file.save(filename, File(f), save=True)
            
        status_str = "Created" if created else "Updated"
        print(f"  [Python] [{status_str}] Module #{idx}: {module_title}")

# ==============================================================================
# COURSE 2: Software Testing & QA Notes (Software Testing)
# ==============================================================================
testing_course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="Software Testing",
    defaults={
        "title": "Software Testing & QA Notes",
        "description": "Comprehensive manual testing fundamentals, web application usability, API & database testing, Pytest, and Selenium WebDriver automation.",
        "sequence": 2,
        "is_required": True,
        "is_active": True
    }
)
testing_course.title = "Software Testing & QA Notes"
testing_course.sequence = 2
testing_course.save()

if os.path.exists(TESTING_PDF_DIR):
    testing_files = sorted([f for f in os.listdir(TESTING_PDF_DIR) if f.endswith(".pdf")])
    print(f"Populating {len(testing_files)} Software Testing PDFs into Course #2...")
    
    for idx, filename in enumerate(testing_files, start=1):
        file_path = os.path.join(TESTING_PDF_DIR, filename)
        module_title = clean_title(filename)
        
        module, created = CourseModule.objects.get_or_create(
            course=testing_course,
            sequence=idx,
            defaults={
                "title": module_title,
                "pdf_title": f"{module_title} Notes",
                "description": f"Study material for {module_title}"
            }
        )
        module.title = module_title
        module.pdf_title = f"{module_title} Notes"
        module.sequence = idx
        
        with open(file_path, "rb") as f:
            module.pdf_file.save(filename, File(f), save=True)
            
        status_str = "Created" if created else "Updated"
        print(f"  [Testing] [{status_str}] Module #{idx}: {module_title}")

print("\nSuccessfully populated Python & Software Testing courses under Software Testing domain!")
