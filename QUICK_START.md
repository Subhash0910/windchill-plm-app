# ⚡ QUICK START - Windchill PLM App

## **OPTION 1: DOCKER (EASIEST) - 3 STEPS** 🐳

### Step 1: Pull Code
```bash
cd windchill-plm-app
git checkout feature/ai-impact-engine
git pull
```

### Step 2: Configure
```bash
copy .env.example .env
```

### Step 3: Start Everything
```bash
docker-compose up --build
```

**✅ DONE! Open http://localhost:3000**

---

## **OPTION 2: MANUAL (FULL CONTROL) - 5 STEPS**

### Step 1: Pull Code
```bash
cd windchill-plm-app
git checkout feature/ai-impact-engine
git pull
```

### Step 2: Add Backend Dependencies
Open `windchill-backend/pom.xml` and add:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Step 3: Install Frontend Dependencies
```bash
cd windchill-frontend
npm install react-dropzone sockjs-client @stomp/stompjs react-hot-toast
```

### Step 4: Configure Application
Create `windchill-backend/src/main/resources/application.yml`:
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${EMAIL_USERNAME:your-email@gmail.com}
    password: ${EMAIL_PASSWORD:your-app-password}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

app:
  email:
    enabled: false
  base-url: http://localhost:3000
  file-storage:
    local:
      path: C:/windchill-files
```

Create file storage directory:
```bash
mkdir C:\windchill-files
```

### Step 5: Start Services

**Terminal 1 - Backend:**
```bash
cd windchill-backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd windchill-frontend
npm start
```

**✅ DONE! Open http://localhost:3000**

---

## **🧪 TESTING THE FEATURES**

### Test File Upload:
```bash
# Using curl (replace YOUR_TOKEN)
curl -X POST http://localhost:8080/api/v1/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "entityType=ECN" \
  -F "entityId=1"
```

### Test Notifications:
```bash
# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/notifications/count

# Get notifications
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/notifications/unread
```

### Check WebSocket:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `✅ WebSocket connected`

---

## **🔧 INTEGRATION IN YOUR APP**

### Add NotificationBell to Header:
```jsx
// In your Header.jsx
import NotificationBell from '../notifications/NotificationBell';

function Header() {
  return (
    <header>
      {/* Your existing header */}
      <NotificationBell />
    </header>
  );
}
```

### Add File Upload to ECN Form:
```jsx
// In your ECNDetails.jsx
import FileUpload from '../../components/files/FileUpload';
import FileList from '../../components/files/FileList';

function ECNDetails({ ecn }) {
  const [refreshFiles, setRefreshFiles] = useState(0);

  return (
    <div>
      {/* Existing ECN details */}
      
      <div className="mt-8">
        <h3>Attachments</h3>
        
        <FileUpload
          entityType="ECN"
          entityId={ecn.id}
          onUploadSuccess={() => setRefreshFiles(prev => prev + 1)}
        />
        
        <FileList
          entityType="ECN"
          entityId={ecn.id}
          refreshTrigger={refreshFiles}
        />
      </div>
    </div>
  );
}
```

---

## **⚠️ COMMON ISSUES**

### Issue: "Port already in use"
```bash
# Find and kill process (Windows PowerShell as Admin)
netstat -ano | findstr :8080
Stop-Process -Id <PID> -Force
```

### Issue: "Module not found"
```bash
cd windchill-frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Database connection failed"
```bash
# Make sure PostgreSQL is running
# Or use H2 in-memory database for testing
```

### Issue: "WebSocket not connecting"
- Check if backend is running on port 8080
- Check browser console for errors
- Update WebSocket URL in `useWebSocket.js`

---

## **📚 DOCUMENTATION**

- **Full Setup:** [FEATURE_IMPLEMENTATION_SUMMARY.md](./FEATURE_IMPLEMENTATION_SUMMARY.md)
- **Docker Guide:** [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
- **Production Plan:** [PRODUCTION_UPGRADE_PLAN.md](./PRODUCTION_UPGRADE_PLAN.md)

---

## **✅ VERIFICATION CHECKLIST**

After setup, verify:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login to the app
- [ ] NotificationBell appears in header
- [ ] Can upload files
- [ ] Can download files
- [ ] WebSocket shows "connected" in console
- [ ] Can create test notification

---

## **💬 NEED HELP?**

1. Check logs for errors
2. Review documentation files
3. Test with curl commands
4. Check browser DevTools console

---

**You're all set! 🎉**
