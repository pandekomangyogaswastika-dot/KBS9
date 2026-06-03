# KBS8 System - Kubus Teknologi Indonesia

**Enterprise Assessment & Project Management Platform**

[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/pandekomangyogaswastika-dot/KBS8)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-success.svg)](https://github.com/pandekomangyogaswastika-dot/KBS8)

---

## 📖 Tentang KBS8

KBS8 (Kubus Teknologi Indonesia) adalah platform enterprise untuk:
- 🎯 **Dynamic Assessment System** - Template-driven questionnaire dengan conditional branching
- 📊 **Project Management** - Multi-role portal (Admin, Client, Staff)
- 🤖 **AI Integration** - Claude AI untuk automated reporting
- 📄 **PDF Export** - Professional assessment reports
- 🔐 **Secure & Scalable** - JWT auth, RBAC, MongoDB

---

## 🚀 Quick Start Deployment

### ⚡ Copy-Paste Ready Commands!

**📋 [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)** ← **Semua command tinggal copy-paste!**

### Option 1: Step-by-Step Copy-Paste (Recommended)

Ikuti **[DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)** - Semua command sudah siap copy-paste!

**12 Steps mudah:**
1. SSH & Update → copy-paste ✓
2. Install Dependencies → copy-paste ✓  
3. Create User → copy-paste ✓
4. Upload Project → copy-paste ✓
5. Setup Backend → copy-paste ✓
6. Setup Frontend → copy-paste ✓
7. Setup Supervisor → copy-paste ✓
8. Setup Nginx → copy-paste ✓
9. Setup SSL → copy-paste ✓
10. Setup Firewall → copy-paste ✓
11. Create Admin → copy-paste ✓
12. Test & Verify → copy-paste ✓

**Total waktu: 15-20 menit** ⚡

### Option 2: Auto Deployment Script

```bash
# 1. SSH & clone
ssh root@YOUR_VPS_IP
git clone https://github.com/pandekomangyogaswastika-dot/KBS8.git
cd KBS8

# 2. Run script
sudo bash deploy.sh

# 3. Follow prompts
# 4. Edit .env files
# 5. Restart: sudo supervisorctl restart all
```

**📚 Dokumentasi Lengkap:**
- 🔥 [**DEPLOYMENT_COMMANDS.md**](./DEPLOYMENT_COMMANDS.md) - **Copy-paste ready commands!**
- [**QUICK_DEPLOY.md**](./QUICK_DEPLOY.md) - Quick start guide
- [**DEPLOYMENT_HOSTINGER.md**](./DEPLOYMENT_HOSTINGER.md) - Full guide + troubleshooting

**⚠️ TIDAK pakai library `emergent`!** Sudah diganti dengan Anthropic SDK langsung.

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.10+) - High-performance async API
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Axios** - API client
- **i18next** - Internationalization (ID/EN)
- **React Router** - Navigation

### Database
- **MongoDB** - Document database (Atlas or local)

### Infrastructure
- **Nginx** - Reverse proxy & static file serving
- **Supervisor** - Process management
- **Certbot** - SSL/HTTPS
- **Ubuntu 20.04/22.04** - Production server

---

## 📁 Project Structure

```
KBS8/
├── backend/                    # FastAPI backend
│   ├── server.py              # Main application
│   ├── routers/               # API routes
│   │   ├── assessment.py      # Assessment module
│   │   ├── auth.py           # Authentication
│   │   ├── projects.py       # Project management
│   │   └── users.py          # User management
│   ├── services/              # Business logic
│   ├── db.py                 # Database connection
│   ├── security.py           # Auth & security
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── features/         # Feature modules
│   │   │   ├── admin/       # Admin portal
│   │   │   ├── portal/      # Client/Staff portal
│   │   │   └── auth/        # Authentication
│   │   ├── components/      # Shared components
│   │   ├── lib/             # Utilities
│   │   └── App.js           # Main app
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   └── .env                 # Environment variables
│
├── docs/                     # Documentation
│   ├── KTI_00_AGENT_QUICK_START.md
│   ├── KTI_01_SYSTEM_OVERVIEW.md
│   └── ... (13 docs total)
│
├── memory/                   # Development memory
│   ├── PRD.md               # Product requirements
│   ├── TECH_DECISIONS.md    # Architecture decisions
│   └── test_credentials.md  # Test accounts
│
├── deploy.sh                # Auto deployment script
├── DEPLOYMENT_HOSTINGER.md  # Full deployment guide
├── QUICK_DEPLOY.md         # Quick start guide
└── README.md               # This file
```

