"""
PDF Text Extraction and Context Builder Service.
Retrieves active PDF materials for a course chapter (module), extracts clean text preserving formatting,
caches the text in CourseMaterial, and formats the material context for AI quiz generation.
"""

import logging
import re
from typing import Dict, List, Tuple
from django.utils import timezone

logger = logging.getLogger("quiz.pdf_extractor")


def extract_clean_text_from_file_obj(file_obj, pdf_name: str = "document.pdf") -> str:
    """
    Extract readable text from a PDF file object.
    Preserves headings, lists, code blocks, and terminology while removing excess repeated blank lines.
    """
    extracted_text = ""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(file_obj)
        page_chunks = []

        for idx, page in enumerate(reader.pages):
            page_raw = page.extract_text() or ""
            page_clean = page_raw.strip()
            if page_clean:
                lines = [line.rstrip() for line in page_clean.splitlines()]
                filtered_lines = []
                prev_empty = False

                for line in lines:
                    if not line:
                        if not prev_empty:
                            filtered_lines.append("")
                        prev_empty = True
                    else:
                        filtered_lines.append(line)
                        prev_empty = False

                page_text = "\n".join(filtered_lines)
                page_chunks.append(f"--- PAGE {idx + 1} ---\n{page_text}")

        extracted_text = "\n\n".join(page_chunks).strip()

    except Exception as e:
        logger.error(f"[PDF_EXTRACT] Failed to extract text from '{pdf_name}': {e}", exc_info=True)
        return ""

    # Remove non-printable control characters except standard newlines/tabs
    extracted_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", extracted_text)
    return extracted_text


def get_or_extract_material_text(material) -> str:
    """
    Returns cached extracted text for a CourseMaterial instance or extracts and caches it if missing.
    """
    if material.extracted_text and material.extracted_text.strip():
        logger.info(f"[PDF_EXTRACT] Using cached text for '{material.title}' ({len(material.extracted_text)} chars)")
        return material.extracted_text

    if not material.pdf_file:
        return ""

    try:
        try:
            f = material.pdf_file.open("rb")
        except Exception:
            f = open(material.pdf_file.path, "rb")

        with f:
            text = extract_clean_text_from_file_obj(f, pdf_name=material.title or "Material")

        if text:
            material.extracted_text = text
            material.text_extracted_at = timezone.now()
            material.save(update_fields=["extracted_text", "text_extracted_at"])
            logger.info(f"[PDF_EXTRACT] Extracted & cached {len(text)} chars for '{material.title}'")
            return text

    except Exception as e:
        logger.warning(f"[PDF_EXTRACT] Could not extract text from CourseMaterial {material.material_id}: {e}")

    return ""


def get_module_all_pdf_materials(module) -> List[Dict[str, str]]:
    """
    Retrieves all active PDF materials associated with a CourseModule/Chapter.
    Includes both attached CourseMaterial records and module.pdf_file for full backward compatibility.
    """
    materials = []

    # 1. Attached CourseMaterial records
    active_materials = module.materials.filter(is_active=True)
    for mat in active_materials:
        text = get_or_extract_material_text(mat)
        if text:
            materials.append({
                "material_id": mat.material_id,
                "title": mat.title or f"{module.title} Notes",
                "filename": mat.pdf_file.name.split("/")[-1],
                "text": text,
            })

    # 2. Legacy module.pdf_file if present and not already added
    if module.pdf_file:
        module_pdf_name = module.pdf_file.name.split("/")[-1]
        already_included = any(m["filename"] == module_pdf_name for m in materials)

        if not already_included:
            pdf_text = ""
            try:
                try:
                    f = module.pdf_file.open("rb")
                except Exception:
                    f = open(module.pdf_file.path, "rb")

                with f:
                    pdf_text = extract_clean_text_from_file_obj(f, pdf_name=module_pdf_name)
            except Exception as e:
                logger.warning(f"[PDF_EXTRACT] Could not extract module.pdf_file for module {module.module_id}: {e}")

            if pdf_text:
                materials.append({
                    "material_id": None,
                    "title": module.pdf_title or f"{module.title} Notes",
                    "filename": module_pdf_name,
                    "text": pdf_text,
                })

    return materials


def build_chapter_material_context(course_title: str, chapter_title: str, materials: List[Dict[str, str]]) -> Tuple[str, int]:
    """
    Formulates a structured source material context for the AI prompt.
    Returns (context_string, total_character_count).
    """
    context_lines = [
        f"COURSE:\n{course_title}\n",
        f"CHAPTER:\n{chapter_title}\n",
        "SOURCE MATERIALS ATTACHED TO THIS CHAPTER:\n"
    ]

    total_chars = 0
    for idx, mat in enumerate(materials, start=1):
        clean_text = mat["text"].strip()
        total_chars += len(clean_text)
        context_lines.append(f"SOURCE MATERIAL {idx}: {mat['filename']} (Title: '{mat['title']}')")
        context_lines.append("CONTENT:")
        context_lines.append("=========================================")
        context_lines.append(clean_text)
        context_lines.append("=========================================\n")

    context_str = "\n".join(context_lines)
    return context_str, total_chars
