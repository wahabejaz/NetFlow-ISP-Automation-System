from datetime import date

from django.contrib.auth import authenticate
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from backend.accounts.models import CustomUser
from backend.api.services import ensure_seed_data
from backend.complaints.models import Complaint
from backend.customers.models import Customer
from backend.packages.models import Package
from backend.technicians.models import Technician


class ApiPermissionTests(APITestCase):
    def setUp(self):
        self.package = Package.objects.create(
            name="Standard",
            speed_mbps=25,
            monthly_price=2200,
            installation_fee=0,
            description="Standard package",
            is_active=True,
            is_most_popular=True,
        )

        self.admin = CustomUser.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
            role="admin",
        )
        self.customer = CustomUser.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password="customerpass123",
            first_name="Customer",
            last_name="User",
            role="customer",
        )
        self.technician = CustomUser.objects.create_user(
            username="technician@example.com",
            email="technician@example.com",
            password="technicianpass123",
            first_name="Tech",
            last_name="User",
            role="technician",
        )

        Customer.objects.create(
            user=self.customer,
            father_name="Customer",
            cnic="35202-1000001-1",
            date_of_birth=date(1995, 1, 1),
            gender="male",
            area="DHA Phase 4",
            address="DHA Phase 4",
            city="Lahore",
            package=self.package,
            status="active",
        )

        Technician.objects.create(
            user=self.technician,
            area="DHA Phase 4",
            status="available",
        )

        self.admin_token = Token.objects.create(user=self.admin)
        self.customer_token = Token.objects.create(user=self.customer)
        self.technician_token = Token.objects.create(user=self.technician)

    def authenticate(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_login_still_works(self):
        response = self.client.post(
            reverse("login"),
            {"email": "admin@example.com", "password": "adminpass123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], "admin")

    def test_seed_data_creates_admin_and_default_packages(self):
        Package.objects.all().delete()
        CustomUser.objects.filter(username="admin@netflow.com").delete()

        ensure_seed_data()

        self.assertIsNotNone(authenticate(username="admin@netflow.com", password="admin123"))
        self.assertEqual(Package.objects.filter(name__in=["Basic", "Standard", "Premium"]).count(), 3)

    def test_dashboard_requires_authentication(self):
        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 401)

    def test_dashboard_rejects_customer(self):
        self.authenticate(self.customer_token)

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 403)

    def test_dashboard_allows_admin(self):
        self.authenticate(self.admin_token)

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 200)

    def test_settings_require_admin(self):
        self.authenticate(self.customer_token)

        response = self.client.get(reverse("settings"))

        self.assertEqual(response.status_code, 403)

    def test_customer_can_access_own_customer_record(self):
        self.authenticate(self.customer_token)

        response = self.client.get(reverse("customer-detail", kwargs={"pk": self.customer.customer_profile.id}))

        self.assertEqual(response.status_code, 200)

    def test_technician_cannot_access_admin_dashboard(self):
        self.authenticate(self.technician_token)

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 403)

    def test_admin_can_mark_invoice_as_paid(self):
        bill = self.customer.customer_profile.bills.create(
            invoice_number="INV-1001",
            customer=self.customer.customer_profile,
            package=self.package,
            bill_month=date(2026, 5, 1),
            amount=2200,
            tax_amount=352,
            total_amount=2552,
            due_date=date(2026, 5, 20),
            status="unpaid",
        )

        self.authenticate(self.admin_token)

        response = self.client.patch(
            reverse("invoice-detail", kwargs={"pk": bill.id}),
            {"status": "Paid", "method": "Card"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        bill.refresh_from_db()
        self.assertEqual(bill.status, "paid")

    def test_admin_can_update_ticket_status_and_assign_technician_by_email(self):
        customer = Customer.objects.get(user=self.customer)
        technician = Technician.objects.get(user=self.technician)
        complaint = Complaint.objects.create(
            ticket_number="CMP-9999",
            customer=customer,
            description="Internet is slow after router reboot.",
            issue_since="Today",
            ai_category="speed_issue",
            ai_priority="medium",
            status="submitted",
        )

        self.authenticate(self.admin_token)

        response = self.client.patch(
            reverse("ticket-detail", kwargs={"pk": complaint.id}),
            {"status": "In Progress", "assignedTechnician": self.technician.email},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "In Progress")
        self.assertEqual(response.data["assignedTechnician"], self.technician.get_full_name())

        complaint.refresh_from_db()
        self.assertEqual(complaint.status, "in_progress")
        self.assertEqual(complaint.assigned_technician_id, technician.id)

    def test_technician_only_sees_assigned_complaints(self):
        customer = Customer.objects.get(user=self.customer)
        technician = Technician.objects.get(user=self.technician)
        complaint = Complaint.objects.create(
            ticket_number="CMP-1000",
            customer=customer,
            description="Connection drops during rain.",
            issue_since="Today",
            ai_category="outage",
            ai_priority="urgent",
            status="assigned",
            assigned_technician=technician,
        )

        self.authenticate(self.technician_token)

        response = self.client.get(reverse("tickets"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(complaint.id))
        self.assertEqual(response.data[0]["status"], "Assigned")

    def test_admin_can_create_customer_with_package_name(self):
        self.authenticate(self.admin_token)

        response = self.client.post(
            reverse("customers"),
            {
                "fullName": "Jane Doe",
                "fatherName": "John Doe",
                "cnic": "35202-1000004-4",
                "phone": "3001234567",
                "email": "jane@example.com",
                "dob": "1998-01-01",
                "gender": "female",
                "area": "DHA Phase 4",
                "city": "Lahore",
                "street": "Street 1",
                "packageId": "Standard",
                "status": "Active",
                "password": "janepass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["packageId"], "standard")
        self.assertTrue(Customer.objects.filter(user__email="jane@example.com").exists())

    def test_admin_can_deactivate_package_without_orphaning_customer_package(self):
        self.authenticate(self.admin_token)

        response = self.client.delete(reverse("package-detail", kwargs={"pk": self.package.id}))
        self.assertEqual(response.status_code, 204)

        self.package.refresh_from_db()
        self.assertFalse(self.package.is_active)

        customer = Customer.objects.get(user=self.customer)
        self.assertIsNotNone(customer.package)
        self.assertEqual(customer.package.id, self.package.id)

        response = self.client.get(reverse("packages"))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(any(pkg["id"] == str(self.package.id) for pkg in response.data))

    def test_admin_cannot_create_customer_with_deactivated_package(self):
        self.authenticate(self.admin_token)

        response = self.client.delete(reverse("package-detail", kwargs={"pk": self.package.id}))
        self.assertEqual(response.status_code, 204)

        response = self.client.post(
            reverse("customers"),
            {
                "fullName": "Jane Doe",
                "fatherName": "John Doe",
                "cnic": "35202-1000004-4",
                "phone": "3001234567",
                "email": "jane@example.com",
                "dob": "1998-01-01",
                "gender": "female",
                "area": "DHA Phase 4",
                "city": "Lahore",
                "street": "Street 1",
                "packageId": "Standard",
                "status": "Active",
                "password": "janepass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Package not found.")

    def test_admin_can_upload_customer_photo_and_return_photo_url(self):
        self.authenticate(self.admin_token)

        photo = SimpleUploadedFile(
            "customer-photo.png",
            b"fake-image-bytes",
            content_type="image/png",
        )

        response = self.client.post(
            reverse("customers"),
            {
                "fullName": "Photo User",
                "fatherName": "Photo Parent",
                "cnic": "35202-1000005-5",
                "phone": "3001234568",
                "email": "photo@example.com",
                "dob": "1999-02-02",
                "gender": "male",
                "area": "Bahria Town",
                "city": "Islamabad",
                "street": "Street 2",
                "packageId": "Standard",
                "status": "Active",
                "password": "photopass123",
                "photo": photo,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["photo"])
        self.assertTrue(Customer.objects.filter(user__email="photo@example.com").exists())

    def test_authenticated_users_can_fetch_available_areas(self):
        self.authenticate(self.admin_token)

        response = self.client.get(reverse("areas"))

        self.assertEqual(response.status_code, 200)
        self.assertIn("areas", response.data)
        self.assertIn("cities", response.data)
        self.assertIn("DHA Phase 4", response.data["areas"])
