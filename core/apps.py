# community-finance-app/core/apps.py

from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'User Management' # Add this for a nicer name in Django Admin

    def ready(self):
        # Import your signals here so they are registered when Django starts
        import core.signals