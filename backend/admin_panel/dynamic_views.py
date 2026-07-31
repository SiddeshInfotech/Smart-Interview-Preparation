"""
admin_panel/dynamic_views.py — Generic Dynamic Admin API Views

A single set of views that handles CRUD for ANY registered Django model.
Includes server-side pagination, search, ordering, filtering, bulk actions,
and audit logging.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.apps import apps
from django.contrib.admin.models import ADDITION

from .discovery import (
    discover_models,
    get_models_grouped,
    get_model_by_name,
    get_model_fields,
    get_model_admin_config,
    get_pk_field_name,
    get_searchable_fields,
    get_filterable_fields,
    get_select_related_fields,
    get_prefetch_related_fields,
)
from .dynamic_serializers import build_serializer_class, get_fk_options
from .audit import log_create, log_update, log_delete, log_bulk_delete, get_history, get_recent_actions


class IsAdminOrSuperUser(BasePermission):
    """Only allow authenticated staff/superuser."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (getattr(request.user, "is_staff", False) or getattr(request.user, "is_superuser", False))
        )


class AdminPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# ─────────────────────────────────────────────────────────────
# Model Discovery Endpoints
# ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminOrSuperUser])
def models_list(request):
    """
    GET /api/admin/models/
    Returns all registered models grouped by app, with field metadata.
    """
    try:
        groups = get_models_grouped()
        # Add record counts
        for group in groups:
            for model_info in group["models"]:
                try:
                    model = get_model_by_name(model_info["app_label"], model_info["model_name"])
                    model_info["count"] = model.objects.count() if model else 0
                except Exception:
                    model_info["count"] = 0
        return Response({"success": True, "data": groups})
    except Exception as exc:
        return Response({"success": False, "message": str(exc)}, status=500)


@api_view(["GET"])
@permission_classes([IsAdminOrSuperUser])
def model_metadata(request, app_label, model_name):
    """
    GET /api/admin/models/{app_label}/{model_name}/
    Returns detailed field metadata for a single model.
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response(
            {"success": False, "message": f"Model '{app_label}.{model_name}' not found or not registered."},
            status=404,
        )

    fields = get_model_fields(model)
    admin_config = get_model_admin_config(model)
    pk_field = get_pk_field_name(model)

    # Mark readonly fields from admin config
    readonly_set = set(admin_config.get("readonly_fields", []))
    for f in fields:
        if f["name"] in readonly_set:
            f["readonly"] = True

    try:
        count = model.objects.count()
    except Exception:
        count = 0

    return Response({
        "success": True,
        "data": {
            "app_label": app_label,
            "model_name": model_name,
            "verbose_name": str(model._meta.verbose_name).capitalize(),
            "verbose_name_plural": str(model._meta.verbose_name_plural).capitalize(),
            "pk_field": pk_field,
            "fields": fields,
            "admin_config": admin_config,
            "searchable_fields": get_searchable_fields(model),
            "filterable_fields": get_filterable_fields(model),
            "count": count,
        },
    })


# ─────────────────────────────────────────────────────────────
# FK Options Endpoint
# ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminOrSuperUser])
def fk_options(request, app_label, model_name, field_name):
    """
    GET /api/admin/{app_label}/{model_name}/fk-options/{field_name}/
    Returns available options for a FK field (for dropdowns/autocomplete).
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response({"success": False, "message": "Model not found."}, status=404)

    search = request.query_params.get("search", "")
    limit = int(request.query_params.get("limit", 50))
    options = get_fk_options(model, field_name, search_query=search, limit=limit)
    return Response({"success": True, "data": options})


