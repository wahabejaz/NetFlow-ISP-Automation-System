"""
Management command to run Django migrations safely on startup.
This ensures the database schema is created even in production environments
where release commands may not execute (e.g., Vercel).
"""
import logging
from django.core.management import call_command
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run migrations safely on application startup"

    def handle(self, *args, **options):
        try:
            self.stdout.write("Running database migrations...")
            call_command("migrate", verbosity=2)
            self.stdout.write(
                self.style.SUCCESS("✓ Database migrations completed successfully")
            )
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f"✗ Migration failed: {str(e)}")
            )
            # Don't raise - allow app to continue even if migrations fail
            # This prevents permanent crashes in production
