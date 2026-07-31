"""
admin_panel/dynamic_urls.py — Dynamic URL Routing

Uses path converters to route to the generic CRUD views
for any registered Django model.
"""

from django.urls import path
from . import dynamic_views

urlpatterns = [
    # ── Model Discovery ─────────────────────────────────────
    path("models/", dynamic_views.models_list, name="dynamic_models_list"),
    path(
        "models/<str:app_label>/<str:model_name>/",
        dynamic_views.model_metadata,
        name="dynamic_model_metadata",
    ),

    # ── Dashboard ────────────────────────────────────────────
    path("dashboard/", dynamic_views.dashboard_stats, name="dynamic_dashboard"),

    # ── FK Options (for dropdowns) ───────────────────────────
    path(
        "<str:app_label>/<str:model_name>/fk-options/<str:field_name>/",
        dynamic_views.fk_options,
        name="dynamic_fk_options",
    ),

    # ── Bulk Actions ─────────────────────────────────────────
    path(
        "<str:app_label>/<str:model_name>/bulk-delete/",
        dynamic_views.model_bulk_delete,
        name="dynamic_bulk_delete",
    ),

    # ── History / Audit Log ──────────────────────────────────
    path(
        "<str:app_label>/<str:model_name>/<str:pk>/history/",
        dynamic_views.model_history,
        name="dynamic_model_history",
    ),

    # ── Generic CRUD ─────────────────────────────────────────
    path(
        "<str:app_label>/<str:model_name>/",
        dynamic_views.model_list_create,
        name="dynamic_model_list_create",
    ),
    path(
        "<str:app_label>/<str:model_name>/<str:pk>/",
        dynamic_views.model_detail,
        name="dynamic_model_detail",
    ),
]
