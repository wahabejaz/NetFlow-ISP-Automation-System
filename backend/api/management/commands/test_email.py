"""
Management command to test SMTP email configuration and connectivity.

Usage:
    python manage.py test_email [--recipient user@example.com]
    python manage.py test_email  # Uses DEFAULT_FROM_EMAIL as recipient

This command helps diagnose email delivery issues by:
- Checking SMTP credentials
- Attempting SMTP connection
- Sending a test email
- Reporting success/failure with detailed diagnostics
"""
import logging
from django.core.management.base import BaseCommand, CommandError
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Test SMTP email configuration and send a test email"

    def add_arguments(self, parser):
        parser.add_argument(
            '--recipient',
            type=str,
            default=None,
            help='Email recipient for test message (defaults to DEFAULT_FROM_EMAIL)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO("\n=== Email Configuration Test ===\n"))

        # Step 1: Check configuration
        self.stdout.write("📋 Checking email configuration...\n")
        
        config_checks = self._check_config()
        if not config_checks["valid"]:
            self.stdout.write(
                self.style.ERROR(f"❌ Configuration Error: {config_checks['error']}")
            )
            raise CommandError(config_checks["error"])

        self._print_config_summary()

        # Step 2: Test SMTP connection
        self.stdout.write("\n🔗 Testing SMTP connection...\n")
        connection_ok = self._test_connection()
        if not connection_ok:
            raise CommandError("SMTP connection failed")

        # Step 3: Send test email
        self.stdout.write("\n📧 Sending test email...\n")
        recipient = options.get('recipient') or self._extract_email_from_sender()
        
        if not recipient:
            raise CommandError(
                "No recipient specified and cannot extract from DEFAULT_FROM_EMAIL. "
                "Use --recipient user@example.com"
            )

        self.stdout.write(f"   To: {recipient}")
        
        send_ok = self._send_test_email(recipient)
        if not send_ok:
            raise CommandError("Email send failed")

        self.stdout.write(
            self.style.SUCCESS("\n✅ All tests passed! Email system is working correctly.\n")
        )

    def _check_config(self):
        """Check if SMTP credentials are configured."""
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            return {
                "valid": False,
                "error": (
                    "SMTP credentials not configured. "
                    "Set BREVO_SMTP_USER + BREVO_SMTP_PASSWORD "
                    "or EMAIL_HOST_USER + EMAIL_HOST_PASSWORD"
                ),
            }
        return {"valid": True}

    def _print_config_summary(self):
        """Display current email configuration (without exposing credentials)."""
        self.stdout.write(f"   SMTP Host: {settings.EMAIL_HOST}")
        self.stdout.write(f"   SMTP Port: {settings.EMAIL_PORT}")
        self.stdout.write(f"   TLS Enabled: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"   SSL Enabled: {getattr(settings, 'EMAIL_USE_SSL', False)}")
        self.stdout.write(f"   From Address: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"   Email Backend: {settings.EMAIL_BACKEND}")

    def _test_connection(self):
        """Test SMTP connection."""
        try:
            from django.core.mail import get_connection
            connection = get_connection()
            connection.open()
            self.stdout.write(
                self.style.SUCCESS(f"   ✓ Connected to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
            )
            connection.close()
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"   ✗ Connection failed: {type(e).__name__}: {str(e)}")
            )
            logger.exception("SMTP connection test failed")
            return False

    def _extract_email_from_sender(self):
        """Extract email address from DEFAULT_FROM_EMAIL string."""
        sender = settings.DEFAULT_FROM_EMAIL
        if "<" in sender and ">" in sender:
            start = sender.find("<") + 1
            end = sender.find(">")
            if end > start:
                return sender[start:end]
        return None

    def _send_test_email(self, recipient):
        """Send a test email."""
        try:
            subject = "NetFlow ISP - Email Configuration Test"
            text_body = (
                "This is a test email from your NetFlow ISP Automation System.\n\n"
                "If you received this, your email configuration is working correctly.\n"
                f"\nTest sent at: {__import__('django.utils.timezone', fromlist=['now']).now().isoformat()}\n"
                f"From: {settings.DEFAULT_FROM_EMAIL}\n"
                f"SMTP Host: {settings.EMAIL_HOST}\n"
            )
            html_body = (
                "<html><body>"
                "<h2>NetFlow ISP - Email Configuration Test</h2>"
                "<p>This is a test email from your NetFlow ISP Automation System.</p>"
                "<p>If you received this, your email configuration is working correctly.</p>"
                f"<p><small>Test sent at: {__import__('django.utils.timezone', fromlist=['now']).now().isoformat()}</small></p>"
                "</body></html>"
            )

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)

            self.stdout.write(
                self.style.SUCCESS(f"   ✓ Test email sent successfully to {recipient}")
            )
            logger.info("Test email sent successfully to %s", recipient)
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"   ✗ Send failed: {type(e).__name__}: {str(e)}")
            )
            logger.exception("Test email send failed")
            return False
