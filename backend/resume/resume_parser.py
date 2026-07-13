import os
import PyPDF2
from docx import Document



def extract_text_from_pdf(file_path):
    """
    Extract text from PDF resume
    """

    text = ""

    try:
        with open(file_path, "rb") as file:

            pdf_reader = PyPDF2.PdfReader(file)

            for page in pdf_reader.pages:

                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"


    except Exception as e:

        raise Exception(
            f"PDF text extraction failed: {str(e)}"
        )


    return text




def extract_text_from_docx(file_path):
    """
    Extract text from DOCX resume
    """

    text = ""

    try:

        document = Document(file_path)

        for paragraph in document.paragraphs:

            if paragraph.text.strip():

                text += paragraph.text + "\n"


        # Extract text from tables also
        for table in document.tables:

            for row in table.rows:

                for cell in row.cells:

                    text += cell.text + " "


    except Exception as e:

        raise Exception(
            f"DOCX text extraction failed: {str(e)}"
        )


    return text




def extract_resume_text(file_path):
    """
    Detect file type and extract resume text
    Supports:
    - PDF
    - DOCX
    """

    if not os.path.exists(file_path):

        raise FileNotFoundError(
            "Resume file not found"
        )


    extension = os.path.splitext(file_path)[1].lower()



    if extension == ".pdf":

        text = extract_text_from_pdf(file_path)



    elif extension == ".docx":

        text = extract_text_from_docx(file_path)



    else:

        raise ValueError(
            "Only PDF and DOCX files are supported"
        )



    if not text.strip():

        raise ValueError(
            "No text found in resume"
        )


    return text.strip()