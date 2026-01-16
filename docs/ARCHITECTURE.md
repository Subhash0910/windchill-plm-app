# Architecture - Windchill PLM Application

## Overview

This application follows a layered, modular architecture inspired by Windchill PLM, emphasizing clean code, separation of concerns, and scalability.

## Backend Architecture

### Layered Structure

```
┌─────────────────────────────────────┐
│      API Layer (Controllers)        │  REST Endpoints
├─────────────────────────────────────┤
│      Service Layer (Business Logic) │  Business Rules
├─────────────────────────────────────┤
│   Repository Layer (Data Access)    │  Database Operations
├─────────────────────────────────────┤
│    Domain Layer (Entities/Models)   │  Data Models
├─────────────────────────────────────┤
│           Database (MySQL)          │  Persistence
└─────────────────────────────────────┘
```

### Modular Structure

5 Independent Maven Modules:

1. **backend-common**: Shared utilities, constants, exceptions
2. **backend-domain**: JPA entities, domain models
3. **backend-repository**: Spring Data repositories
4. **backend-service**: Business logic services
5. **backend-api**: REST controllers, exception handlers

### Dependency Flow

```
backend-api
   ├─ depends on → backend-service
   ├─ depends on → backend-repository
   └─ depends on → backend-domain
        ├─ depends on → backend-common
        └─ depends on → backend-repository
```

## Frontend Architecture

### Component Hierarchy (Atomic Design)

```
┌──────────────────────────────────────┐
│       Pages (Full Page Views)        │
├──────────────────────────────────────┤
│    Templates (Layout Containers)     │
├──────────────────────────────────────┤
│  Organisms (Complex UI Sections)     │
├──────────────────────────────────────┤
│   Molecules (UI Component Groups)    │
├──────────────────────────────────────┤
│      Atoms (Basic Elements)          │
└──────────────────────────────────────┘
```

### Folder Structure

```
src/
├── components/
│   ├── atoms/          # Button, Input, Label, Icon
│   ├── molecules/      # FormField, Card, SearchBar
│   ├── organisms/      # Header, Sidebar, DataTable
│   └── templates/      # MainLayout, AuthLayout
├── pages/              # Page components
├── routing/            # Routes, PrivateRoute, PublicRoute
├── hooks/              # Custom React hooks
├── services/           # API service calls
├── context/            # React Context for state
├── utils/              # Helper utilities
├── styles/             # Global CSS
└── config/             # Configuration files
```

## Data Flow

### Request Flow (Backend)

```
1. HTTP Request
   ↓
2. Controller receives request
   ↓
3. Validates input data
   ↓
4. Calls Service layer
   ↓
5. Service applies business logic
   ↓
6. Calls Repository layer
   ↓
7. Repository queries database
   ↓
8. Data returned to Service
   ↓
9. Service returns to Controller
   ↓
10. Controller returns HTTP Response
```

### State Flow (Frontend)

```
1. User Interaction (click, input)
   ↓
2. Component calls Hook (useApi)
   ↓
3. Hook makes API call via Service
   ↓
4. API Service calls Backend
   ↓
5. Backend processes request
   ↓
6. Response returned to Hook
   ↓
7. Hook updates state
   ↓
8. Component re-renders with new data
```

## Key Design Patterns

### Backend Patterns

1. **Repository Pattern**: Data access abstraction
2. **Service Pattern**: Business logic encapsulation
3. **DTO Pattern**: Data transfer with separate objects
4. **Dependency Injection**: Spring manages dependencies
5. **Exception Handling**: Global exception handler
6. **Transactional**: @Transactional for data consistency

### Frontend Patterns

1. **Component Composition**: Atoms → Molecules → Organisms
2. **Custom Hooks**: Reusable logic
3. **Context API**: State management
4. **Service Layer**: API call centralization
5. **Protected Routes**: Authentication-based routing

## Security Architecture

### Authentication

```
1. User Login
   ↓
2. Credentials validated
   ↓
3. JWT token generated
   ↓
4. Token stored in localStorage
   ↓
5. Token sent with each request (Authorization header)
   ↓
6. Backend validates token
   ↓
7. Request processed or rejected
```

### Authorization

- Role-Based Access Control (RBAC)
- Roles: ADMIN, PROJECT_MANAGER, ENGINEER, REVIEWER, VIEWER
- Spring Security @PreAuthorize annotations

## Database Schema

### Core Tables

- **users**: User accounts and profiles
- **projects**: Project contexts
- **products**: Product information and versioning
- **documents**: Document management
- **workflows**: Workflow and approval states
- **folders**: Hierarchical folder structure
- **audit_logs**: Activity tracking

### Entity Relationships

```
Projects ─── Products
  │            │
  ├─ Folders   ├─ Versions
  │            ├─ BOMs
  └─ Users     └─ Documents
                    │
                    ├─ Versions
                    ├─ Workflows
                    └─ Approvals
```

## Performance Optimizations

### Backend

1. **Database Indexing**: Indexes on frequently queried columns
2. **Caching**: Redis for session and frequently accessed data
3. **Connection Pooling**: HikariCP for database connections
4. **Query Optimization**: JPA specifications and custom queries
5. **Pagination**: Large result sets paginated

### Frontend

1. **Code Splitting**: Lazy loading of components
2. **Memoization**: React.memo for expensive components
3. **Bundle Optimization**: Webpack chunking
4. **Image Optimization**: Compressed assets
5. **API Caching**: Axios cache interceptor

## Deployment Architecture

### Development

- Local Maven build
- Local React dev server
- Local MySQL + Redis

### Docker

- Containerized MySQL
- Containerized Redis
- Containerized Backend (Spring Boot)
- Containerized Frontend (Nginx)
- Docker Compose orchestration

### Production

- MySQL Cluster (or RDS)
- Redis Cluster (or ElastiCache)
- Spring Boot instances (Kubernetes or Tomcat)
- Nginx reverse proxy
- SSL/TLS certificates
- Load balancer

## API Communication

### RESTful Conventions

- **GET**: Retrieve resource(s)
- **POST**: Create new resource
- **PUT**: Update resource
- **DELETE**: Delete resource
- **PATCH**: Partial update (optional)

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Resource data */ },
  "timestamp": "2024-01-16T13:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2024-01-16T13:30:00Z"
}
```

## Technology Stack

### Backend

- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security + JWT
- MySQL 8.0
- Redis
- Maven
- Docker

### Frontend

- React 18+
- React Router v6
- Axios
- Zustand (State management)
- Vite (Build tool)
- Docker

## Monitoring & Logging

### Backend

- SLF4J + Logback
- Structured logging
- Actuator endpoints
- Spring Boot Admin (optional)

### Frontend

- Console logging
- Error boundary logging
- User activity tracking

## Future Enhancements

1. Microservices architecture
2. Message queue (RabbitMQ/Kafka)
3. Full-text search (Elasticsearch)
4. Machine learning integration
5. Real-time notifications (WebSockets)
6. Advanced analytics

---

**Architecture decisions prioritize scalability, maintainability, and performance.**
