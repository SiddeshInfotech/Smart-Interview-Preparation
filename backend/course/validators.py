import os
from django.core.exceptions import ValidationError


def validate_pdf_file(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = [".pdf"]
    if not ext.lower() in valid_extensions:
        raise ValidationError("Unsupported file extension. Only PDF files are allowed.")
    
    # 20 MB file size limit
    max_size = 20 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError("File size exceeds maximum allowed limit of 20MB.")