---

## 🎯 Core Features

### 1. Dynamic Assessment System
- ✅ Visual template editor (no-code)
- ✅ 7 question types (text, select, multiselect, yes/no, scale, number, textarea)
- ✅ Conditional branching logic (show_if rules)
- ✅ Multilingual support (Indonesian + English)
- ✅ Real-time auto-save
- ✅ Progress tracking
- ✅ File attachments
- ✅ PDF export

### 2. Template Editor
- ✅ Drag & drop question reordering
- ✅ Visual options builder
- ✅ Conditional logic builder
- ✅ Scale labels editor
- ✅ Domain/section management
- ✅ Clone & duplicate questions
- ✅ Publish/unpublish templates

### 3. Multi-Role Portal
- **Admin:** Full system access, user management, template editor
- **Client:** View projects, take assessments, view reports
- **Staff:** Manage client projects, create sessions

### 4. AI Integration
- ✅ Claude AI via Emergent LLM
- ✅ Automated assessment analysis
- ✅ Report generation
- ✅ Insights & recommendations

### 5. Project Management
- ✅ Client management
- ✅ Project tracking
- ✅ Invoice management
- ✅ Document management
- ✅ Activity logs

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing (bcrypt)
- ✅ HTTPS/SSL
- ✅ CORS configuration
- ✅ Input validation (Pydantic)
- ✅ SQL injection protection (MongoDB)
- ✅ XSS protection
- ✅ Rate limiting ready

---

## 📊 Database Schema

Key collections:
- `users` - User accounts (admin, staff, client)
- `assessment_templates` - Question templates
- `assessment_sessions` - Active assessment sessions
- `assessment_answers` - User responses
- `projects` - Client projects
- `invoices` - Billing records
- `attachments` - Uploaded files

Full schema documentation: `/app/docs/KTI_04_DATABASE_STANDARDS.md`

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# Required
MONGO_URL=mongodb+srv://...           # MongoDB connection
JWT_SECRET=your_secret_here           # JWT signing key (32+ chars)
ENVIRONMENT=production                # production | development

# Optional
ALLOWED_ORIGINS=https://domain.com    # CORS origins
ADMIN_DEFAULT_PASSWORD=SecurePass     # Default admin password
UPLOAD_DIR=/path/to/uploads           # File upload directory
MAX_UPLOAD_SIZE=10485760              # Max file size (bytes)
EMERGENT_LLM_KEY=key_here            # AI integration key
```

### Frontend Environment Variables

```bash
# Required
REACT_APP_BACKEND_URL=https://domain.com/api   # Backend API URL

# Optional
NODE_ENV=production                             # Environment
```

---

## 📝 API Endpoints

### Authentication
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
GET    /api/auth/me            # Get current user
POST   /api/auth/logout        # User logout
```

### Assessments
```
GET    /api/assessment/templates              # List templates
POST   /api/assessment/templates              # Create template
GET    /api/assessment/templates/{id}         # Get template
PATCH  /api/assessment/templates/{id}         # Update template
DELETE /api/assessment/templates/{id}         # Delete template

POST   /api/assessment/sessions               # Create session
GET    /api/assessment/sessions/{id}/detail   # Get session
PATCH  /api/assessment/sessions/{id}/answers  # Save answers
POST   /api/assessment/sessions/{id}/submit   # Submit assessment
GET    /api/assessment/{token}/export         # Export PDF
```

### Projects
```
GET    /api/projects             # List projects
POST   /api/projects             # Create project
GET    /api/projects/{id}        # Get project
PATCH  /api/projects/{id}        # Update project
DELETE /api/projects/{id}        # Delete project
```

Full API documentation: `/app/docs/KTI_05_API_STANDARDS.md`

---

## 🧪 Testing

### Test Credentials

After deployment, default admin:
- Email: `admin@kubusteknologi.com`
- Password: `Admin123!`

**⚠️ CHANGE PASSWORD IMMEDIATELY in production!**

