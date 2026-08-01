"""
admin_panel/discovery.py — Dynamic Model Discovery Service

Auto-discovers all Django models registered with admin.site and extracts
complete field metadata for dynamic serializer/view generation.
"""

from django.apps import apps
from django.contrib import admin
from django.db import models
from django.contrib.auth import get_user_model
from functools import lru_cache


# ── Field type mapping ──────────────────────────────────────────
FIELD_TYPE_MAP = {
    models.AutoField: "auto",
    models.BigAutoField: "auto",
    models.SmallAutoField: "auto",
    models.CharField: "string",
    models.TextField: "text",
    models.IntegerField: "integer",
    models.SmallIntegerField: "integer",
    models.BigIntegerField: "integer",
    models.PositiveIntegerField: "integer",
    models.PositiveSmallIntegerField: "integer",
    models.PositiveBigIntegerField: "integer",
    models.FloatField: "float",
    models.DecimalField: "decimal",
    models.BooleanField: "boolean",
    models.NullBooleanField: "boolean",
    models.DateField: "date",
    models.DateTimeField: "datetime",
    models.TimeField: "time",
    models.EmailField: "email",
    models.URLField: "url",
    models.UUIDField: "uuid",
    models.FileField: "file",
    models.ImageField: "image",
    models.FilePathField: "filepath",
    models.JSONField: "json",
    models.BinaryField: "binary",
    models.DurationField: "duration",
    models.GenericIPAddressField: "ip",
    models.IPAddressField: "ip",
    models.SlugField: "slug",
    models.ForeignKey: "foreignkey",
    models.OneToOneField: "onetoone",
    models.ManyToManyField: "manytomany",
}


def _get_field_type(field):
    """Map a Django field instance to a UI-friendly type string."""
    for field_class, type_name in FIELD_TYPE_MAP.items():
        if isinstance(field, field_class):
            return type_name
    return "string"


def _get_field_info(field):
    """Extract comprehensive metadata from a single Django model field."""
    info = {
        "name": field.name,
        "type": _get_field_type(field),
        "verbose_name": str(field.verbose_name).capitalize() if hasattr(field, "verbose_name") else field.name,
        "required": not field.blank if hasattr(field, "blank") else True,
        "readonly": False,
        "editable": getattr(field, "editable", True),
        "help_text": str(field.help_text) if hasattr(field, "help_text") and field.help_text else "",
        "max_length": getattr(field, "max_length", None),
        "choices": None,
        "default": None,
        "nullable": getattr(field, "null", False),
        "is_primary_key": getattr(field, "primary_key", False),
        "unique": getattr(field, "unique", False),
    }

    # Primary key fields are always readonly
    if info["is_primary_key"]:
        info["readonly"] = True

    # auto_now / auto_now_add fields are readonly
    if hasattr(field, "auto_now") and field.auto_now:
        info["readonly"] = True
    if hasattr(field, "auto_now_add") and field.auto_now_add:
        info["readonly"] = True

    # Choices
    if hasattr(field, "choices") and field.choices:
        try:
            info["choices"] = [
                {"value": c[0], "label": str(c[1])} for c in field.choices
            ]
        except (TypeError, IndexError):
            info["choices"] = None

    # Default value
    if hasattr(field, "default") and field.default is not models.NOT_PROVIDED:
        default = field.default
        if callable(default):
            info["default"] = None  # Can't serialize callables
        else:
            try:
                # Ensure it's JSON-serializable
                import json
                json.dumps(default)
                info["default"] = default
            except (TypeError, ValueError):
                info["default"] = str(default)

    # Decimal field specifics
    if isinstance(field, models.DecimalField):
        info["max_digits"] = field.max_digits
        info["decimal_places"] = field.decimal_places

    # Relation fields
    if isinstance(field, (models.ForeignKey, models.OneToOneField)):
        related_model = field.related_model
        info["related_model"] = {
            "app_label": related_model._meta.app_label,
            "model_name": related_model._meta.model_name,
            "verbose_name": str(related_model._meta.verbose_name).capitalize(),
        }
        info["related_name"] = field.remote_field.related_name or ""

    if isinstance(field, models.ManyToManyField):
        related_model = field.related_model
        info["related_model"] = {
            "app_label": related_model._meta.app_label,
            "model_name": related_model._meta.model_name,
            "verbose_name": str(related_model._meta.verbose_name).capitalize(),
        }

    return info


