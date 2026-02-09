from django.apps import AppConfig


class OdooIntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'odoo_integration'
    verbose_name = 'Odoo POS Integration'

    def ready(self):
        """
        Import signal handlers when app is ready.

        This ensures that signal handlers are registered and will
        automatically trigger when orders are confirmed.
        """
        import odoo_integration.signals  # noqa: F401
