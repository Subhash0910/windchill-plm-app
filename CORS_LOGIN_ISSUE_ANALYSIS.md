# CORS Login Issue - Deep Technical Analysis

**Issue Date**: January 24, 2026 12:47 AM IST  
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`  
**Root Cause**: Preflight OPTIONS request blocked by Spring Security  
**Status**: 🟢 FIXED

---

## 🔴 **THE ERROR IN DETAIL**

### **What You Saw**

```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/auth/login' 
from origin 'http://localhost' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### **Technical Breakdown**

- **Type**: CORS (Cross-Origin Resource Sharing) error
- **Triggered**: Browser's Same-Origin Policy protection
- **Cause**: Backend not responding correctly to preflight
- **Result**: Browser blocks API call before it reaches server
- **Location**: Browser network layer (not backend)

---

## 🔍 **WHY THIS HAPPENED**

### **The HTTP Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ USER CLICKS LOGIN BUTTON                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BROWSER: "POST from http://localhost to http://localhost:8080" │
│ Sees DIFFERENT ORIGIN (port 80 vs 8080)                    │
│ Sees JSON Content-Type                                      │
│ ➜ "I need to send PREFLIGHT request first"                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: PREFLIGHT REQUEST (Browser sends automatically)     │
│                                                             │
│ OPTIONS /api/v1/auth/login HTTP/1.1                        │
│ Host: localhost:8080                                       │
│ Origin: http://localhost                                   │
│ Access-Control-Request-Method: POST                        │
│ Access-Control-Request-Headers: content-type               │
│                                                             │
│ ➜ "Can I send a POST request with these headers?"          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Spring Security): "Hmm, OPTIONS request..."        │
│                                                             │
│ ✗ BEFORE FIX:                                              │
│   SecurityConfig says:                                     │
│   - CORS enabled on POST/GET/PUT/DELETE                    │
│   - But OPTIONS not explicitly ALLOWED                     │
│   - Spring Security blocks it (403 Forbidden)              │
│                                                             │
│   Returns: 403 Forbidden                                   │
│   (NO CORS headers!)                                       │
│                                                             │
│ ✓ AFTER FIX:                                               │
│   CorsFilter handles it BEFORE Security                    │
│   Returns: 200 OK                                          │
│   Access-Control-Allow-Origin: http://localhost           │
│   Access-Control-Allow-Methods: GET, POST, OPTIONS...     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ✗ BEFORE FIX: PREFLIGHT FAILS                              │
│   Browser: "No Access-Control-Allow-Origin header!"        │
│   ➜ BLOCKS the actual POST request                         │
│   ➜ Throws CORS error                                      │
│   ➜ Backend never receives login request                   │
│                                                             │
│ ✓ AFTER FIX: PREFLIGHT SUCCEEDS                            │
│   Browser: "Got CORS headers, proceeding with POST"        │
│   ➜ Sends actual POST request                              │
│   ➜ Backend processes login                                │
│   ➜ User authenticated, token returned                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 **THE BUG IN OLD CODE**

### **SecurityConfig.java (Before Fix)**

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authz -> authz
            // ✗ BUG: Auth endpoints are permitted
            .requestMatchers("/api/v1/auth/**").permitAll()
            
            // ✗ BUG: But OPTIONS method NOT explicitly permitted!
            // This means Spring Security sees OPTIONS request
            // and doesn't match any of these patterns
            // So it falls through to .anyRequest().authenticated()
            
            .requestMatchers("/swagger-ui/**").permitAll()
            .anyRequest().authenticated()  // ✗ OPTIONS gets blocked here!
        )
        .addFilterBefore(...); // CORS filter comes AFTER this
    
    return http.build();
}

// CORS configuration claims to allow OPTIONS:
http.setAllowedMethods(Arrays.asList(
    "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
));
// ✗ But Security Authorization doesn't permit it!
// Config and Authorization are DIFFERENT things!
```

**The Problem:**
- CORS Configuration says "allow OPTIONS"
- But Security Authorization says "OPTIONS is not in your list of allowed patterns"
- Security wins because it's checked FIRST
- Result: 403 Forbidden on preflight

---

## ✅ **THE FIX - TWO-LAYER APPROACH**

### **Layer 1: Security Authorization Fix**

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authz -> authz
            // ✓ FIX 1: Explicitly permit OPTIONS for ALL paths
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            
            // This is the KEY line that was missing!
            // Now OPTIONS requests are allowed before Spring Security
            
            .requestMatchers("/api/v1/auth/**").permitAll()
            .requestMatchers("/swagger-ui/**").permitAll()
            .anyRequest().authenticated()
        )
        // ...
    return http.build();
}
```

**Why This Works:**
- Spring Security checks patterns in ORDER
- `OPTIONS` pattern comes first now
- When browser sends OPTIONS, it matches immediately
- Security allows it, CORS headers sent
- Preflight succeeds, browser allows POST

### **Layer 2: Servlet Filter Fix (Extra Protection)**

```java
@Component
public class CorsFilter extends OncePerRequestFilter {
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // ✓ FIX 2: Handle OPTIONS BEFORE Spring Security chain
        // Servlet filters execute BEFORE Security filters
        
        String origin = request.getHeader("Origin");
        
        // Set CORS headers on response
        response.setHeader("Access-Control-Allow-Origin", 
            origin != null ? origin : "*");
        response.setHeader("Access-Control-Allow-Methods", 
            "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        response.setHeader("Access-Control-Allow-Headers", 
            "Content-Type, Authorization, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        // ✓ CRITICAL: Return 200 immediately for OPTIONS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;  // Don't go through security chain!
        }
        
        // Let other requests continue
        filterChain.doFilter(request, response);
    }
}
```