# ─────────────────────────────────────────────────────────────
# Generic CRUD Endpoints
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def model_list_create(request, app_label, model_name):
    """
    GET  /api/admin/{app_label}/{model_name}/ — List with pagination, search, ordering, filters
    POST /api/admin/{app_label}/{model_name}/ — Create a new record
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response(
            {"success": False, "message": f"Model '{app_label}.{model_name}' not found."},
            status=404,
        )

    serializer_class = build_serializer_class(model)

    if request.method == "GET":
        return _handle_list(request, model, serializer_class)
    else:
        return _handle_create(request, model, serializer_class)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def model_detail(request, app_label, model_name, pk):
    """
    GET    /api/admin/{app_label}/{model_name}/{pk}/ — Retrieve
    PUT    /api/admin/{app_label}/{model_name}/{pk}/ — Full update
    PATCH  /api/admin/{app_label}/{model_name}/{pk}/ — Partial update
    DELETE /api/admin/{app_label}/{model_name}/{pk}/ — Delete
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response(
            {"success": False, "message": f"Model '{app_label}.{model_name}' not found."},
            status=404,
        )

    # Fetch the object with select_related for performance
    try:
        qs = model.objects.all()
        select_fields = get_select_related_fields(model)
        if select_fields:
            qs = qs.select_related(*select_fields)
        obj = qs.get(pk=pk)
    except model.DoesNotExist:
        return Response(
            {"success": False, "message": "Record not found."},
            status=404,
        )

    serializer_class = build_serializer_class(model)

    if request.method == "GET":
        return _handle_retrieve(request, obj, serializer_class)
    elif request.method in ("PUT", "PATCH"):
        return _handle_update(request, obj, serializer_class)
    else:
        return _handle_delete(request, obj)