def get_model_fields(model):
    """Get all field metadata for a given model."""
    fields = []
    for field in model._meta.get_fields():
        # Exclude Django auth M2M fields (groups and user_permissions)
        if field.name in ("groups", "user_permissions"):
            continue
        # Skip reverse relations (they don't have a column)
        if hasattr(field, "field"):  # This is a reverse relation
            continue
        # Skip auto-created M2M through models
        if hasattr(field, "m2m_field_name") and not hasattr(field, "verbose_name"):
            continue
        # Some reverse relations show up as ManyToManyRel/ManyToOneRel
        if not hasattr(field, "column") and not isinstance(field, models.ManyToManyField):
            continue
        try:
            fields.append(_get_field_info(field))
        except Exception:
            continue
    return fields


def get_model_admin_config(model):
    """Extract configuration from the model's ModelAdmin (if registered)."""
    model_admin = admin.site._registry.get(model)
    config = {
        "list_display": [],
        "search_fields": [],
        "list_filter": [],
        "readonly_fields": [],
        "ordering": [],
    }

    if model_admin:
        admin_instance = model_admin

        if hasattr(admin_instance, "list_display") and admin_instance.list_display != ("__str__",):
            config["list_display"] = list(admin_instance.list_display)
        if hasattr(admin_instance, "search_fields"):
            config["search_fields"] = list(admin_instance.search_fields)
        if hasattr(admin_instance, "list_filter"):
            config["list_filter"] = list(admin_instance.list_filter)
        if hasattr(admin_instance, "readonly_fields"):
            config["readonly_fields"] = list(admin_instance.readonly_fields)
        if hasattr(admin_instance, "ordering") and admin_instance.ordering:
            config["ordering"] = list(admin_instance.ordering)

    return config


def get_pk_field_name(model):
    """Get the name of the primary key field for a model."""
    return model._meta.pk.name if model._meta.pk else "pk"


# ── App label display name mapping ──────────────────────────────
APP_DISPLAY_NAMES = {
    "authentication": "Authentication",
    "candidate": "Candidates",
    "interviewer": "Interviewers",
    "interview": "Interviews & Feedback",
    "feedback": "User Feedback",
    "common": "Common",
    "resume": "Resumes",
    "quiz": "Quiz",
    "coding": "Coding",
    "notifications": "Notifications",
    "admin_panel": "Admin Panel",
    "auth": "Django Auth",
    "token_blacklist": "Token Blacklist",
}

# Group ordering (lower = higher in sidebar)
APP_GROUP_ORDER = {
    "authentication": 1,
    "candidate": 2,
    "interviewer": 3,
    "interview": 4,
    "feedback": 5,
    "quiz": 6,
    "coding": 7,
    "resume": 8,
    "common": 9,
    "notifications": 10,
    "admin_panel": 99,
}


