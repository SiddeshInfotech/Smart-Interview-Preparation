import os
import sys
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
SQL_PDF_DIR = os.path.join(PROJECT_ROOT, "downloads", "SQL_Notes_Topic_PDFs")
USER_SQL_DIR = r"C:\Users\Admin\Downloads\SQL"

if not os.path.exists(SQL_PDF_DIR) or not os.listdir(SQL_PDF_DIR):
    if os.path.exists(USER_SQL_DIR) and os.listdir(USER_SQL_DIR):
        SQL_PDF_DIR = USER_SQL_DIR

# 1. Get or update Data Analysis & Data Science domain
domain = Domain.objects.filter(name__icontains="Data").first()
if not domain:
    domain = Domain.objects.create(
        name="Data Analysis & Data Science",
        description="Master SQL database querying, Python data analysis, pandas, visualization, and statistics."
    )
else:
    domain.name = "Data Analysis & Data Science"
    domain.description = "Master SQL database querying, Python data analysis, pandas, visualization, and statistics."
    domain.save()

print(f"Targeting Domain: '{domain.name}' (ID: {domain.domain_id})")

# ==============================================================================
# COURSE 1: Python Programming Masterclass & Notes (Data Analysis)
# ==============================================================================
python_course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="Python",
    defaults={
        "title": "Python for Data Analysis & Programming Notes",
        "description": "Comprehensive Python programming, data structures, functions, arrays, modules, and file handling for Data Analysis.",
        "sequence": 1,
        "is_required": True,
        "is_active": True
    }
)
python_course.title = "Python for Data Analysis & Programming Notes"
python_course.sequence = 1
python_course.save()

if os.path.exists(PYTHON_PDF_DIR):
    python_files = sorted([f for f in os.listdir(PYTHON_PDF_DIR) if f.endswith(".pdf")])
    print(f"Populating {len(python_files)} Python PDFs into Data Analysis Course #{python_course.sequence}...")
    
    for idx, filename in enumerate(python_files, start=1):
        file_path = os.path.join(PYTHON_PDF_DIR, filename)
        clean_title = filename.replace(".pdf", "").replace("_", " ")
        
        module, created = CourseModule.objects.get_or_create(
            course=python_course,
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
        print(f"  [Python] [{status_str}] Module #{idx}: {clean_title}")

# ==============================================================================
# COURSE 2: SQL Database Masterclass & Notes (Data Analysis)
# ==============================================================================
sql_course, _ = Course.objects.get_or_create(
    domain=domain,
    technology="SQL",
    defaults={
        "title": "SQL Database Masterclass & Topic Notes",
        "description": "Comprehensive SQL data definition (DDL), manipulation (DML), filtering, aggregates, joins, update statements, transactions, and table operations.",
        "sequence": 2,
        "is_required": True,
        "is_active": True
    }
)
sql_course.title = "SQL Database Masterclass & Topic Notes"
sql_course.sequence = 2
sql_course.save()

if os.path.exists(SQL_PDF_DIR):
    sql_files = sorted([f for f in os.listdir(SQL_PDF_DIR) if f.endswith(".pdf")])
    print(f"Populating {len(sql_files)} SQL PDFs into Data Analysis Course #{sql_course.sequence}...")
    
    for idx, filename in enumerate(sql_files, start=1):
        file_path = os.path.join(SQL_PDF_DIR, filename)
        clean_title = filename.replace(".pdf", "").replace("_", " ")
        
        module, created = CourseModule.objects.get_or_create(
            course=sql_course,
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
        print(f"  [SQL] [{status_str}] Module #{idx}: {clean_title}")

print("\nSuccessfully populated Python & SQL courses under Data Analysis & Data Science domain!")
