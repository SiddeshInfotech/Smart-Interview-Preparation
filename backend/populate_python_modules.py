import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from course.models import Domain, Course, CourseModule
from django.core.files import File

# Check primary project downloads directory first, then user Downloads directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DOWNLOADS_DIR = os.path.join(BASE_DIR, "..", "downloads", "Python_Notes_Topic_PDFs")
USER_DOWNLOADS_DIR = r"C:\Users\Admin\Downloads\Python_Notes_Topic_PDFs"

if os.path.exists(PROJECT_DOWNLOADS_DIR) and os.listdir(PROJECT_DOWNLOADS_DIR):
    SPLIT_DIR = os.path.abspath(PROJECT_DOWNLOADS_DIR)
elif os.path.exists(USER_DOWNLOADS_DIR) and os.listdir(USER_DOWNLOADS_DIR):
    SPLIT_DIR = USER_DOWNLOADS_DIR
else:
    raise FileNotFoundError(f"Python PDFs directory not found in '{PROJECT_DOWNLOADS_DIR}' or '{USER_DOWNLOADS_DIR}'.")

print(f"Using PDF source directory: {SPLIT_DIR}")

# 1. Get or create Web Development (Full Stack) domain
domain, _ = Domain.objects.get_or_create(
    name="Web Development",
    defaults={"description": "Full Stack Web Development & Frontend/Backend Frameworks"}
)

# Ensure sequence order in Web Development: HTML/CSS (1), React (2), Python (3)
Course.objects.filter(domain=domain, technology="HTML/CSS").update(sequence=1)
Course.objects.filter(domain=domain, technology="React").update(sequence=2)

# 2. Get or create Python Course under Web Development domain
course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="Python",
    defaults={
        "title": "Python Programming Masterclass & Notes",
        "description": "Comprehensive Python programming notes, data structures, control flow, functions, OOP, and file handling study materials.",
        "sequence": 3,
        "is_required": True,
        "is_active": True
    }
)
course.sequence = 3
course.save()

# 3. Sort and process PDF files
pdf_files = sorted([f for f in os.listdir(SPLIT_DIR) if f.endswith(".pdf")])
print(f"Found {len(pdf_files)} PDF files to import into course: '{course.title}'")

for idx, filename in enumerate(pdf_files, start=1):
    file_path = os.path.join(SPLIT_DIR, filename)
    clean_title = filename.replace(".pdf", "").replace("_", " ")
    
    module, created = CourseModule.objects.get_or_create(
        course=course,
        sequence=idx,
        defaults={
            "title": clean_title,
            "pdf_title": f"{clean_title} Notes",
            "description": f"Study material for {clean_title}"
        }
    )
    module.title = clean_title
    module.pdf_title = f"{clean_title} Notes"
    module.sequence = idx
    
    with open(file_path, "rb") as f:
        module.pdf_file.save(filename, File(f), save=True)
    
    status_str = "Created" if created else "Updated"
    print(f"[{status_str}] Module #{idx}: {clean_title} ({filename})")

print(f"Successfully imported {len(pdf_files)} Python topic PDFs into Course: '{course.title}' under Domain: '{domain.name}'!")
