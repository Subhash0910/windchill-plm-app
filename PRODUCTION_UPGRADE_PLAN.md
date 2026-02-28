# 🚀 PRODUCTION UPGRADE - 3 WEEK MASTER PLAN

**Date:** February 28, 2026  
**Goal:** Transform PLM system from MVP → Production-Ready Enterprise Application  
**Status:** IN PROGRESS  
**Quality Target:** Enterprise-Grade, Secure, Scalable  

---

## 🎯 **OVERVIEW**

Transforming your PLM system to handle **real production workloads** with:
- 1000+ users
- 10,000+ parts
- 100+ concurrent changes
- Enterprise security & compliance
- 99.9% uptime SLA

---

## 📦 **WEEK 1: NOTIFICATIONS & FILE MANAGEMENT**

### **1.1 Email Notification System** ⚡ CRITICAL

**Backend Components:**
```java
// notification-service (New microservice)
├── NotificationService.java       // Core notification logic
├── EmailService.java              // Email sending (SendGrid/SMTP)
├── NotificationTemplate.java      // Email templates
├── NotificationRepository.java    // Track sent notifications
└── NotificationScheduler.java     // Batch processing
```

**Email Templates:**
1. ECN Created → Notify stakeholders
2. ECN Approved → Notify creator
3. ECN Rejected → Notify creator with reason
4. Part State Changed → Notify team
5. Approval Required → Notify approver
6. Comment Added → Notify mentioned users

**Configuration:**
```yaml
notification:
  email:
    provider: sendgrid  # or smtp
    from: noreply@windchill-plm.com
    enabled: true
    batch-size: 50
    retry-attempts: 3
```

**Database Schema:**
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
);
```

**Security:**
- ✅ Rate limiting (max 100 emails/user/hour)
- ✅ Email validation (prevent spam)
- ✅ Unsubscribe mechanism
- ✅ Audit trail for all notifications

---

### **1.2 File Upload & Management System** 📎 CRITICAL

**Backend Components:**
```java
// file-service
├── FileStorageService.java        // S3/Local storage abstraction
├── FileController.java            // Upload/download endpoints
├── FileMetadataRepository.java    // Track file metadata
├── FileValidator.java             // Validate file types/sizes
└── VirusScanner.java              // Optional: ClamAV integration
```

**Supported File Types:**
- Documents: PDF, DOCX, XLSX
- Images: JPG, PNG, SVG
- CAD: DWG, STEP, IGES (metadata only)
- Archives: ZIP (scanned for viruses)

**Storage Strategy:**
```
Option A: AWS S3 (Production)
  - Bucket: windchill-plm-files-prod
  - Path: /{contextId}/{entityType}/{entityId}/{fileId}
  - CDN: CloudFront for fast delivery
  
Option B: Local Storage (Development)
  - Path: /opt/windchill/files/{contextId}/...
  - Volume mount in Docker
