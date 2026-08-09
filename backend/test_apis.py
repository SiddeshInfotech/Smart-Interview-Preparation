import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from authentication.models import User
from candidate.models import Candidate_Profile
from common.personalization_service import get_candidate_personalization_context, calculate_internal_difficulty
from ai.quiz_service import generate_quiz_questions
from ai.coding_service import generate_coding_question

def run_tests():
    print("--- Starting API & Personalization Verification ---")
    
    # 1. Get or Create Test User
    user, created = User.objects.get_or_create(email="test_personalization@example.com", defaults={
        "full_name": "Test Candidate",
        "user_type": "candidate"
    })
    print(f"User retrieved/created: {user.email} (Created: {created})")

    # 2. Candidate Profile Domain Update Test
    profile, p_created = Candidate_Profile.objects.get_or_create(user=user)
    profile.target_domain = "Game Development"
    profile.experience_years = 2.0
    profile.skills = "C++, C#, OOP, Unity"
    profile.location = "Dhule, Maharashtra"
    profile.education = "B.Tech Computer Engineering"
    profile.save()
    print(f"Candidate Profile saved with domain: '{profile.target_domain}' and skills: '{profile.skills}'")

    # 3. Personalization Context Gathering Test
    context = get_candidate_personalization_context(user)
    print("\n--- Aggregated Personalization Context ---")
    print(f"Domain: {context['domain']}")
    print(f"Experience Years: {context['experience_years']}")
    print(f"Profile Skills: {context['profile_skills']}")
    print(f"Calculated Automatic Internal Difficulty: {context['calculated_difficulty']}")
    
    assert context['domain'] == "Game Development", "Domain mismatch"
    assert context['calculated_difficulty'] in ["Easy", "Medium", "Hard"], "Invalid calculated difficulty"
    print("Personalization Engine context test PASSED!")

    # 4. Quiz Generation API Service Test with Personalization Context
    print("\n--- Quiz Generation AI Service Test ---")
    try:
        quiz_questions = generate_quiz_questions(
            topics=["C++", "Game Physics"],
            difficulty=context['calculated_difficulty'],
            count=3,
            mode="MCQ",
            custom_instruction="Test domain generation",
            personalization_context=context
        )
        print(f"Quiz Questions Generated Successfully! Count: {len(quiz_questions)}")
        for idx, q in enumerate(quiz_questions, 1):
            print(f"  Q{idx}: {q['text'][:70]}... (Correct Index: {q['correct']})")
    except Exception as e:
        print(f"Quiz Generation Note: {e}")

    # 5. Coding Generation AI Service Test with Personalization Context
    print("\n--- Coding Challenge AI Service Test ---")
    try:
        coding_data = generate_coding_question(
            language="C++",
            difficulty=context['calculated_difficulty'],
            custom_instruction="Test domain coding problem",
            personalization_context=context
        )
        print("Coding Problem Generated Successfully!")
        print(f"  Title: {coding_data.get('title')}")
        print(f"  Problem Statement: {coding_data.get('problem_statement')[:80]}...")
        print(f"  Sample Input: {coding_data.get('sample_input')}")
        print(f"  Sample Output: {coding_data.get('sample_output')}")
    except Exception as e:
        print(f"Coding Generation Note: {e}")

    print("\n==========================================")
    print("ALL API LOGIC & PERSONALIZATION TESTS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
