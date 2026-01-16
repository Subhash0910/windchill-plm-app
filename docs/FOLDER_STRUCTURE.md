# Complete Folder Structure

## Backend - 5 Maven Modules

```
windchill-backend/
├── pom.xml                          # Parent POM
├── README.md
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── .maven-wrapper/
├── mvnw
├── mvnw.cmd
├═────────────═───═─═─═─═
├── backend-common/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/windchill/common/
│   │   │   │   ├── constants/
│   │   │   │   │   ├── APIConstants.java
│   │   │   │   │   ├── ErrorConstants.java
│   │   │   │   │   └── AppConstants.java
│   │   │   │   ├── utils/
│   │   │   │   │   ├── DateUtils.java
│   │   │   │   │   ├── StringUtils.java
│   │   │   │   │   ├── FileUtils.java
│   │   │   │   │   └── ValidationUtils.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── BaseResponseDTO.java
│   │   │   │   │   ├── ApiResponse.java
│   │   │   │   │   ├── ErrorResponse.java
│   │   │   │   │   └── PaginationDTO.java
│   │   │   │   ├── exceptions/
│   │   │   │   │   ├── BusinessException.java
│   │   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   │   ├── UnauthorizedException.java
│   │   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │   ├── enums/
│   │   │   │   │   ├── StatusEnum.java
│   │   │   │   │   ├── RoleEnum.java
│   │   │   │   │   └── ObjectTypeEnum.java
│   │   │   │   └── config/
│   │   │   │       ├── ApplicationProperties.java
│   │   │   │       ├── JacksonConfig.java
│   │   │   │       └── LoggingConfig.java
│   │   │   └── resources/
│   │   └── test/java/com/windchill/common/
└═───────────═───═─═─═─═
├── backend-domain/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/windchill/domain/
│   │   │   │   ├── entity/
│   │   │   │   │   ├── BaseEntity.java
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Project.java
│   │   │   │   │   ├── Product.java
│   │   │   │   │   ├── Document.java
│   │   │   │   │   └── ...
│   │   │   │   ├── model/
│   │   │   │   │   ├── AccessControl.java
│   │   │   │   │   ├── LifecycleState.java
│   │   │   │   │   └── Versioning.java
│   │   │   │   └── specification/
│   │   │   │       ├── ProductSpecification.java
│   │   │   │       └── DocumentSpecification.java
│   │   │   └── resources/
│   │   └── test/
└═───────────═───═─═─═─═
├── backend-repository/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/windchill/repository/
│   │   │   │   ├── base/
│   │   │   │   │   └── BaseRepository.java
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ProjectRepository.java
│   │   │   │   ├── ProductRepository.java
│   │   │   │   │   ... (more repositories)
│   │   │   │   ├── mapper/
│   │   │   │   │   ├── UserMapper.java
│   │   │   │   │   ├── ProductMapper.java
│   │   │   │   │   └── BaseMapper.java
│   │   │   │   └── config/
│   │   │   │       ├── DataSourceConfig.java
│   │   │   │       └── DatabaseMigration.java
│   │   │   └── resources/
│   │   └── test/
└═───────────═───═─═─═─═
├── backend-service/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/windchill/service/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   └── AuthenticationFilter.java
│   │   │   │   ├── user/
│   │   │   │   │   ├── IUserService.java
│   │   │   │   │   ├── UserServiceImpl.java
│   │   │   │   │   └── UserValidator.java
│   │   │   │   ├── product/
│   │   │   │   │   ├── IProductService.java
│   │   │   │   │   ├── ProductServiceImpl.java
│   │   │   │   │   ├── ProductVersioningService.java
│   │   │   │   │   └── BomService.java
│   │   │   │   ├── document/
│   │   │   │   │   ... (document services)
│   │   │   │   ├── workflow/
│   │   │   │   │   ... (workflow services)
│   │   │   │   └── cache/
│   │   │   │       ├── CacheConfig.java
│   │   │   │       └── CacheManager.java
│   │   │   └── resources/
│   │   └── test/
└═───────────═───═─═─═─═
├── backend-api/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/windchill/api/
│   │   │   │   ├── controller/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── UserController.java
│   │   │   │   │   ├── ProjectController.java
│   │   │   │   │   ├── ProductController.java
│   │   │   │   │   ... (more controllers)
│   │   │   │   ├── advice/
│   │   │   │   │   ├── RestExceptionHandler.java
│   │   │   │   │   └── ValidationAdvice.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   └── RoleBasedAccessControl.java
│   │   │   │   └── config/
│   │   │   │       ├── OpenApiConfig.java
│   │   │   │       └── AppStartupConfig.java
│   │   │   ├── resources/
│   │   │   │   ├── application.yml
│   │   │   │   ├── application-dev.yml
│   │   │   │   ├── application-prod.yml
│   │   │   │   ├── logback-spring.xml
│   │   │   │   └── db/migration/
│   │   │   │       ├── V1__initial_schema.sql
│   │   │   │       ├── V2__add_audit_tables.sql
│   │   │   │       └── V3__add_indexes.sql
│   │   └── test/
├── pom.xml
```