More test accounts: `/app/memory/test_credentials.md`

### Manual Testing
```bash
# Health check
curl https://yourdomain.com/api/health

# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kubusteknologi.com","password":"Admin123!"}'
```

---

## 📦 Deployment

### Production Checklist

Before go-live:
- [ ] Domain pointing to VPS IP
- [ ] SSL certificate installed (HTTPS)
- [ ] MongoDB configured
- [ ] Environment variables set
- [ ] Services running (`supervisorctl status`)
- [ ] Firewall enabled (`ufw status`)
- [ ] Admin password changed
- [ ] Backup strategy in place
- [ ] Logs monitored

### Deployment Scripts

1. **deploy.sh** - Auto deployment (recommended)
2. Manual steps in DEPLOYMENT_HOSTINGER.md

### Update Application

```bash
cd /home/kbs8/KBS8
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart kbs8-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo supervisorctl restart kbs8-frontend
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
tail -f /var/log/kbs8-backend.err.log
# Check: MongoDB connection, .env variables, port conflicts
```

**Frontend 404 errors:**
```bash
cd /home/kbs8/KBS8/frontend
npm run build
sudo supervisorctl restart kbs8-frontend
```

**API calls failing (CORS):**
```bash
# Check backend .env ALLOWED_ORIGINS
# Check frontend .env REACT_APP_BACKEND_URL
sudo supervisorctl restart kbs8-backend
```

More troubleshooting: [DEPLOYMENT_HOSTINGER.md](./DEPLOYMENT_HOSTINGER.md#maintenance--troubleshooting)

---

## 📚 Documentation

### User Guides
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Quick deployment (5 min)
- [DEPLOYMENT_HOSTINGER.md](./DEPLOYMENT_HOSTINGER.md) - Full deployment guide

### Developer Docs
- `/app/docs/KTI_00_AGENT_QUICK_START.md` - Development quick start
- `/app/docs/KTI_01_SYSTEM_OVERVIEW.md` - System architecture
- `/app/docs/KTI_02_TECHSTACK_STANDARDS.md` - Tech stack & patterns
- `/app/docs/KTI_03_SECURITY_STANDARDS.md` - Security guidelines
- `/app/docs/KTI_04_DATABASE_STANDARDS.md` - Database schema
- `/app/docs/KTI_05_API_STANDARDS.md` - API conventions
- `/app/docs/KTI_06_UIUX_STANDARDS.md` - UI/UX guidelines
- `/app/docs/KTI_13_ASSESSMENT_MODULE.md` - Assessment module spec

### Analysis Reports
- `/app/memory/ASSESSMENT_COMPARISON_REPORT.md` - KBS8 vs KN3 comparison
- `/app/memory/TEMPLATE_EDITOR_COMPARISON.md` - Template editor analysis

---

## 🤝 Contributing

Development workflow:
1. Fork repository
2. Create feature branch
3. Follow coding standards in `/app/docs/`
4. Test thoroughly
5. Submit pull request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🆘 Support

**Documentation:**
- [Deployment Guide](./DEPLOYMENT_HOSTINGER.md)
- [Quick Start](./QUICK_DEPLOY.md)
- [System Docs](./docs/)

**Check Status:**
```bash
sudo supervisorctl status
systemctl status nginx
tail -f /var/log/kbs8-backend.err.log
```

**Need Help?**
- Check logs: `/var/log/kbs8-*.log`
- Review .env configuration
- Verify MongoDB connection
- Check firewall & SSL

---

## 🎯 Roadmap

### Completed ✅
- [x] Dynamic assessment system
- [x] Template editor (visual, no-code)
- [x] Conditional branching logic
- [x] Multi-role portal
- [x] AI integration (Claude)
- [x] PDF export
- [x] Multilingual (ID/EN)
- [x] Auto-save
- [x] File attachments
- [x] Progress tracking

### Planned 🚧
- [ ] Dark/light theme toggle
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] API rate limiting
- [ ] Redis caching
- [ ] WebSocket real-time updates
- [ ] Advanced reporting

---

## 📞 Contact

**Kubus Teknologi Indonesia**
- Website: https://kubusteknologi.com
- Email: info@kubusteknologi.com

---

**🚀 Ready to deploy? Start with [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)!**
