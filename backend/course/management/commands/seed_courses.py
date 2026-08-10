import os
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from course.models import (
    Domain,
    Technology,
    Course,
    DomainCourse,
    CourseModule,
    CourseTopic,
    CourseMaterial,
)


def create_dummy_pdf_content(title):
    """Generate a minimal valid PDF byte string."""
    pdf_text = (
        f"%PDF-1.4\n"
        f"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        f"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        f"4 0 obj << /Length 120 >> stream\n"
        f"BT\n/F1 24 Tf\n50 700 Td\n({title}) Tj\nET\n"
        f"BT\n/F1 12 Tf\n50 650 Td\n(Smart Interview Preparation Portal - Official Study Material) Tj\nET\n"
        f"endstream\nendobj\n"
        f"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        f"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000414 00000 n \n"
        f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n493\n%%EOF\n"
    )
    return pdf_text.encode("utf-8")


class Command(BaseCommand):
    help = "Seed initial domain and course learning data"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Domains, Technologies, and Courses..."))

        # 1. Domains
        domains_data = [
            ("Web Development", "Master full stack web development using modern frameworks, databases, and APIs."),
            ("Game Development", "Learn game programming, Unity, game engine architecture, physics, and AI."),
            ("Cybersecurity", "Explore network security, Linux administration, ethical hacking, and web security."),
            ("Mobile Development", "Build cross-platform and native mobile apps with React Native, Flutter, and Swift."),
            ("Data Science", "Learn machine learning, data analysis, Python, and SQL optimization."),
            ("Software Testing", "Master manual and automated QA testing, Selenium, and API testing."),
        ]

        domains_map = {}
        for name, desc in domains_data:
            dom, _ = Domain.objects.get_or_create(name=name, defaults={"description": desc, "is_active": True})
            domains_map[name] = dom

        # 2. Technologies
        techs_data = [
            ("Python", "General-purpose programming language widely used in web dev, scripting, and AI."),
            ("C#", "Object-oriented language developed by Microsoft, primary language for Unity engine."),
            ("C++", "High-performance language used in systems, game engines, and low-level programming."),
            ("JavaScript", "Dynamic scripting language powering the web frontend and backend."),
            ("React", "Popular frontend UI library for building interactive web interfaces."),
            ("Django", "High-level Python web framework encouraging rapid development and clean design."),
            ("Unity", "Leading cross-platform game engine for 2D and 3D games."),
            ("Networking", "Core computer networking protocols, OSI layer, and IP security."),
            ("Linux", "Open-source operating system essential for server admin and cybersecurity."),
        ]

        techs_map = {}
        for name, desc in techs_data:
            t, _ = Technology.objects.get_or_create(name=name, defaults={"description": desc, "is_active": True})
            techs_map[name] = t

        # 3. Courses Structure
        courses_structure = [
            {
                "title": "Python + Django",
                "description": "Complete Python programming guide from fundamentals to building robust Django REST APIs.",
                "tech": techs_map.get("Python"),
                "domains": [("Web Development", 1, True)],
                "modules": [
                    {
                        "title": "Python Fundamentals",
                        "description": "Core concepts of Python syntax, data types, and control flow.",
                        "sequence": 1,
                        "topics": [
                            "Variables & Data Types",
                            "Operators",
                            "Conditional Statements",
                            "Loops",
                            "Functions",
                            "Lists",
                            "Tuples",
                            "Dictionaries",
                            "Sets",
                        ],
                    },
                    {
                        "title": "Object-Oriented Programming",
                        "description": "Classes, inheritance, encapsulation, and polymorphism in Python.",
                        "sequence": 2,
                        "topics": [
                            "Classes & Objects",
                            "Inheritance",
                            "Polymorphism",
                            "Encapsulation",
                        ],
                    },
                    {
                        "title": "Django & REST Framework",
                        "description": "Building production web apps with Django MVT and DRF.",
                        "sequence": 3,
                        "topics": [
                            "Django Architecture & MVT",
                            "Django Models & ORM",
                            "Views & Routing",
                            "Django REST Framework",
                        ],
                    },
                ],
            },
            {
                "title": "HTML + CSS",
                "description": "Modern frontend markup and responsive styling mastery.",
                "tech": techs_map.get("JavaScript"),
                "domains": [("Web Development", 2, True)],
                "modules": [
                    {
                        "title": "Web Foundations",
                        "description": "HTML5 semantic markup and CSS styling.",
                        "sequence": 1,
                        "topics": [
                            "HTML5 Semantic Elements",
                            "CSS Grid & Flexbox",
                            "Responsive Design",
                        ],
                    }
                ],
            },
            {
                "title": "JavaScript + React",
                "description": "Modern ES6+ JavaScript and React component architecture.",
                "tech": techs_map.get("React"),
                "domains": [("Web Development", 3, True)],
                "modules": [
                    {
                        "title": "React Core",
                        "description": "Component lifecycle, state hooks, and routing.",
                        "sequence": 1,
                        "topics": [
                            "React Components & Props",
                            "State & Hooks",
                            "Context API & Performance",
                        ],
                    }
                ],
            },
            # Game Development Courses
            {
                "title": "C# for Unity",
                "description": "Comprehensive C# scripting for Unity game engine development.",
                "tech": techs_map.get("C#"),
                "domains": [("Game Development", 1, True)],
                "modules": [
                    {
                        "title": "C# Fundamentals",
                        "description": "C# syntax, OOP principles, collections, and async programming.",
                        "sequence": 1,
                        "topics": [
                            "Variables & Data Types",
                            "Control Flow",
                            "Functions & Methods",
                            "OOP in C#",
                            "Collections & LINQ",
                        ],
                    },
                    {
                        "title": "Unity C# Scripting",
                        "description": "Scripting Unity MonoBehaviours, game loops, physics, and UI.",
                        "sequence": 2,
                        "topics": [
                            "MonoBehaviour",
                            "GameObjects",
                            "Components",
                            "Unity Input System",
                            "Physics & Collisions",
                            "Coroutines",
                            "Scenes & Prefabs",
                        ],
                    },
                ],
            },
            {
                "title": "C++ for Game Development",
                "description": "High-performance game programming with C++.",
                "tech": techs_map.get("C++"),
                "domains": [("Game Development", 2, True)],
                "modules": [
                    {
                        "title": "Modern C++ Foundations",
                        "description": "Pointers, memory layout, and RAII.",
                        "sequence": 1,
                        "topics": [
                            "Pointers & Memory Management",
                            "Object Oriented Design in C++",
                            "Game Loop Architecture",
                        ],
                    }
                ],
            },
            {
                "title": "Game Mathematics",
                "description": "Essential vectors, matrices, and 3D math for game developers.",
                "tech": techs_map.get("C#"),
                "domains": [("Game Development", 3, False)],
                "modules": [
                    {
                        "title": "Vectors & Matrices",
                        "description": "Vector arithmetic and spatial transformations.",
                        "sequence": 1,
                        "topics": [
                            "Vector Math (2D & 3D)",
                            "Matrix Transformations",
                            "Trigonometry in Games",
                        ],
                    }
                ],
            },
            {
                "title": "Game Physics",
                "description": "Rigidbodies, collision detection, and physics integration.",
                "tech": techs_map.get("Unity"),
                "domains": [("Game Development", 4, False)],
                "modules": [
                    {
                        "title": "Physics Systems",
                        "description": "Forces, gravity, and raycasting.",
                        "sequence": 1,
                        "topics": [
                            "Gravity & Forces",
                            "Collision Detection",
                            "Raycasting",
                        ],
                    }
                ],
            },
            {
                "title": "Game AI",
                "description": "Pathfinding algorithms, state machines, and enemy AI.",
                "tech": techs_map.get("C#"),
                "domains": [("Game Development", 5, False)],
                "modules": [
                    {
                        "title": "AI Systems & Pathfinding",
                        "description": "A* search and finite state machines.",
                        "sequence": 1,
                        "topics": [
                            "A* Pathfinding Algorithm",
                            "Finite State Machines",
                            "Behavior Trees",
                        ],
                    }
                ],
            },
            # Cybersecurity Courses
            {
                "title": "Python for Cybersecurity",
                "description": "Automating security tasks, socket programming, and security scripting with Python.",
                "tech": techs_map.get("Python"),
                "domains": [("Cybersecurity", 1, True)],
                "modules": [
                    {
                        "title": "Security Scripting",
                        "description": "Python scripts for pentesting and automation.",
                        "sequence": 1,
                        "topics": [
                            "Socket Programming",
                            "Port Scanning",
                            "Packet Inspection",
                        ],
                    }
                ],
            },
            {
                "title": "Networking",
                "description": "Master TCP/IP, OSI model, routing, switching, and network security protocols.",
                "tech": techs_map.get("Networking"),
                "domains": [("Cybersecurity", 2, True)],
                "modules": [
                    {
                        "title": "Network Fundamentals",
                        "description": "OSI 7-layer model, IP addressing, and subnetting.",
                        "sequence": 1,
                        "topics": [
                            "OSI Model & TCP/IP",
                            "IP Addressing & Subnetting",
                            "Routing & Protocols",
                        ],
                    }
                ],
            },
            {
                "title": "Linux",
                "description": "Linux command line, system administration, process management, and security.",
                "tech": techs_map.get("Linux"),
                "domains": [("Cybersecurity", 3, True)],
                "modules": [
                    {
                        "title": "Linux System Admin",
                        "description": "Command line, permissions, and shell scripts.",
                        "sequence": 1,
                        "topics": [
                            "Shell Scripting",
                            "Permissions & Process Management",
                            "System Hardening",
                        ],
                    }
                ],
            },
            {
                "title": "Web Security",
                "description": "OWASP Top 10 vulnerabilities, web exploitation, and secure web application defense.",
                "tech": techs_map.get("JavaScript"),
                "domains": [("Cybersecurity", 4, True)],
                "modules": [
                    {
                        "title": "OWASP Top 10 Vulnerabilities",
                        "description": "Common web security flaws and mitigations.",
                        "sequence": 1,
                        "topics": [
                            "SQL Injection (SQLi)",
                            "Cross-Site Scripting (XSS)",
                            "Authentication & JWT Security",
                        ],
                    }
                ],
            },
        ]

        for course_info in courses_structure:
            c, _ = Course.objects.get_or_create(
                title=course_info["title"],
                defaults={
                    "description": course_info["description"],
                    "technology": course_info["tech"],
                    "is_active": True,
                },
            )

            # Link Course to Domains
            for dom_name, seq, req in course_info["domains"]:
                dom = domains_map.get(dom_name)
                if dom:
                    DomainCourse.objects.get_or_create(
                        domain=dom,
                        course=c,
                        defaults={"sequence": seq, "is_required": req},
                    )

            # Create Modules & Topics
            for m_info in course_info["modules"]:
                mod, _ = CourseModule.objects.get_or_create(
                    course=c,
                    title=m_info["title"],
                    defaults={
                        "description": m_info["description"],
                        "sequence": m_info["sequence"],
                        "is_active": True,
                    },
                )

                for idx, t_name in enumerate(m_info["topics"], start=1):
                    top, _ = CourseTopic.objects.get_or_create(
                        module=mod,
                        title=t_name,
                        defaults={
                            "description": f"Detailed notes and exercises for {t_name}.",
                            "sequence": idx,
                            "is_active": True,
                        },
                    )

                    # Create Course Materials (PDFs)
                    if not top.materials.exists():
                        pdf_data = create_dummy_pdf_content(f"{c.title} - {t_name}")
                        filename = f"{t_name.lower().replace(' ', '_').replace('&', 'and')}_notes.pdf"
                        
                        mat = CourseMaterial(
                            topic=top,
                            title=f"{t_name} Complete Notes",
                            description=f"Official lecture PDF notes for {t_name}.",
                            material_type="PDF",
                            is_active=True,
                        )
                        mat.file.save(filename, ContentFile(pdf_data), save=True)

                        # Additional revision material for selected topics
                        if idx == 1:
                            pdf_data_2 = create_dummy_pdf_content(f"{t_name} - Practical Examples")
                            filename_2 = f"{t_name.lower().replace(' ', '_')}_examples.pdf"
                            mat2 = CourseMaterial(
                                topic=top,
                                title=f"{t_name} Practical Examples",
                                description=f"Hands-on code examples and interview exercises.",
                                material_type="PDF",
                                is_active=True,
                            )
                            mat2.file.save(filename_2, ContentFile(pdf_data_2), save=True)

        self.stdout.write(self.style.SUCCESS("Successfully seeded course data and PDF materials!"))
