from .utils_auditoria import set_audit_context


class AuditContextMixin:
    def create(self, request, *args, **kwargs):
        set_audit_context(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        set_audit_context(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        set_audit_context(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        set_audit_context(request)
        return super().destroy(request, *args, **kwargs)