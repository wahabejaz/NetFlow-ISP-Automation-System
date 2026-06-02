# 🚀 Quick Deployment Steps - ISP Backend

## Files Already Created/Updated
✅ `Procfile` - Render configuration  
✅ `render.yaml` - Infrastructure as Code  
✅ `requirements.txt` - Added gunicorn, mysqlclient, python-dotenv  
✅ `netflow_backend/settings.py` - Production-ready settings (Aiven MySQL)  
✅ `DEPLOYMENT_GUIDE.md` - Full deployment documentation  

---

## 🔥 Quick Start (5-10 minutes)

### Step 1: Commit Everything
```bash
cd "e:\My Documents\ISP-Internet-service-provider-Automation-System-main\ISP-Internet-service-provider-Automation-System-main"
git add .
git commit -m "Add Render and Aiven deployment configuration"
git push origin main
```

### Step 2: Create Aiven MySQL Database
1. Go to https://aiven.io
2. Sign up or log in
3. Create new project
4. Create MySQL service:
   - Service name: `isp-mysql`
   - Cloud region: Choose close to Render
   - Plan: Startup-4 (free tier)
5. Once initialized, go to "Connection" tab
6. Copy credentials: Host, Port, User (avnadmin), Password, Database

### Step 3: Deploy to Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your ISP repository
5. Set name: `isp-backend`
6. Add environment variables (see table below)
7. Click "Create Web Service"

### Step 4: Set Environment Variables in Render
| Variable | Value | Example |
|----------|-------|---------|
| `DJANGO_DEBUG` | `0` | `0` |
| `DJANGO_SECRET_KEY` | Random 50-char key | Generated from Python command below |
| `DB_HOST` | From Aiven Connection tab | `mysql-xxxxx.aivencloud.com` |
| `DB_USER` | From Aiven Connection tab | `avnadmin` |
| `DB_PASSWORD` | From Aiven Connection tab | `xxxxxxxxxx` |
| `DB_NAME` | `isp_automation_system` | `isp_automation_system` |
| `DB_PORT` | `3306` | `3306` |

### Generate DJANGO_SECRET_KEY:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 5: Run Migrations
Render will now run migrations automatically using the release command during deployment. No shell access is required on the free plan.

If you need to rerun migrations manually later, use a deploy hook or update the `releaseCommand` in `render.yaml`.

### Step 6: Update Frontend
1. Get backend URL from Render dashboard (e.g., `https://isp-backend.onrender.com`)
2. Go to Vercel → Your frontend project
3. Settings → Environment Variables
4. Add: `VITE_API_URL = https://isp-backend.onrender.com`
5. Redeploy frontend

### Step 7: Update settings.py CORS
Edit `netflow_backend/settings.py` line with CORS settings:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.vercel.app",  # Your Vercel URL
    "http://localhost:3000",
]
```

Push change: `git push origin main` (auto-redeploys on Render)

---

## ✅ Verification

After deployment, test:
```bash
# Test backend is running
curl https://isp-backend.onrender.com/api/

# Should get 401 or data (not 502 or connection error)
```

---

## 📋 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check Render logs, verify DB credentials, run migrations |
| CORS Error | Update CORS_ALLOWED_ORIGINS with correct Vercel URL |
| DB Connection Error | Verify Aiven MySQL service is active, check credentials, allow Render IP in firewall |
| Migrations Not Running | SSH into Render → Shell → run `python manage.py migrate` |

---

## 📚 Full Documentation
See `DEPLOYMENT_GUIDE.md` for complete step-by-step guide with troubleshooting.

---

## 🎯 Next Steps After Deployment

1. ✅ Test API endpoints from frontend
2. 📧 Set up email service (optional)
3. 🔐 Set up API authentication tokens
4. 📊 Monitor Render dashboard for errors
5. 💾 Set up database backups (automatic on Aiven)
6. 🌐 Configure custom domain (optional)