```

**Database Schema:**
```sql
CREATE TABLE file_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_type ENUM('S3', 'LOCAL') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- 'ECN', 'PART', 'ECR'
    entity_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    checksum VARCHAR(64),  -- SHA-256 for integrity
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploader (uploaded_by)
);
```

**API Endpoints:**
```
POST   /api/v1/files/upload
GET    /api/v1/files/{fileId}/download
GET    /api/v1/files/{fileId}/metadata
DELETE /api/v1/files/{fileId}
GET    /api/v1/files/entity/{entityType}/{entityId}
```

**Security:**
- ✅ Max file size: 50MB (configurable)
- ✅ Virus scanning (optional ClamAV)
- ✅ Access control (only users with entity access)
- ✅ Signed URLs for downloads (expiry: 1 hour)
- ✅ File type whitelist
- ✅ CSRF protection on uploads

**Frontend:**
```jsx
// FileUpload.jsx
- Drag & drop zone
- Progress bar
- Multiple file support
- Preview for images
- Download/delete actions
```

---

### **1.3 Document Management for ECNs** 📄

**Features:**
- Attach justification documents to ECN
- Version control for document revisions
- Required documents checklist
- Document approval workflow

---

## 📡 **WEEK 2: REAL-TIME FEATURES & ADVANCED SEARCH**

### **2.1 WebSocket Real-Time Notifications** 🔔 HIGH IMPACT

**Backend Components:**
```java
// websocket-service
├── WebSocketConfig.java           // STOMP configuration
├── WebSocketController.java       // Message handlers
├── NotificationBroadcaster.java   // Broadcast to users
└── SessionManager.java            // Track active connections
```

**WebSocket Endpoints:**
```
/ws/connect              → Initial WebSocket connection
/topic/user/{userId}     → User-specific notifications
/topic/context/{contextId} → Context-wide broadcasts
/topic/part/{partId}     → Part-specific updates
```

**Real-time Events:**
1. **ECN Events:**
   - ECN created → Notify stakeholders
   - ECN approved/rejected → Notify creator
   - Comment added → Notify mentioned users

2. **Part Events:**
   - Part state changed → Notify watchers
   - Part edited → Notify team

3. **System Events:**
   - User mentioned → Instant notification
   - Task assigned → Alert user

**Frontend Integration:**
```jsx
// useWebSocket.js
import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const useWebSocket = (userId) => {
  useEffect(() => {
    const socket = new SockJS('/ws/connect');
    const stompClient = Stomp.over(socket);
    
    stompClient.connect({}, () => {
      stompClient.subscribe(`/topic/user/${userId}`, (message) => {
        const notification = JSON.parse(message.body);
        showToast(notification);
      });
    });
    
    return () => stompClient.disconnect();
  }, [userId]);
};
```

**Security:**
- ✅ Authentication required for connections
- ✅ User can only subscribe to own topics
- ✅ Rate limiting (max 100 messages/min)
- ✅ Automatic reconnection on disconnect

---

### **2.2 Advanced Search & Filters** 🔍 HIGH VALUE

**Search Capabilities:**

**1. Part Search:**
```sql
SEARCH BY:
- Part number (fuzzy match)
- Part name (full-text)
- Description (full-text)
- Lifecycle state
- Created/modified date range
- Creator/modifier
- Context
```

**2. ECN Search:**
```sql
SEARCH BY:
- ECN number
- Title/description
- Status (DRAFT, PENDING, APPROVED, REJECTED)
- Created date range
- Affected parts
- Creator/approver
```

**3. Global Search:**
```
Search across all entities:
- Parts
- ECNs
- ECRs
- Users
- Documents
```

**Backend Implementation:**
```java
// SearchService.java
public interface SearchService {
    Page<SearchResult> globalSearch(String query, Pageable pageable);
    Page<Part> searchParts(PartSearchCriteria criteria);
    Page<ECN> searchECNs(ECNSearchCriteria criteria);
}

// Using JPA Specifications for dynamic queries
public Specification<Part> buildPartSpecification(PartSearchCriteria criteria) {
    return (root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();
        
        if (criteria.getPartNumber() != null) {
            predicates.add(cb.like(cb.lower(root.get("partNumber")), 
                "%" + criteria.getPartNumber().toLowerCase() + "%"));
        }
        
        if (criteria.getLifecycleState() != null) {
            predicates.add(cb.equal(root.get("lifecycleState"), criteria.getLifecycleState()));
        }
        
        // Date range
        if (criteria.getCreatedAfter() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getCreatedAfter()));
        }
        
        return cb.and(predicates.toArray(new Predicate[0]));
    };
}
```

**Frontend Components:**
```jsx
// AdvancedSearch.jsx
<SearchFilters>
  <TextInput name="query" placeholder="Search..." />
  <Select name="entityType" options={['All', 'Parts', 'ECNs']} />
  <DateRangePicker name="dateRange" />
  <MultiSelect name="lifecycleStates" />
  <Button onClick={handleSearch}>Search</Button>
</SearchFilters>

<SearchResults>
  {results.map(result => (
    <SearchResultCard key={result.id} result={result} />
  ))}
</SearchResults>
```

**Performance:**
- ✅ Database indexes on searchable columns
- ✅ Full-text search for descriptions
- ✅ Query result caching (Redis)
- ✅ Pagination (max 100 results/page)

---

### **2.3 Activity Feed** 📰

**Features:**
- Recent changes in context
- User-specific activity
- Part change history
- ECN workflow events

**UI:**
```
🕐 2 hours ago
👤 John Doe approved ECN-2024-045
📄 Affected parts: 001dfy, 002abc

🕐 5 hours ago  
🔧 Jane Smith changed part 003xyz state to RELEASED
💬 Added comment: "Ready for production"
```

---

## 📊 **WEEK 3: ANALYTICS & PRODUCTION HARDENING**

### **3.1 Dashboard & Analytics** 📈 HIGH VISIBILITY

**Metrics Dashboard:**

**1. Executive Dashboard:**
```
📊 Key Metrics:
- Total Parts: 2,547 (+12% this month)
- Active ECNs: 45 (23 pending approval)
- Avg Approval Time: 3.2 days (↓ 18%)
- Parts Released: 89 this month

📈 Trends (Last 30 days):
- ECN creation rate
- Approval bottlenecks
- Most changed parts
- Top contributors
```

**2. Engineering Dashboard:**
```
🔧 My Work:
- ECNs Created: 12
- ECNs Pending: 3
- Parts Modified: 47
- Approvals Pending: 5

