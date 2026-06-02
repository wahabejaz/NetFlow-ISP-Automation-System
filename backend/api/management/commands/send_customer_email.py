"""
Management command to send actual invoice emails to a specific customer via Brevo SMTP.

Usage:
    python manage.py send_customer_email <customer_id>
    python manage.py send_customer_email 1                    # Send to customer with ID 1
    python manage.py send_customer_email --customer-email user@example.com  # Send by email

This command helps test real email delivery to actual customers through Brevo:
- Sends actual invoice email to specified customer
- Uses real email templates (invoice_created.txt/html)
- Creates a test invoice if needed
- Reports success/failure with detailed diagnostics
- Perfect for verifying customer receives emails through Brevo
"""
import logging
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
from backend.customers.models import Customer
from backend.billing.models import Bill
from backend.billing.services import send_invoice_email

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send a real invoice email to a specific customer via Brevo SMTP"

    def add_arguments(self, parser):
        parser.add_argument(
            'customer_id',
            type=int,
            nargs='?',
            default=None,
            help='Customer ID to send invoice email to'
        )
        parser.add_argument(
            '--customer-email',
            type=str,
            default=None,
            help='Find customer by email address instead of ID'
        )
        parser.add_argument(
            '--create-invoice',
            action='store_true',
            help='Create a test invoice for the customer before sending'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO("\n=== Send Customer Invoice Email ===\n"))

        # Step 1: Find customer
        customer = self._get_customer(options)
        if not customer:
            raise CommandError("Customer not found. Provide valid customer ID or email.")

        # Step 2: Display customer info
        self._print_customer_info(customer)

        # Step 3: Get or create invoice
        bill = self._get_or_create_invoice(customer, options)
        if not bill:
            raise CommandError("Failed to get or create invoice for customer.")

        # Step 4: Send invoice email
        self.stdout.write("\n📧 Sending invoice email to customer...\n")
        result = send_invoice_email(bill)

        # Step 5: Report result
        self._report_result(result, customer, bill)

    def _get_customer(self, options):
        """Find customer by ID or email."""
        customer_id = options.get('customer_id')
        customer_email = options.get('customer_email')

        try:
            if customer_id:
                self.stdout.write(f"🔍 Looking for customer ID: {customer_id}")
                return Customer.objects.get(id=customer_id)
            elif customer_email:
                self.stdout.write(f"🔍 Looking for customer email: {customer_email}")
                return Customer.objects.get(user__email=customer_email)
            else:
                raise CommandError(
                    "Provide either:\n"
                    "  - Customer ID as argument: python manage.py send_customer_email 1\n"
                    "  - Customer email: python manage.py send_customer_email --customer-email user@example.com"
                )
        except Customer.DoesNotExist:
            return None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error finding customer: {e}"))
            return None

    def _print_customer_info(self, customer):
        """Display customer details."""
        self.stdout.write(self.style.SUCCESS("✓ Customer found:\n"))
        self.stdout.write(f"   ID: {customer.id}")
        self.stdout.write(f"   Name: {customer.user.get_full_name() or customer.user.username}")
        self.stdout.write(f"   Email: {customer.user.email}")
        self.stdout.write(f"   Status: {customer.status if hasattr(customer, 'status') else 'active'}\n")

    def _get_or_create_invoice(self, customer, options):
        """Get an unpaid invoice or create a test one."""
        try:
            # Try to find an unpaid invoice
            unpaid_invoice = Bill.objects.filter(
                customer=customer,
                status__in=['pending', 'due', 'unpaid']
            ).first()

            if unpaid_invoice:
                self.stdout.write(f"📋 Using existing unpaid invoice: {unpaid_invoice.invoice_number}")
                return unpaid_invoice

            # Or create a test invoice if requested
            if options.get('create_invoice'):
                self.stdout.write("📋 Creating test invoice...")
                test_invoice = Bill.objects.create(
                    customer=customer,
                    invoice_number=f"TEST-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    total_amount=1000.00,
                    due_date=timezone.now().date() + timedelta(days=30),
                    status='pending'
                )
                self.stdout.write(f"✓ Created test invoice: {test_invoice.invoice_number}\n")
                return test_invoice

            # If no flag but no unpaid invoices exist
            self.stdout.write(self.style.WARNING(
                "⚠️  No unpaid invoices found. Use --create-invoice to create a test invoice.\n"
            ))
            return None

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error getting/creating invoice: {e}"))
            logger.exception("Error in _get_or_create_invoice")
            return None

    def _report_result(self, result, customer, bill):
        """Report the email send result."""
        if result.get('sent'):
            self.stdout.write(self.style.SUCCESS(
                f"\n✅ SUCCESS!\n"
                f"   Invoice email sent to: {customer.user.email}\n"
                f"   Invoice: {bill.invoice_number}\n"
                f"   Amount: {bill.total_amount} PKR\n"
                f"   Customer should receive the email in their inbox within 1-5 minutes via Brevo SMTP.\n"
            ))
            logger.info(
                "Invoice %s successfully sent to customer %s (%s)",
                bill.invoice_number,
                customer.id,
                customer.user.email
            )
        else:
            reason = result.get('reason', 'Unknown error')
            self.stdout.write(self.style.ERROR(
                f"\n❌ FAILED!\n"
                f"   Invoice: {bill.invoice_number}\n"
                f"   Customer: {customer.user.email}\n"
                f"   Reason: {reason}\n"
            ))
            logger.error(
                "Failed to send invoice %s to customer %s (%s): %s",
                bill.invoice_number,
                customer.id,
                customer.user.email,
                reason
            )

        self.stdout.write("\n📊 Tips for troubleshooting:\n")
        self.stdout.write("   1. Check Brevo Dashboard → Statistics for delivery confirmation\n")
        self.stdout.write("   2. Check customer's spam/junk folder\n")
        self.stdout.write("   3. Run: python manage.py test_email (to verify Brevo config)\n")
        self.stdout.write("   4. Check application logs for SMTP errors\n")
