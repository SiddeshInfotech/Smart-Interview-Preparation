from django.core.management.base import BaseCommand
from course.models import Domain


class Command(BaseCommand):
    help = "Seed clean initial preparation domains"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding preparation domains..."))

        domains_data = [
            ("Web Development", "Master full stack web development using modern frameworks, databases, and REST APIs."),
            ("Game Development", "Learn game programming, Unity, game engine architecture, physics, and AI."),
            ("Cybersecurity", "Explore network security, Linux administration, ethical hacking, and web security."),
            ("Mobile Development", "Build cross-platform and native mobile apps with React Native, Flutter, and Swift."),
            ("Data Science", "Learn machine learning, data analysis, Python, and SQL optimization."),
            ("Software Testing", "Master manual and automated QA testing, Selenium, and API testing."),
        ]

        for name, desc in domains_data:
            dom, created = Domain.objects.get_or_create(
                name=name,
                defaults={"description": desc, "is_active": True},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created domain: {name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Domain exists: {name}"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded preparation domains!"))
