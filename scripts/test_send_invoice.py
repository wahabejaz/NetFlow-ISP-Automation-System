import os
import sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'netflow_backend.settings')
import django
django.setup()
from backend.billing.models import Bill
from backend.billing.services import send_invoice_email

def main():
    count = Bill.objects.count()
    print('Bill count:', count)
    if count:
        bill = Bill.objects.first()
        print('Sending invoice for', bill.invoice_number)
        res = send_invoice_email(bill)
        print('send_invoice_email returned', res)
    else:
        print('No bills found - skipping send')

if __name__ == '__main__':
    main()
