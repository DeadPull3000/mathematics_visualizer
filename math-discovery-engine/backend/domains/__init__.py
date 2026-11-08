"""Domains module packaging and registry re-exports."""

from .registry import DomainManifest, DomainRegistry, domain_registry

__all__ = ["DomainManifest", "DomainRegistry", "domain_registry"]
