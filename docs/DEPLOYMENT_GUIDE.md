# Production Deployment Guide

**System**: SenstoSales ERP  
**Version**: 1.0.0  
**Target Environment**: Windows Server 2019+ OR Linux (Ubuntu 20.04+)  
**Last Updated**: December 24, 2025

---

## Pre-Deployment Checklist

### System Requirements

**Hardware** (Minimum):
- CPU: 2 cores (4 cores recommended)
- RAM: 4 GB (8 GB recommended)
- Disk: 20 GB free space
- Network: 100 Mbps

**Software**:
- ✅ Python 3.10 or higher
- ✅ Node.js 18.x or higher
- ✅ Git
- ✅ SQLite 3.35+ (usually pre-installed)
- ✅ Reverse proxy (Nginx or Apache) for production

---

## Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-org/SenstoSales.git
cd SenstoSales
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# OR (Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify database exists
python backend/scripts/verify_database.py
```

**Expected Output**:
```
✓ Database: db\business.db
✓ Total tables: 16
✓ All expected tables present
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Optimized production bundle created
```

### 4. Configure Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=sqlite:///../db/business.db

# Backend
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend (create frontend/.env.production)
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### 5. Database Migrations

```bash
# Verify all migrations applied
python -c "import sqlite3; conn = sqlite3.connect('db/business.db'); print('Migrations:', conn.execute('SELECT * FROM schema_version').fetchall()); conn.close()"
```

**Expected**: Should show 4 migration records.

### 6. Start Services

**Development Mode** (Testing):
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Mode**:
```bash
# Backend (using Uvicorn with workers)
cd backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 &

# Frontend (Next.js production server)
cd frontend
nohup npm run start &
```

### 7. Reverse Proxy Configuration (Nginx)

Create `/etc/nginx/sites-available/senstosales`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/senstosales /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Setup (Production)

Using Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Update nginx config to use HTTPS:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ...
}
```

---

## Database Backup Strategy

### Automated Daily Backups

Create `backup_database.py`:
```python
import shutil
from datetime import datetime
from pathlib import Path

DB_PATH = Path("db/business.db")
BACKUP_DIR = Path("db/backups")
BACKUP_DIR.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_path = BACKUP_DIR / f"business_{timestamp}.db"

shutil.copy2(DB_PATH, backup_path)
print(f"✓ Backup created: {backup_path}")

# Keep only last 30 days
backups = sorted(BACKUP_DIR.glob("business_*.db"))
if len(backups) > 30:
    for old_backup in backups[:-30]:
        old_backup.unlink()
        print(f"✓ Removed old backup: {old_backup}")
```

**Windows Task Scheduler**:
```powershell
schtasks /create /tn "SenstoSales DB Backup" /tr "python c:\path\to\backup_database.py" /sc daily /st 02:00
```

**Linux Cron**:
```bash
# crontab -e
0 2 * * * cd /path/to/SenstoSales && python backup_database.py
```

---

## Monitoring & Logging

### Application Logs

Backend logs via `logging_config.py` - automatically rotated daily.

**Location**: `backend/logs/app.log`

**Monitor**:
```bash
tail -f backend/logs/app.log
```

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# Expected: {"status": "healthy"}
```

### System Monitoring (Optional)

Install Prometheus + Grafana for metrics:
- Request latency
- Error rates
- Database query performance
- System resource usage

---

## Security Hardening

### 1. Database Permissions

```bash
# Linux
chmod 600 db/business.db
chown appuser:appuser db/business.db

# Windows
icacls db\business.db /grant:r "IIS_IUSRS:(R,W)"
```

### 2. CORS Configuration

Update `backend/app/core/config.py`:
```python
BACKEND_CORS_ORIGINS = [
    "https://yourdomain.com",  # Production domain only
]
```

### 3. API Rate Limiting (Future Enhancement)

Consider adding `slowapi` middleware:
```bash
pip install slowapi
```

---

## Troubleshooting

### Backend won't start

**Symptom**: `ModuleNotFoundError` or `ImportError`

**Solution**:
```bash
pip install -r requirements.txt --upgrade
```

### Frontend build fails

**Symptom**: `Module not found` errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database locked error

**Symptom**: `database is locked`

**Solution**:
1. Check if another process is using the DB
2. Verify WAL mode is enabled:
   ```bash
   python -c "import sqlite3; conn = sqlite3.connect('db/business.db'); print(conn.execute('PRAGMA journal_mode').fetchone()); conn.close()"
   ```
3. Expected: `('wal',)`

### CORS errors in browser

**Symptom**: `Access to fetch blocked by CORS policy`

**Solution**:
1. Verify `BACKEND_CORS_ORIGINS` includes frontend URL
2. Restart backend after config change
3. Clear browser cache

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_poi_po_number ON purchase_order_items(po_number);
CREATE INDEX IF NOT EXISTS idx_dci_po_item ON delivery_challan_items(po_item_id);
CREATE INDEX IF NOT EXISTS idx_srv_po ON srvs(po_number);
```

### 2. Frontend Optimization

```bash
# Analyze bundle size
cd frontend
npm run build
npx @next/bundle-analyzer
```

### 3. Backend Workers

For high concurrency, increase Uvicorn workers:
```bash
uvicorn app.main:app --workers 8 --port 8000
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop services
pkill -f uvicorn
pkill -f "npm run start"

# Restore database from backup
cp db/backups/business_YYYYMMDD_HHMMSS.db db/business.db

# Revert code to last known good commit
git reset --hard ad2b008

# Restart services
./deploy.sh
```

---

## Post-Deployment Validation

Run full validation suite:

```bash
# 1. Database integrity
python backend/scripts/verify_database.py

# 2. API contract
python backend/scripts/verify_api_contract.py

# 3. Frontend build
cd frontend && npm run build

# 4. Health check
curl http://localhost:8000/health
curl http://localhost:3000

# 5. Manual smoke test
# - Login and navigate all pages
# - Create a test DC
# - Upload a test SRV
# - Generate a report
```

---

## Support Contacts

**Development Team**: dev@senstographic.com  
**System Admin**: admin@senstographic.com  
**Emergency Hotline**: +91-XXX-XXX-XXXX

---

**Document Version**: 1.0  
**Next Review**: 2026-01-24