## Frontend - React with Vite

```
windchill-frontend/
├── node_modules/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── index.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   ├── theme.css
│   │   └── animations.css
│   ├── config/
│   │   ├── api.config.js
│   │   ├── auth.config.js
│   │   ├── constants.js
│   │   └── environments.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── UserContext.jsx
│   │   ├── ProjectContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useFetch.js
│   │   ├── useLocalStorage.js
│   │   ├── useDebounce.js
│   │   ├── useForm.js
│   │   ├── useNotification.js
│   │   └── useWindowResize.js
│   ├── utils/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── formatters.js
│   │   ├── dateUtils.js
│   │   ├── errorHandler.js
│   │   └── localStorage.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── projectService.js
│   │   ├── productService.js
│   │   ├── documentService.js
│   │   ├── workflowService.js
│   │   ├── searchService.js
│   │   ├── reportService.js
│   │   └── notificationService.js
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.test.jsx
│   │   │   ├── Input/
│   │   │   ├── Label/
│   │   │   ├── Badge/
│   │   │   ├── Icon/
│   │   │   ├── Tooltip/
│   │   │   ├── Tag/
│   │   │   ├── Spinner/
│   │   │   ├── Avatar/
│   │   └── Typography/
│   │   ├── molecules/
│   │   │   ├── FormField/
│   │   │   ├── SearchBar/
│   │   │   ├── Pagination/
│   │   │   ├── Breadcrumb/
│   │   │   ├── Notification/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Dropdown/
│   │   │   ├── TabsComponent/
│   │   │   ├── DatePicker/
│   │   └── FileUpload/
│   │   ├── organisms/
│   │   │   ├── Header/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Header.module.css
│   │   │   │   ├── Navigation.jsx
│   │   │   │   └── UserMenu.jsx
│   │   │   ├── Sidebar/
│   │   │   ├── FolderTree/
│   │   │   ├── DataTable/
│   │   │   ├── Form/
│   │   │   ├── FilterPanel/
│   │   │   ├── WorkflowTimeline/
│   │   │   ├── BOM/
│   │   └── DocumentPreview/
│   │   ├── templates/
│   │   │   ├── DashboardTemplate.jsx
│   │   │   ├── ProjectContextTemplate.jsx
│   │   │   ├── ProductContextTemplate.jsx
│   │   │   ├── DocumentContextTemplate.jsx
│   │   │   ├── SettingsTemplate.jsx
│   │   │   ├── ReportTemplate.jsx
│   │   │   ├── SearchTemplate.jsx
│   │   └── AuthTemplate.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── WidgetList.jsx
│   │   │   └── RecentActivityPanel.jsx
│   │   ├── product/
│   │   │   ├── ProductListPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── ProductCreatePage.jsx
│   │   │   ├── ProductEditPage.jsx
│   │   │   └── BOMViewer.jsx
│   │   ├── document/
│   │   │   ├── DocumentListPage.jsx
│   │   │   ├── DocumentDetailPage.jsx
│   │   │   ├── DocumentUploadPage.jsx
│   │   │   └── DocumentWorkflowPage.jsx
│   │   ├── workflow/
│   │   │   ├── WorkflowListPage.jsx
│   │   │   ├── ApprovalPage.jsx
│   │   │   └── ChangeNoticeManager.jsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── GeneralSettings.jsx
│   │   │   └── AdminSettings.jsx
│   │   └── notfound/
│   │       ├── NotFoundPage.jsx
│   │       └── ErrorBoundary.jsx
│   ├── layouts/
│   │   ├── MainLayout.jsx
│   │   ├── AuthLayout.jsx
│   │   ├── ContextLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── routing/
│   │   ├── AppRoutes.jsx
│   │   ├── PrivateRoute.jsx
│   │   ├── PublicRoute.jsx
│   │   └── routeConfig.js
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── videos/
│   │   └── documents/
│   └── __tests__/
│       ├── unit/
│       └── integration/
├── .env.dev
├── .env.prod
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js
├── Dockerfile
├── nginx.conf
└── README.md
```

## Root Level

```
windchill-plm-app/
├── windchill-backend/          (Maven multi-module project)
├── windchill-frontend/         (Vite + React project)
├── docker-compose.yml          (Local development with containers)
├── docs/
│   ├── SETUP_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── BEST_PRACTICES.md
│   └── DATABASE_SCHEMA.md
├── .gitignore
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

---

**Total Structure**: ~200+ files organized for scalability and team collaboration
