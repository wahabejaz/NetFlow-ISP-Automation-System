from django.core.management.base import BaseCommand
from backend.billing.services import send_due_reminders

class Command(BaseCommand):
    help = 'Send due payment reminder emails for invoices (default: 3 days ahead)'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=3, help='Send reminders for invoices due in N days (inclusive)')

    def handle(self, *args, **options):
        days = options.get('days', 3)
        sent = send_due_reminders(days_ahead=days)
        self.stdout.write(self.style.SUCCESS(f'Sent {sent} reminder emails for bills due in {days} days or earlier.'))
