"""
Create Call OS — Multi-Tenant & Sovereign Scoping Module.
Provides SSOT resolution for tenant isolation and targeting across all backend services.
"""

from backend.tenant.scoper import (
    TenantContext,
    apply_tenant_filter,
    get_tenant_context,
    resolve_tenant_context,
)

__all__ = [
    "TenantContext",
    "resolve_tenant_context",
    "get_tenant_context",
    "apply_tenant_filter",
]
