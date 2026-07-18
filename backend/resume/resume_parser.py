import os
import PyPDF2
from docx import Document


def extract_resume_text(file_path):
    text = ""

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        with open(file_path, "rb") as pdf_file:
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                if page.extract_text():
                    text += page.extract_text()

    elif extension == ".docx":
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"

    return text