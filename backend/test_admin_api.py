import os, json, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from candidate.models import Candidate_Profile
from admin_panel.serializers import CandidateProfileSerializer
from admin_panel.discovery import get_model_fields, get_model_admin_config

print("--- Candidate_Profile Model Fields ---")
model_fields = [f.name for f in Candidate_Profile._meta.get_fields()]
print("Model Fields:", model_fields)

print("\n--- CandidateProfileAdmin config ---")
config = get_model_admin_config(Candidate_Profile)
print("list_display:", config.get("list_display"))

print("\n--- Serializer Output Check ---")
profile = Candidate_Profile.objects.first()
if profile:
    serializer = CandidateProfileSerializer(profile)
    print("Serialized Keys:", list(serializer.data.keys()))
    print("target_domain value:", serializer.data.get("target_domain"))
else:
    print("No Candidate_Profile records found in database.")

print("\n--- Discovery get_model_fields ---")
disc_fields = [f["name"] for f in get_model_fields(Candidate_Profile)]
print("Discovered Fields:", disc_fields)
print("is 'target_domain' in discovered fields?", "target_domain" in disc_fields)