# ─────────────────────────────────────────────────────────────
# Bulk Actions
# ─────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAdminOrSuperUser])
def model_bulk_delete(request, app_label, model_name):
    """
    POST /api/admin/{app_label}/{model_name}/bulk-delete/
    Body: { "ids": [1, 2, 3] }
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response({"success": False, "message": "Model not found."}, status=404)

    ids = request.data.get("ids", [])
    if not ids:
        return Response({"success": False, "message": "No IDs provided."}, status=400)

    try:
        count, _ = model.objects.filter(pk__in=ids).delete()
        log_bulk_delete(request.user, model, count)
        return Response({
            "success": True,
            "data": {"deleted_count": count},
        })
    except Exception as exc:
        return Response({"success": False, "message": str(exc)}, status=400)


# ─────────────────────────────────────────────────────────────
# History / Audit Log
# ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminOrSuperUser])
def model_history(request, app_label, model_name, pk):
    """
    GET /api/admin/{app_label}/{model_name}/{pk}/history/
    Returns audit log entries for a specific record.
    """
    model = get_model_by_name(app_label, model_name)
    if not model:
        return Response({"success": False, "message": "Model not found."}, status=404)

    history = get_history(model, pk)
    return Response({"success": True, "data": history})


# ─────────────────────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminOrSuperUser])
def dashboard_stats(request):
    """
    GET /api/admin/dashboard/
    Returns comprehensive dashboard statistics.
    """
    try:
        from authentication.models import User
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # Base stats
        stats = {
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "new_users_30d": User.objects.filter(created_at__gte=thirty_days_ago).count(),
            "new_users_7d": User.objects.filter(created_at__gte=seven_days_ago).count(),
            "staff_users": User.objects.filter(is_staff=True).count(),
        }

        # Model counts for all registered models
        model_counts = {}
        for model_info in discover_models():
            model = get_model_by_name(model_info["app_label"], model_info["model_name"])
            if model:
                try:
                    key = f"{model_info['app_label']}__{model_info['model_name']}"
                    model_counts[key] = {
                        "count": model.objects.count(),
                        "verbose_name": model_info["verbose_name"],
                        "verbose_name_plural": model_info["verbose_name_plural"],
                        "app_label": model_info["app_label"],
                        "model_name": model_info["model_name"],
                    }
                except Exception:
                    pass
        stats["model_counts"] = model_counts

        # Recent admin actions
        stats["recent_actions"] = get_recent_actions(limit=15)

        # User registration trend (last 30 days)
        from django.db.models.functions import TruncDate
        trend = (
            User.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("user_id"))
            .order_by("date")
        )
        stats["registration_trend"] = [
            {"date": row["date"].isoformat(), "count": row["count"]}
            for row in trend
        ]

        return Response({"success": True, "data": stats})
    except Exception as exc:
        return Response({"success": False, "message": str(exc)}, status=500)


# ─────────────────────────────────────────────────────────────
# Internal handler functions
# ─────────────────────────────────────────────────────────────

def _handle_list(request, model, serializer_class):
    """Handle GET list with pagination, search, ordering, filters."""
    qs = model.objects.all()

    # Select related for FKs
    select_fields = get_select_related_fields(model)
    if select_fields:
        qs = qs.select_related(*select_fields)

    # Prefetch M2M
    prefetch_fields = get_prefetch_related_fields(model)
    if prefetch_fields:
        qs = qs.prefetch_related(*prefetch_fields)

    # ── Search ─────────────────────────────────
    search = request.query_params.get("search", "").strip()
    if search:
        search_fields = get_searchable_fields(model)
        if search_fields:
            search_q = Q()
            for sf in search_fields:
                # Handle related field lookups (e.g., user__email)
                search_q |= Q(**{f"{sf}__icontains": search})
            qs = qs.filter(search_q)

    # ── Filtering ──────────────────────────────
    filterable = get_filterable_fields(model)
    for field_name in filterable:
        value = request.query_params.get(f"filter_{field_name}")
        if value is not None:
            # Handle boolean filter values
            if value.lower() in ("true", "1"):
                qs = qs.filter(**{field_name: True})
            elif value.lower() in ("false", "0"):
                qs = qs.filter(**{field_name: False})
            else:
                qs = qs.filter(**{field_name: value})

    # ── Ordering ───────────────────────────────
    ordering = request.query_params.get("ordering", "")
    if ordering:
        # Validate the field exists
        field_name = ordering.lstrip("-")
        valid_fields = {f.name for f in model._meta.get_fields() if hasattr(f, "column")}
        if field_name in valid_fields:
            qs = qs.order_by(ordering)
        else:
            # Default ordering
            pk_name = get_pk_field_name(model)
            qs = qs.order_by(f"-{pk_name}")
    else:
        # Default: most recent first
        pk_name = get_pk_field_name(model)
        qs = qs.order_by(f"-{pk_name}")

    # ── Pagination ─────────────────────────────
    paginator = AdminPagination()
    page = paginator.paginate_queryset(qs, request)

    if page is not None:
        serializer = serializer_class(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        # Wrap in our standard format
        return Response({
            "success": True,
            "data": {
                "results": response.data["results"],
                "count": response.data["count"],
                "next": response.data["next"],
                "previous": response.data["previous"],
                "page_size": paginator.page_size,
            },
        })

    # Fallback (shouldn't happen with pagination)
    serializer = serializer_class(qs[:100], many=True)
    return Response({"success": True, "data": {"results": serializer.data, "count": len(serializer.data)}})


def _handle_create(request, model, serializer_class):
    """Handle POST create."""
    try:
        serializer = serializer_class(data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            log_create(request.user, obj)
            return Response(
                {"success": True, "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        return Response(
            {"success": False, "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _handle_retrieve(request, obj, serializer_class):
    """Handle GET single record."""
    try:
        serializer = serializer_class(obj)
        return Response({"success": True, "data": serializer.data})
    except Exception as exc:
        return Response(
            {"success": False, "message": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _handle_update(request, obj, serializer_class):
    """Handle PUT/PATCH update."""
    partial = request.method == "PATCH"
    try:
        # Track changed fields for audit
        old_data = serializer_class(obj).data
        serializer = serializer_class(obj, data=request.data, partial=partial)
        if serializer.is_valid():
            updated_obj = serializer.save()

            # Determine which fields changed
            new_data = serializer.data
            changed_fields = [
                key for key in new_data
                if key in old_data and old_data[key] != new_data[key]
            ]
            log_update(request.user, updated_obj, changed_fields)

            return Response({"success": True, "data": serializer.data})
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        return Response(
            {"success": False, "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _handle_delete(request, obj):
    """Handle DELETE."""
    try:
        log_delete(request.user, obj)
        obj.delete()
        return Response({"success": True, "data": {"detail": "Deleted successfully."}})
    except Exception as exc:
        return Response(
            {"success": False, "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