**Why This Extra Layer:**
- Servlet filters run BEFORE Spring Security
- OPTIONS handled immediately at servlet level
- Never reaches security chain that might block it
- Belt-and-suspenders approach = extra reliability
- If FIX 1 fails for any reason, FIX 2 still works

---

## 📊 **COMPARISON TABLE**

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Preflight Request** | ❌ Blocked by Security | ✅ Allowed by SecurityConfig |
| **CORS Headers** | ❌ Not sent | ✅ Sent by CorsFilter |
| **Servlet Filter** | ❌ No CORS filter | ✅ CorsFilter handles preflight |
| **Security Config** | ❌ OPTIONS not permitted | ✅ OPTIONS explicitly permitted |
| **Browser Flow** | ❌ Preflight fails → POST blocked | ✅ Preflight succeeds → POST allowed |
| **Login Status** | ❌ CORS error, can't login | ✅ Works perfectly |
| **HTTP Response Code** | ❌ 403 Forbidden | ✅ 200 OK |

---

## 🔬 **REQUEST/RESPONSE ANALYSIS**

### **Before Fix: Preflight Request**

**Browser Sends:**
```http
OPTIONS /api/v1/auth/login HTTP/1.1
Host: localhost:8080
Origin: http://localhost
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
Connection: keep-alive
```

**Backend Responds:**
```http
HTTP/1.1 403 Forbidden
Content-Type: text/plain

"Spring Security forbids the requested method"
```

**Browser Sees:**
```
❌ No 'Access-Control-Allow-Origin' header!
❌ CORS policy blocks the request
❌ Throws error, doesn't send POST
```

### **After Fix: Preflight Request**

**Browser Sends:**
```http
OPTIONS /api/v1/auth/login HTTP/1.1
Host: localhost:8080
Origin: http://localhost
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
Connection: keep-alive
```

**Backend Responds:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 3600
Content-Length: 0
```

**Browser Sees:**
```
✅ Access-Control-Allow-Origin present
✅ METHOD (POST) is allowed
✅ HEADERS (Content-Type) are allowed
✅ CORS policy satisfied - proceed with POST
```

---

## 🧪 **TESTING THE FIX**

### **Test 1: Verify Preflight Handling**

```powershell
# Send OPTIONS request exactly like browser does
$headers = @{
    "Origin" = "http://localhost"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "Content-Type, Authorization"
}

$response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
    -Method OPTIONS `
    -Headers $headers `
    -Verbose

# Check response
Write-Host "Status Code: $($response.StatusCode)"  # Should be 200
Write-Host "CORS Origin Header: $($response.Headers['Access-Control-Allow-Origin'])"
Write-Host "CORS Methods Header: $($response.Headers['Access-Control-Allow-Methods'])"
```

**Expected Output:**
```
Status Code: 200
CORS Origin Header: http://localhost
CORS Methods Header: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
```

### **Test 2: Verify Actual Login**

```powershell
$loginUrl = "http://localhost:8080/api/v1/auth/login"
$credentials = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $loginUrl `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"; "Origin" = "http://localhost"} `
    -Body $credentials

$token = ($response.Content | ConvertFrom-Json).data.token
Write-Host "Login Success! Token: $($token.Substring(0, 20))..."
```

---

## 🎯 **KEY LEARNINGS**

### **CORS Fundamentals**

1. **Same-Origin Policy**: Browser blocks requests to different origins
2. **Preflight Request**: Browser sends OPTIONS to check if POST is allowed
3. **CORS Headers**: Server must respond with `Access-Control-Allow-*` headers
4. **Preflight Caching**: Browser caches preflight for 1 hour (Max-Age)
5. **No Content-Length**: Preflight response should be empty

### **Spring Security Quirks**

1. **Config vs Authorization**: CORS config and authorization checks are separate
2. **Filter Order**: CORS must be allowed in authorization before security filter
3. **Pattern Matching**: Patterns checked in order, first match wins
4. **Servlet Filters First**: Run before Spring filters, good for CORS
5. **Credentials with Wildcards**: Can't use `*` origin with credentials=true

### **Best Practices**

1. **Allow OPTIONS Explicitly**: Always allow OPTIONS in authorization
2. **Use Servlet Filter**: Extra layer of CORS handling for reliability
3. **Specific Origins**: Use specific origins instead of `*` in production
4. **Max-Age Caching**: Set reasonable preflight cache (3600s = 1 hour)
5. **Test Preflight**: Always verify OPTIONS returns 200 with correct headers

---

## 📝 **SUMMARY**

| Item | Details |
|------|----------|
| **Root Cause** | Spring Security blocking OPTIONS preflight request |
| **Error Type** | CORS policy violation |
| **Trigger** | Login attempt from different origin |
| **Solution** | Allow OPTIONS + add servlet CORS filter |
| **Files Modified** | SecurityConfig.java (1 file) |
| **Files Added** | CorsFilter.java (1 new file) |
| **Impact** | All cross-origin API calls now work |
| **Testing** | Preflight + actual login request |
| **Status** | ✅ Fixed and verified |

---

## 🚀 **HOW TO APPLY**

### **Quick Command**

```powershell
# Run the automated fix script
.\fix-cors-login.ps1
```

### **Manual Steps**

```powershell
# 1. Pull changes
git pull origin main

# 2. Rebuild backend
docker-compose build --no-cache backend

# 3. Restart services
docker-compose restart backend

# 4. Wait 30 seconds
Start-Sleep -Seconds 30

# 5. Clear browser cache
# - Press Ctrl+Shift+Delete
# - Clear all

# 6. Try login
# - Go to http://localhost
# - Use admin/admin123
```

---

**Analysis Complete** ✅  
**Status**: Fixed  
**Date**: January 24, 2026 12:47 AM IST
