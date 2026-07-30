"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView


urlpatterns = [
    path('', RedirectView.as_view(url='https://my-frontend.onrender.com', permanent=False)),  # Redirect root to admin
    path("admin/", admin.site.urls),
    path("api/admin_panel/", include("admin_panel.urls")),
    path("api/auth/", include("authentication.urls")),
    path('api/common/', include('common.urls')),
    path("api/candidate/", include("candidate.urls")),
    path("api/coding/", include("coding.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/interviewer/", include("interviewer.urls")),
    path("api/interview/", include("interview.urls")),
    path("api/quiz/", include("quiz.urls")),
    path("api/resume/", include("resume.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/feedback/", include("feedback.urls")),
    path("api/compiler/", include("compiler.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    