⏱️ Cycle Times:
- Avg ECN duration: 4.5 days
- Fastest approval: 0.5 days
- Slowest approval: 14 days
```

**3. Manager Dashboard:**
```
👥 Team Performance:
- Team members: 15
- Total ECNs: 127
- Approval rate: 87%
- Rejection reasons breakdown

🚨 Alerts:
- 3 ECNs overdue for approval
- 5 parts in INWORK > 30 days
```

**Backend Implementation:**
```java
// AnalyticsService.java
public class DashboardMetrics {
    // Aggregation queries
    public Map<String, Object> getExecutiveDashboard(Long contextId) {
        return Map.of(
            "totalParts", partRepository.countByContextId(contextId),
            "activeECNs", ecnRepository.countByStatus("PENDING"),
            "avgApprovalTime", calculateAvgApprovalTime(),
            "partsThisMonth", countPartsCreatedThisMonth()
        );
    }
    
    // Time-series data
    public List<TimeSeriesPoint> getECNTrend(int days) {
        // SQL aggregation by date
    }
}
```

**Database Views:**
```sql
-- Pre-computed metrics for performance
CREATE VIEW vw_dashboard_metrics AS
SELECT 
    context_id,
    COUNT(DISTINCT p.id) as total_parts,
    COUNT(DISTINCT ecn.id) as total_ecns,
    AVG(TIMESTAMPDIFF(HOUR, ecn.created_at, ecn.approved_at)) as avg_approval_hours
