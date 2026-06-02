import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file()

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Production-ready ALLOWED_HOSTS
if DEBUG:
    ALLOWED_HOSTS = ["127.0.0.1", "localhost", "*"]
else:
    ALLOWED_HOSTS = [
        "127.0.0.1",
        "localhost",
        os.environ.get("RENDER_EXTERNAL_HOSTNAME", ""),
        "isp-backend.onrender.com",  # Replace with your Render subdomain
    ]
    ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]  # Remove empty strings

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "backend.accounts",
    "backend.audit",
    "backend.billing",
    "backend.complaints",
    "backend.customer_portal",
    "backend.customers",
    "backend.dashboard",
    "backend.notifications",
    "backend.packages",
    "backend.technicians",
    "backend.api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "netflow_backend.csrf_exempt.CsrfExemptApiMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "netflow_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "backend" / "templates", BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "netflow_backend.wsgi.application"

DB_NAME = os.environ.get("DB_NAME", "defaultdb")
DB_USER = os.environ.get("DB_USER", "avnadmin")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "3306")

# Validate critical DB credentials in production
if not DEBUG and not DB_PASSWORD:
    import warnings
    warnings.warn("DB_PASSWORD environment variable not set. Database connection will fail.", RuntimeWarning)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": int(DB_PORT),
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            "charset": "utf8mb4",
            "autocommit": True,
            "ssl": {
                "ca": None,
            },
        },
        "CONN_MAX_AGE": 60,
        "ATOMIC_REQUESTS": True,
    }
}

AUTH_USER_MODEL = "accounts.CustomUser"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only allow all origins in development
CORS_ALLOW_CREDENTIALS = True

if not DEBUG:
    # Production CORS settings - restrict to your frontend URL on Vercel
    CORS_ALLOWED_ORIGINS = [
        "https://net-flow-isp-automation-system.vercel.app",
        os.environ.get("FRONTEND_URL", "https://net-flow-isp-automation-system.vercel.app"),
        "http://localhost:3000",  # Keep for local development
    ]
    CORS_ALLOWED_ORIGINS = [url for url in CORS_ALLOWED_ORIGINS if url]  # Remove duplicates/empty
    CSRF_TRUSTED_ORIGINS = [
        "https://net-flow-isp-automation-system.vercel.app",
        os.environ.get("FRONTEND_URL", "https://net-flow-isp-automation-system.vercel.app"),
        "http://localhost:3000",
    ]
    CSRF_TRUSTED_ORIGINS = [url for url in CSRF_TRUSTED_ORIGINS if url]  # Remove duplicates/empty
    # Security settings for production
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        "default-src": ("'self'",),
    }

# Email configuration (reads from environment; sensible defaults provided)
# By default in development (DEBUG=True) the console backend is used so emails
# are printed to the terminal. In production (DEBUG=False) the SMTP backend
# will be used by default. All credentials are read from environment variables
# and never hard-coded.
# Determine EMAIL_BACKEND:
# Priority: explicit EMAIL_BACKEND env > SMTP if credentials present > console when DEBUG else SMTP
explicit_backend = os.environ.get("EMAIL_BACKEND")
if explicit_backend:
    EMAIL_BACKEND = explicit_backend
else:
    # If SMTP credentials are provided, prefer SMTP even during development
    if os.environ.get("EMAIL_HOST_USER") and os.environ.get("EMAIL_HOST_PASSWORD"):
        EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    else:
        EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend"

# SMTP configuration: supports Brevo (production) or localhost (development)
# Priority for credentials:
#   1. Explicit EMAIL_HOST_USER / EMAIL_HOST_PASSWORD
#   2. Brevo-specific BREVO_SMTP_USER / BREVO_SMTP_PASSWORD
# Brevo is the default reliable SMTP provider for production.
# For development or Gmail, explicitly set EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD.

# Determine SMTP host/user/pass with Brevo as production default
if os.environ.get("EMAIL_HOST_USER"):
    # Explicit EMAIL_HOST_USER means user configured Gmail or another provider
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com" if not DEBUG else "localhost")
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
elif os.environ.get("BREVO_SMTP_USER"):
    # Brevo credentials provided: use Brevo SMTP
    EMAIL_HOST = "smtp-relay.brevo.com"
    EMAIL_HOST_USER = os.environ.get("BREVO_SMTP_USER")
    EMAIL_HOST_PASSWORD = os.environ.get("BREVO_SMTP_PASSWORD", "")
else:
    # Fallback: localhost in dev, Brevo in production
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp-relay.brevo.com" if not DEBUG else "localhost")
    EMAIL_HOST_USER = ""
    EMAIL_HOST_PASSWORD = ""

EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587" if not DEBUG else "25"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1" if not DEBUG else "0") == "1"
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "0") == "1"
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))

# Default "From" sender: prefer explicit DEFAULT_FROM_EMAIL, otherwise use
# branded sender using the SMTP user (if provided).
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL") or ((f"NetFlow ISP <{EMAIL_HOST_USER}>") if EMAIL_HOST_USER else "NetFlow ISP <no-reply@netflow.local>")

# SERVER_EMAIL is the address that error emails come from (use same as DEFAULT_FROM_EMAIL unless overridden)
SERVER_EMAIL = os.environ.get("SERVER_EMAIL", DEFAULT_FROM_EMAIL)

if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    print(
        "⚠️  Warning: SMTP email credentials are not configured.\n"
        "To enable invoice email delivery, configure ONE of the following:\n"
        "  Option 1 (Brevo - recommended):\n"
        "    • Set BREVO_SMTP_USER\n"
        "    • Set BREVO_SMTP_PASSWORD\n"
        "  Option 2 (Gmail or custom SMTP):\n"
        "    • Set EMAIL_HOST (optional, defaults to smtp.gmail.com)\n"
        "    • Set EMAIL_HOST_USER\n"
        "    • Set EMAIL_HOST_PASSWORD\n"
        "    • Set EMAIL_PORT (optional, defaults to 587)\n"
        "  For Gmail: use an app-specific password, not your regular password.\n"
    )

if not os.environ.get("GEMINI_API_KEY"):
    print("Warning: GEMINI_API_KEY is not set. AI analyze endpoint will return a configuration error until it is provided.")
