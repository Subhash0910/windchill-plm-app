# Windchill PLM-Inspired Full-Stack Application

**Enterprise-grade Java Spring Boot + React application with Windchill-like architecture**

![Status](https://img.shields.io/badge/Status-Active-green)
![Java](https://img.shields.io/badge/Java-17-blue)
![Spring%20Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![React](https://img.shields.io/badge/React-18%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Overview

A production-ready, enterprise-grade PLM (Product Lifecycle Management) application inspired by Windchill's architecture. Features modular backend with Spring Boot microservices and atomic design frontend with React.

### ✨ Key Features

- **Modular Architecture**: 5 independent Maven modules (Common, Domain, Repository, Service, API)
- **Context-Based Organization**: Projects, Products, Libraries (Windchill-like)
- **Atomic Design Frontend**: Atoms → Molecules → Organisms → Templates → Pages
- **Enterprise Security**: JWT authentication + Spring Security
- **Workflow Management**: Approval gates and lifecycle states
- **Audit Logging**: Complete activity trails
- **Caching Layer**: Redis-ready for performance
- **Docker Support**: Containerized deployment ready
- **API Documentation**: Swagger/OpenAPI included

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0+
- Redis 6.0+ (optional, for caching)

### Backend Setup

```bash
cd windchill-backend
mvn clean install
mvn spring-boot:run -pl backend-api
```

Backend runs on: `http://localhost:8080/api/v1`

### Frontend Setup

```bash
cd windchill-frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Docker Setup

```bash
docker-compose up -d
```

## 📁 Project Structure

```
windchill-plm-app/
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
├── windchill-backend/              # Backend (Spring Boot)
│   ├── backend-common/             # Shared utilities
│   ├── backend-domain/             # Entities & models
│   ├── backend-repository/         # Data access layer
│   ├── backend-service/            # Business logic
│   └── backend-api/                # REST API & controllers
├── windchill-frontend/             # Frontend (React)
│   ├── src/
│   │   ├── components/             # Atomic design
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API services
│   │   ├── context/                # React context
│   │   └── utils/                  # Utilities
│   ├── public/
│   └── package.json
├── docker-compose.yml              # Docker orchestration
├── .gitignore
└── LICENSE
```

## 🏗️ Architecture

### Backend Layers

```
API Controllers (REST endpoints)
    ↓
Services (Business logic)
    ↓
Repositories (Data access)
    ↓
Entities (Domain models)
    ↓
Database (MySQL)
```

### Frontend Components

```
Pages (Full page components)
    ↓
Templates (Page layouts)
    ↓
Organisms (Complex UI sections)
    ↓
Molecules (UI components groups)
    ↓
Atoms (Basic elements)
```

## 🔐 Authentication

- JWT tokens for stateless authentication
- Spring Security for authorization
- Role-based access control (RBAC)
- Protected API routes

## 📊 API Endpoints

### Core Endpoints

```
/api/v1/auth
  POST   /login
  POST   /register
  POST   /logout
  POST   /refresh-token

/api/v1/contexts
  GET    /projects
  POST   /projects
  GET    /products
  POST   /products

/api/v1/products
  GET    /
  POST   /
  GET    /{id}
  PUT    /{id}
  DELETE /{id}

/api/v1/documents
  GET    /
  POST   /
  GET    /{id}/versions
  POST   /{id}/approve

/api/v1/workflows
  GET    /
  POST   /
  GET    /{id}/approvals
  POST   /{id}/approve
```

## 🧪 Testing

### Backend

```bash
cd windchill-backend
mvn test
mvn test -pl backend-service
```

### Frontend

```bash
cd windchill-frontend
npm run test
npm run test:coverage
```

## 📦 Deployment

### Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

## 📚 Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Best Practices](./docs/BEST_PRACTICES.md)

## 🛠️ Tech Stack

### Backend

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build**: Maven 3.8+
- **Database**: MySQL 8.0
- **Cache**: Redis 6.0
- **Security**: Spring Security + JWT
- **API Docs**: Swagger/OpenAPI

### Frontend

- **Framework**: React 18+
- **Build**: Vite
- **Language**: JavaScript (ES6+)
- **Styling**: CSS3 + CSS Variables
- **State**: React Context + Hooks
- **HTTP Client**: Axios
- **Router**: React Router v6

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

**Subhash0910**

## 📞 Support

For issues, questions, or suggestions:
- Create an Issue on GitHub
- Check existing Issues for solutions
- Review Documentation

## 🎯 Roadmap

- [ ] Phase 1: Foundation (Week 1)
- [ ] Phase 2: Core Features (Week 2-3)
- [ ] Phase 3: Advanced Features (Week 4+)
- [ ] Phase 4: Polish & Deploy (Final)

---

**Happy Coding! 🚀**