FROM contexts c
LEFT JOIN parts p ON p.context_id = c.id
LEFT JOIN ecns ecn ON ecn.context_id = c.id
GROUP BY context_id;
```

---

### **3.2 Audit Trail** 📝 COMPLIANCE CRITICAL

**What to Audit:**
```
✅ Part changes (all fields)
✅ ECN lifecycle events
✅ Approval/rejection decisions
✅ File uploads/downloads
✅ Permission changes
✅ User login/logout
✅ Configuration changes
```

**Database Schema:**
```sql
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, APPROVE, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_value TEXT,  -- JSON
    new_value TEXT,  -- JSON
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp)
) PARTITION BY RANGE (YEAR(timestamp)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

**Implementation:**
```java
@Aspect
@Component
public class AuditAspect {
    
    @Around("@annotation(Audited)")
    public Object auditMethod(ProceedingJoinPoint joinPoint) {
        // Capture before state
        Object oldValue = captureState(joinPoint);
        
        // Execute method
        Object result = joinPoint.proceed();
        
        // Capture after state
        Object newValue = captureState(result);
        
        // Log to audit_log
        auditLogService.log(AuditEntry.builder()
            .userId(getCurrentUserId())
            .action(extractAction(joinPoint))
            .entityType(extractEntityType(joinPoint))
            .oldValue(toJson(oldValue))
            .newValue(toJson(newValue))
            .build());
        
        return result;
    }
}
```

**Audit Trail UI:**
```jsx
// AuditLog.jsx
<AuditLogViewer>
  <Filters>
    <DateRange />
    <UserFilter />
    <ActionFilter />
  </Filters>
  
  <LogEntries>
    {entries.map(entry => (
      <LogEntry key={entry.id}>
        <Timestamp>{entry.timestamp}</Timestamp>
        <User>{entry.userName}</User>
        <Action>{entry.action}</Action>
        <Entity>{entry.entityType}#{entry.entityId}</Entity>
        <DiffViewer 
          oldValue={entry.oldValue} 
          newValue={entry.newValue} 
        />
      </LogEntry>
    ))}
  </LogEntries>
</AuditLogViewer>
```

---

### **3.3 Production Hardening** 🔒

**1. Security Enhancements:**
```java
// Rate Limiting
@RateLimiter(name = "api", fallbackMethod = "rateLimitFallback")
public Response handleRequest() { }

// Input Validation
@Valid @RequestBody ECNCreateRequest request

// SQL Injection Prevention
// ✅ Using JPA/Hibernate (parameterized queries)
// ✅ No string concatenation in queries

// XSS Prevention
// ✅ Content Security Policy headers
// ✅ HTML escaping in responses

// CSRF Protection
// ✅ CSRF tokens for state-changing operations
```

**2. Performance Optimizations:**
```java
// Database Connection Pooling
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

// Query Optimization
@EntityGraph(attributePaths = {"creator", "context"})
List<Part> findAllWithCreatorAndContext();

// Caching
@Cacheable(value = "parts", key = "#id")
Part findById(Long id);

// Async Processing
@Async
public CompletableFuture<Void> sendNotification();
```

**3. Monitoring & Logging:**
```yaml
# application.yml
logging:
  level:
    root: INFO
    com.windchill: DEBUG
  file:
    name: /var/log/windchill/app.log
    max-size: 100MB
    max-history: 30

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

**4. Error Handling:**
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(Exception e) {
        return ResponseEntity.status(404).body(
            ErrorResponse.builder()
                .timestamp(Instant.now())
                .message(e.getMessage())
                .code("RESOURCE_NOT_FOUND")
                .build()
        );
    }
}
```

**5. Health Checks:**
```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Check database
        boolean dbUp = checkDatabase();
        
        // Check Redis
        boolean redisUp = checkRedis();
        
        // Check ML service
        boolean mlUp = checkMLService();
        
        if (dbUp && redisUp && mlUp) {
            return Health.up()
                .withDetail("database", "UP")
                .withDetail("redis", "UP")
                .withDetail("ml-service", "UP")
                .build();
        }
        
        return Health.down().build();
    }
}
```

---

## 🗂️ **FILE STRUCTURE**

```
windchill-backend/
├── notification-service/
│   ├── NotificationService.java
│   ├── EmailService.java
│   ├── NotificationController.java
│   └── templates/
│       ├── ecn-created.html
│       ├── ecn-approved.html
│       └── approval-required.html
│
├── file-service/
│   ├── FileStorageService.java
│   ├── S3StorageService.java
│   ├── LocalStorageService.java
│   ├── FileController.java
│   └── FileMetadataRepository.java
│
├── websocket-service/
│   ├── WebSocketConfig.java
│   ├── WebSocketController.java
│   └── NotificationBroadcaster.java
│
├── analytics-service/
│   ├── AnalyticsService.java
│   ├── DashboardController.java
│   └── MetricsCalculator.java
│
└── audit-service/
    ├── AuditAspect.java
    ├── AuditLogService.java
    └── AuditLogController.java

windchill-frontend/
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.jsx
│   │   ├── NotificationList.jsx
│   │   └── useWebSocket.js
│   │
│   ├── files/
│   │   ├── FileUpload.jsx
│   │   ├── FileList.jsx
│   │   └── FilePreview.jsx
│   │
│   ├── search/
│   │   ├── AdvancedSearch.jsx
│   │   ├── SearchFilters.jsx
│   │   └── SearchResults.jsx
│   │
│   ├── dashboard/
│   │   ├── ExecutiveDashboard.jsx
│   │   ├── EngineeringDashboard.jsx
│   │   └── MetricsCard.jsx
│   │
│   └── audit/
│       ├── AuditLog.jsx
│       └── DiffViewer.jsx
```

---

## 🔐 **SECURITY CHECKLIST**

- [x] Authentication (JWT)
- [x] Authorization (Role-based)
- [ ] Rate limiting (NEW)
- [ ] Input validation (ENHANCED)
- [ ] SQL injection prevention (VERIFY)
- [ ] XSS prevention (NEW)
- [ ] CSRF protection (NEW)
- [ ] File upload security (NEW)
- [ ] Audit logging (NEW)
- [ ] HTTPS enforcement (PRODUCTION)
- [ ] Secret management (ENV VARS)
- [ ] Database encryption (OPTIONAL)

---

## 📊 **SUCCESS METRICS**

**Performance:**
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- File upload speed > 10MB/s
- WebSocket latency < 100ms

**Reliability:**
- Uptime: 99.9%
- Error rate: < 0.1%
- Failed notification rate: < 1%

**User Experience:**
- Page load time < 2s
- Search results < 500ms
- Real-time updates < 1s latency

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Phase 1: Development (Week 1)**
```bash
# Build locally
docker-compose -f docker-compose.dev.yml up

# Run tests
mvn test
npm test

# Verify all features
```

### **Phase 2: Staging (Week 2)**
```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Load testing
k6 run load-test.js

# User acceptance testing
```

### **Phase 3: Production (Week 3)**
```bash
# Deploy to production
kubernetes apply -f k8s/production/

# Monitor metrics
kubectl get pods
kubectl logs -f <pod-name>

# Verify health
curl https://plm.tcs.com/actuator/health
```

---

## 🎯 **NEXT STEPS**

**Immediate:**
1. Start with notification service (highest impact)
2. Implement file upload (most requested)
3. Add WebSocket real-time updates

**After 3 weeks:**
1. Gather user feedback
2. Fix bugs and polish UX
3. Plan v2.0 features based on usage

---

**STATUS: READY TO BUILD** ✅  
**ESTIMATED EFFORT: 3 weeks full-time** 💪  
**QUALITY TARGET: Enterprise Production-Ready** 🏆  

**LET'S BUILD THIS!** 🚀
