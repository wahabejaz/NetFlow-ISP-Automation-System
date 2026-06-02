import os
import logging
from django.core.management import call_command

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "netflow_backend.settings")

logger = logging.getLogger(__name__)

# Get the WSGI application
application = get_wsgi_application()


# Run database migrations on application startup
# This ensures database schema is created in production environments
def run_migrations():
    """Run migrations once when the application starts."""
    try:
        logger.info("Running database migrations on app startup...")
        call_command("migrate", verbosity=0, interactive=False)
        logger.info("✓ Database migrations completed successfully")
    except Exception as e:
        logger.error(f"Migration error on startup: {str(e)}")
        # Don't crash the app - log the error and continue
        # This allows graceful degradation if migrations fail


# Execute migrations on module load (happens once per server startup)
run_migrations()
