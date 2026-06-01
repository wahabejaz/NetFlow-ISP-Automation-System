from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow only authenticated admin users."""

    message = "Admin access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "admin")


class IsCustomerUser(BasePermission):
    """Allow only authenticated customer users."""

    message = "Customer access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "customer")


class IsTechnicianUser(BasePermission):
    """Allow only authenticated technician users."""

    message = "Technician access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "technician")
