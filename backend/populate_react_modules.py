import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from course.models import Domain, Course, CourseModule
from django.core.files import File

SPLIT_DIR = r"C:\Users\Admin\Downloads\React_JS_Notes_Split"

domain, _ = Domain.objects.get_or_create(
    name="Web Development",
    defaults={"description": "Full Stack Web Development & Frontend Frameworks"}
)

course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="React",
    defaults={
        "title": "React JS Masterclass & Notes",
        "description": "Comprehensive unit-wise React JS documentation and study materials.",
        "sequence": 1
    }
)

pdf_files = sorted([f for f in os.listdir(SPLIT_DIR) if f.endswith(".pdf")])
print(f"Found {len(pdf_files)} PDF files to import into course: {course.title}")

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
    
    with open(file_path, "rb") as f:
        module.pdf_file.save(filename, File(f), save=True)
    
    status_str = "Created" if created else "Updated"
    print(f"[{status_str}] Module #{idx}: {clean_title}")

print("All 30 unit PDFs imported into CourseModule database successfully!")
