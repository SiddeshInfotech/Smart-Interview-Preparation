"""
admin_panel/dynamic_serializers.py — Dynamic Serializer Factory

Generates ModelSerializer classes on-the-fly for any discovered Django model.
Handles FK display values, password hashing, file uploads, and readonly fields.
"""

from rest_framework import serializers
from django.db import models
from django.contrib.auth import get_user_model

from .discovery import get_model_fields, get_select_related_fields

# Cache generated serializer classes
_serializer_cache = {}


def _get_fk_display_method(field_name, related_model):
    """
    Create a SerializerMethodField getter that returns
    a human-readable representation of a FK related object.
    """
    def getter(self, obj):
        try:
            related_obj = getattr(obj, field_name, None)
            if related_obj is None:
                return None
            # Try common display patterns
            if hasattr(related_obj, "email"):
                return str(related_obj.email)
            if hasattr(related_obj, "full_name"):
                return str(related_obj.full_name)
            if hasattr(related_obj, "name"):
                return str(related_obj.name)
            return str(related_obj)
        except Exception:
            return None
    return getter


def build_serializer_class(model, include_display_fields=True):
    """
    Dynamically build a ModelSerializer class for the given model.

    Features:
    - Includes all fields via fields = '__all__'
    - Adds _display SerializerMethodFields for FK/O2O relations
    - Marks auto_now/auto_now_add fields as read_only
    - Special handling for User model (password hashing)
    """
    cache_key = f"{model._meta.app_label}.{model._meta.model_name}"
    if cache_key in _serializer_cache:
        return _serializer_cache[cache_key]

    meta = model._meta
    User = get_user_model()

    # Determine read-only fields
    readonly_fields = []
    for field in meta.get_fields():
        if not hasattr(field, "column") and not isinstance(field, models.ManyToManyField):
            continue
        if getattr(field, "primary_key", False):
            readonly_fields.append(field.name)
        if hasattr(field, "auto_now") and field.auto_now:
            readonly_fields.append(field.name)
        if hasattr(field, "auto_now_add") and field.auto_now_add:
            readonly_fields.append(field.name)

    # Build extra method fields for FK display values
    extra_fields = {}
    extra_field_names = []

    if include_display_fields:
        for field in meta.get_fields():
            if isinstance(field, (models.ForeignKey, models.OneToOneField)) and hasattr(field, "column"):
                display_name = f"{field.name}_display"
                extra_fields[display_name] = serializers.SerializerMethodField()
                extra_field_names.append(display_name)
                # Dynamically create the get_<display_name> method
                method_name = f"get_{display_name}"
                extra_fields[method_name] = _get_fk_display_method(field.name, field.related_model)

    # Build Meta class
    meta_attrs = {
        "model": model,
        "fields": "__all__",
        "read_only_fields": readonly_fields,
    }

    # Special handling for password fields on User model
    if model == User:
        meta_attrs["extra_kwargs"] = {
            "password": {"write_only": True, "required": False},
        }

    Meta = type("Meta", (), meta_attrs)

    # Build serializer class attributes
    attrs = {"Meta": Meta}

    # Add display fields
    for name, field_or_method in extra_fields.items():
        if isinstance(field_or_method, serializers.SerializerMethodField):
            attrs[name] = field_or_method
        else:
            attrs[name] = field_or_method

    # Separate method fields — need to be set as proper methods
    for field in meta.get_fields():
        if isinstance(field, (models.ForeignKey, models.OneToOneField)) and hasattr(field, "column"):
            display_name = f"{field.name}_display"
            method_name = f"get_{display_name}"
            attrs[method_name] = _get_fk_display_method(field.name, field.related_model)

    # Custom create/update for User model (password hashing and M2M handling)
    if model == User:
        def create_user(self, validated_data):
            password = self.initial_data.get("password")
            m2m_data = {}
            for attr in list(validated_data.keys()):
                field_obj = getattr(User, attr, None)
                if field_obj and isinstance(field_obj, models.fields.related_descriptors.ManyToManyDescriptor):
                    m2m_data[attr] = validated_data.pop(attr)

            user = model(**validated_data)
            if password:
                user.set_password(password)
            else:
                user.set_unusable_password()
            user.save()

            for attr, value in m2m_data.items():
                field_manager = getattr(user, attr, None)
                if field_manager and hasattr(field_manager, "set"):
                    field_manager.set(value)
            return user

        def update_user(self, instance, validated_data):
            password = self.initial_data.get("password")
            m2m_data = {}
            for attr, value in validated_data.items():
                field_val = getattr(instance, attr, None)
                if hasattr(field_val, "set") and hasattr(field_val, "all"):
                    m2m_data[attr] = value
                else:
                    try:
                        setattr(instance, attr, value)
                    except TypeError as e:
                        if "many-to-many" in str(e).lower():
                            m2m_data[attr] = value
                        else:
                            raise e

            if password:
                instance.set_password(password)
            instance.save()

            for attr, value in m2m_data.items():
                field_manager = getattr(instance, attr, None)
                if field_manager and hasattr(field_manager, "set"):
                    field_manager.set(value)
            return instance

        attrs["create"] = create_user
        attrs["update"] = update_user

    # Generate class name
    class_name = f"Dynamic{model.__name__}Serializer"

    # Create and cache the serializer class
    serializer_class = type(class_name, (serializers.ModelSerializer,), attrs)
    _serializer_cache[cache_key] = serializer_class
    return serializer_class


def build_list_serializer_class(model):
    """
    Build a lightweight serializer for list views.
    Same as the full serializer but useful for future optimization
    (e.g., excluding large text fields from list responses).
    """
    return build_serializer_class(model, include_display_fields=True)


def get_fk_options(model, field_name, search_query=None, limit=50):
    """
    Fetch available options for a ForeignKey field.
    Returns list of {value: pk, label: str(obj)} dicts.
    Used for dropdown/autocomplete in forms.
    """
    try:
        field = model._meta.get_field(field_name)
    except Exception:
        return []

    if not isinstance(field, (models.ForeignKey, models.OneToOneField)):
        return []

    related_model = field.related_model
    qs = related_model.objects.all()

    # Apply search filter if provided
    if search_query:
        from django.db.models import Q
        search_lookups = Q()
        for f in related_model._meta.get_fields():
            if isinstance(f, (models.CharField, models.TextField, models.EmailField)) and hasattr(f, "column"):
                search_lookups |= Q(**{f"{f.name}__icontains": search_query})
        if search_lookups:
            qs = qs.filter(search_lookups)

    qs = qs[:limit]
    pk_name = related_model._meta.pk.name if related_model._meta.pk else "pk"

    options = []
    for obj in qs:
        options.append({
            "value": getattr(obj, pk_name),
            "label": str(obj),
        })
    return options


def clear_serializer_cache():
    """Clear the serializer class cache (useful for testing)."""
    _serializer_cache.clear()
