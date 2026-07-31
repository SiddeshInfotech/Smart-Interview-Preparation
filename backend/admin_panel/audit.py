"""
admin_panel/audit.py — Audit Logging via Django's LogEntry

Leverages Django's built-in admin LogEntry system to track
all create, update, delete, and bulk operations.
"""

import json
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType


def log_action(user, obj, action_flag, message=""):
    """
    Create a LogEntry record for an admin action.

    Args:
        user: The user performing the action
        obj: The model instance being acted upon
        action_flag: ADDITION, CHANGE, or DELETION
        message: Description of the change
    """
    if not user or not user.pk:
        return

    try:
        content_type = ContentType.objects.get_for_model(obj.__class__)
        LogEntry.objects.log_action(
            user_id=user.pk,
            content_type_id=content_type.pk,
            object_id=str(obj.pk),
            object_repr=str(obj)[:200],
            action_flag=action_flag,
            change_message=message if isinstance(message, str) else json.dumps(message),
        )
    except Exception:
        pass  # Don't let logging failures break the API


def log_create(user, obj):
    """Log a record creation."""
    log_action(user, obj, ADDITION, f"Created {obj.__class__.__name__}")


def log_update(user, obj, changed_fields=None):
    """Log a record update with optional list of changed fields."""
    if changed_fields:
        message = json.dumps([{"changed": {"fields": changed_fields}}])
    else:
        message = f"Updated {obj.__class__.__name__}"
    log_action(user, obj, CHANGE, message)


def log_delete(user, obj):
    """Log a record deletion."""
    log_action(user, obj, DELETION, f"Deleted {obj.__class__.__name__}: {str(obj)[:100]}")


def log_bulk_delete(user, model_class, count):
    """Log a bulk deletion operation."""
    # For bulk deletes, we log against a synthetic entry
    try:
        content_type = ContentType.objects.get_for_model(model_class)
        LogEntry.objects.log_action(
            user_id=user.pk,
            content_type_id=content_type.pk,
            object_id="0",
            object_repr=f"Bulk delete: {count} {model_class.__name__} records",
            action_flag=DELETION,
            change_message=f"Bulk deleted {count} records",
        )
    except Exception:
        pass


def get_history(model_class, object_id):
    """
    Get the audit log history for a specific record.

    Returns a list of dicts with action details.
    """
    try:
        content_type = ContentType.objects.get_for_model(model_class)
        entries = LogEntry.objects.filter(
            content_type=content_type,
            object_id=str(object_id),
        ).select_related("user").order_by("-action_time")[:50]

        history = []
        for entry in entries:
            action_labels = {ADDITION: "Created", CHANGE: "Updated", DELETION: "Deleted"}
            history.append({
                "id": entry.pk,
                "action": action_labels.get(entry.action_flag, "Unknown"),
                "action_flag": entry.action_flag,
                "timestamp": entry.action_time.isoformat(),
                "user": entry.user.email if hasattr(entry.user, "email") else str(entry.user),
                "user_id": entry.user.pk,
                "message": entry.get_change_message() or entry.change_message,
                "object_repr": entry.object_repr,
            })
        return history
    except Exception:
        return []


def get_recent_actions(limit=20):
    """
    Get the most recent admin actions across all models.
    Used for the dashboard activity feed.
    """
    try:
        entries = LogEntry.objects.select_related(
            "user", "content_type"
        ).order_by("-action_time")[:limit]

        actions = []
        action_labels = {ADDITION: "Created", CHANGE: "Updated", DELETION: "Deleted"}
        for entry in entries:
            actions.append({
                "id": entry.pk,
                "action": action_labels.get(entry.action_flag, "Unknown"),
                "action_flag": entry.action_flag,
                "timestamp": entry.action_time.isoformat(),
                "user": entry.user.email if hasattr(entry.user, "email") else str(entry.user),
                "model_name": entry.content_type.model if entry.content_type else "unknown",
                "app_label": entry.content_type.app_label if entry.content_type else "unknown",
                "object_repr": entry.object_repr,
                "object_id": entry.object_id,
            })
        return actions
    except Exception:
        return []