def discover_models():
    """
    Discover all models registered with Django admin.

    Returns a list of dicts, each containing:
      - app_label, model_name, verbose_name, verbose_name_plural
      - fields: list of field metadata dicts
      - admin_config: list_display, search_fields, etc.
      - pk_field: name of the primary key field
    """
    discovered = []
    registered_models = set(admin.site._registry.keys())

    for model in registered_models:
        meta = model._meta
        # Skip proxy models, abstract models, and standalone Group/Permission models
        if meta.proxy or meta.abstract or meta.model_name in ("group", "permission"):
            continue

        fields = get_model_fields(model)
        admin_config = get_model_admin_config(model)
        pk_field = get_pk_field_name(model)

        # Mark readonly fields from admin config
        readonly_set = set(admin_config.get("readonly_fields", []))
        for f in fields:
            if f["name"] in readonly_set:
                f["readonly"] = True

        discovered.append({
            "app_label": meta.app_label,
            "model_name": meta.model_name,
            "verbose_name": str(meta.verbose_name).capitalize(),
            "verbose_name_plural": str(meta.verbose_name_plural).capitalize(),
            "db_table": meta.db_table,
            "pk_field": pk_field,
            "fields": fields,
            "admin_config": admin_config,
            "is_managed": meta.managed,
        })

    # Sort by app group order, then by model name
    discovered.sort(key=lambda m: (
        APP_GROUP_ORDER.get(m["app_label"], 50),
        m["verbose_name"],
    ))

    return discovered


def get_models_grouped():
    """
    Returns discovered models grouped by app_label.

    {
        "authentication": {
            "display_name": "Authentication",
            "models": [ ... ]
        },
        ...
    }
    """
    models_list = discover_models()
    grouped = {}

    for model_info in models_list:
        app = model_info["app_label"]
        if app not in grouped:
            grouped[app] = {
                "display_name": APP_DISPLAY_NAMES.get(app, app.replace("_", " ").title()),
                "order": APP_GROUP_ORDER.get(app, 50),
                "models": [],
            }
        grouped[app]["models"].append(model_info)

    # Convert to sorted list of groups
    groups = []
    for app_label, group_data in grouped.items():
        groups.append({
            "app_label": app_label,
            "display_name": group_data["display_name"],
            "order": group_data["order"],
            "models": group_data["models"],
        })
    groups.sort(key=lambda g: g["order"])
    return groups


def get_model_by_name(app_label, model_name):
    """Look up a Django model class by app_label and model_name."""
    try:
        model = apps.get_model(app_label, model_name)
        # Verify it's registered with admin
        if model in admin.site._registry:
            return model
    except LookupError:
        pass
    return None


def get_searchable_fields(model):
    """
    Get fields suitable for text search.
    Returns CharField/TextField/EmailField names.
    """
    searchable = []
    # First try admin search_fields
    model_admin = admin.site._registry.get(model)
    if model_admin and hasattr(model_admin, "search_fields") and model_admin.search_fields:
        return list(model_admin.search_fields)

    # Fallback: auto-detect text fields
    for field in model._meta.get_fields():
        if hasattr(field, "column") and isinstance(
            field, (models.CharField, models.TextField, models.EmailField)
        ):
            searchable.append(field.name)
    return searchable[:5]  # Limit to 5 fields for performance


def get_filterable_fields(model):
    """Get fields suitable for filtering (choices, booleans, FKs)."""
    filterable = []

    # First try admin list_filter
    model_admin = admin.site._registry.get(model)
    if model_admin and hasattr(model_admin, "list_filter") and model_admin.list_filter:
        return list(model_admin.list_filter)

    for field in model._meta.get_fields():
        if not hasattr(field, "column"):
            continue
        if isinstance(field, models.BooleanField):
            filterable.append(field.name)
        elif hasattr(field, "choices") and field.choices:
            filterable.append(field.name)
    return filterable


def get_select_related_fields(model):
    """Get ForeignKey and OneToOneField names for select_related()."""
    related = []
    for field in model._meta.get_fields():
        if isinstance(field, (models.ForeignKey, models.OneToOneField)) and hasattr(field, "column"):
            related.append(field.name)
    return related


def get_prefetch_related_fields(model):
    """Get ManyToManyField names for prefetch_related()."""
    prefetch = []
    for field in model._meta.get_fields():
        if isinstance(field, models.ManyToManyField):
            prefetch.append(field.name)
    return prefetch
