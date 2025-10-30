# Application Deployment System
## Multi-Application Deployment Platform

### Version: 1.0
### Date: October 30, 2025
### Prepared by: Development Team

---

## Table of Contents
1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [Technology Stack](#technology-stack)
7. [Database Design](#database-design)
8. [API Specifications](#api-specifications)
9. [Security Requirements](#security-requirements)
10. [Implementation Plan](#implementation-plan)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for a Multi-Application Deployment Platform that enables users to deploy applications to EC2 instances through GitHub repository authorization, with automatic SSL certificate provisioning and domain management.

### 1.2 Project Overview
A comprehensive cloud-based platform that simplifies application deployment through:
- **Microservices Architecture**: Scalable, maintainable service-oriented design
- **Serverless Components**: AWS Lambda functions using Serverless Framework
- **Modern Frontend**: Next.js application with responsive design
- **Automated Deployment**: One-click deployment to multiple servers
- **SSL Management**: Automatic certificate provisioning and renewal
- **Domain Integration**: DNS configuration and A-record management

### 1.3 Key Benefits
- Reduce deployment time from hours to minutes
- Eliminate manual server configuration
- Automatic SSL certificate management
- Support for unlimited applications and servers
- Real-time monitoring and logging
- Scalable microservices architecture

---

## 2. System Overview

### 2.1 High-Level System Description
The platform consists of a microservices-based backend, serverless processing components, and a modern web frontend that work together to provide seamless application deployment capabilities.

**Core Capabilities:**
- Multi-tenant user management
- GitHub/GitLab repository integration
- Dynamic server configuration
- Automated build and deployment pipelines
- SSL certificate automation (Let's Encrypt)
- Domain management and DNS configuration
- Real-time monitoring and alerting

### 2.2 User Journey
```mermaid
graph TD
    A[User Registration] --> B[Connect GitHub Account]
    B --> C[Add Repository]
    C --> D[Configure Server]
    D --> E[Create Application]
    E --> F[Configure Domain]
    F --> G[Deploy Application]
    G --> H[Monitor & Manage]
    
    H --> I[Add More Apps]
    I --> C
    
    H --> J[Add More Servers]
    J --> D
```

---

## 3. Architecture Diagrams

### 3.1 System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Next.js Frontend<br/>Vercel/CDN]
    end
    
    subgraph "API Layer"
        ALB[Application Load Balancer<br/>AWS ALB + SSL]
        AG[API Gateway<br/>Rate Limiting & Auth]
    end
    
    subgraph "Microservices Layer"
        US[User Service<br/>Authentication & Authorization]
        RS[Repository Service<br/>Git Integration]
        SS[Server Service<br/>EC2 Management]
        DS[Deployment Service<br/>Build & Deploy]
        SSL[SSL Service<br/>Certificate Management]
        DOM[Domain Service<br/>DNS Configuration]
        MS[Monitoring Service<br/>Health & Metrics]
        NS[Notification Service<br/>Alerts & Webhooks]
    end
    
    subgraph "Serverless Layer"
        WH[Webhook Handler<br/>Lambda]
        DT[Deployment Trigger<br/>Lambda]
        SP[SSL Processor<br/>Lambda]
        HC[Health Check<br/>Lambda]
        CL[Cleanup Service<br/>Lambda]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB Atlas<br/>Primary Database)]
        CACHE[(Redis<br/>Cache & Sessions)]
        S3[(S3<br/>Build Artifacts)]
        SQS[SQS<br/>Message Queue]
        EB[EventBridge<br/>Event Bus]
    end
    
    subgraph "Target Infrastructure"
        EC2[EC2 Instances<br/>User Servers<br/>Nginx + Apps]
    end
    
    FE --> ALB
    ALB --> AG
    AG --> US
    AG --> RS
    AG --> SS
    AG --> DS
    AG --> SSL
    AG --> DOM
    AG --> MS
    AG --> NS
    
    US --> DB
    RS --> DB
    SS --> DB
    DS --> DB
    SSL --> DB
    DOM --> DB
    MS --> DB
    NS --> DB
    
    US --> CACHE
    RS --> CACHE
    
    DS --> S3
    DS --> SQS
    SSL --> SQS
    
    WH --> SQS
    DT --> SQS
    SP --> EB
    HC --> EB
    CL --> EB
    
    DS --> EC2
    SSL --> EC2
    DOM --> EC2
    MS --> EC2
```

### 3.2 Microservices Architecture Detail

```mermaid
graph TB
    subgraph "User Service"
        UA[Authentication Controller]
        UU[User Management]
        UR[Role Management]
        UA --> UU
        UU --> UR
    end
    
    subgraph "Repository Service"
        RG[GitHub Integration]
        RW[Webhook Handler]
        RB[Branch Management]
        RG --> RW
        RW --> RB
    end
    
    subgraph "Server Service"
        SC[Server Configuration]
        SH[Health Monitoring]
        SSH[SSH Management]
        SC --> SH
        SC --> SSH
    end
    
    subgraph "Deployment Service"
        DB[Build Pipeline]
        DD[Deploy Pipeline]
        DL[Log Management]
        DR[Rollback Service]
        DB --> DD
        DD --> DL
        DD --> DR
    end
    
    subgraph "SSL Service"
        SR[Certificate Request]
        SI[Certificate Install]
        SN[Auto Renewal]
        SR --> SI
        SI --> SN
    end
    
    subgraph "Domain Service"
        DC[Domain Configuration]
        DNS[DNS Management]
        DV[Domain Verification]
        DC --> DNS
        DC --> DV
    end
```

### 3.3 Deployment Pipeline Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant DS as Deployment Service
    participant Q as SQS Queue
    participant L as Lambda
    participant EC2 as Target Server
    participant SSL as SSL Service
    participant DOM as Domain Service
    
    U->>FE: Trigger Deployment
    FE->>DS: POST /deploy
    DS->>Q: Queue Build Job
    DS->>U: Return Job ID
    
    Q->>L: Trigger Build Lambda
    L->>L: Clone Repository
    L->>L: Run Build Process
    L->>EC2: Deploy to Server
    
    EC2->>SSL: Request SSL Certificate
    SSL->>EC2: Install Certificate
    
    EC2->>DOM: Configure Domain
    DOM->>EC2: Update Nginx Config
    
    L->>DS: Update Status
    DS->>FE: WebSocket Update
    FE->>U: Show Success
```

### 3.4 Data Flow Diagram

```mermaid
flowchart TD
    subgraph "Data Sources"
        GH[GitHub API]
        GL[GitLab API]
        LE[Let's Encrypt API]
        DNS[DNS Providers]
    end
    
    subgraph "Application Layer"
        API[REST API Services]
        WS[WebSocket Services]
        CRON[Scheduled Jobs]
    end
    
    subgraph "Processing Layer"
        BUILD[Build Engine]
        DEPLOY[Deploy Engine]
        CERT[Certificate Engine]
        MONITOR[Monitoring Engine]
    end
    
    subgraph "Storage Layer"
        MONGO[(MongoDB)]
        REDIS[(Redis Cache)]
        S3[(S3 Storage)]
        LOGS[(CloudWatch Logs)]
    end
    
    GH --> API
    GL --> API
    LE --> CERT
    DNS --> API
    
    API --> BUILD
    API --> DEPLOY
    API --> CERT
    WS --> MONITOR
    CRON --> CERT
    
    BUILD --> S3
    DEPLOY --> MONGO
    CERT --> MONGO
    MONITOR --> REDIS
    
    BUILD --> LOGS
    DEPLOY --> LOGS
    CERT --> LOGS
    MONITOR --> LOGS
```

### 3.5 Security Architecture

```mermaid
graph TB
    subgraph "External Access"
        CLIENT[Client Browser]
        BOT[Webhook Bots]
        API_USER[API Users]
    end
    
    subgraph "Security Layer"
        WAF[Web Application Firewall]
        CF[CloudFlare DDoS Protection]
        RL[Rate Limiter]
    end
    
    subgraph "Authentication Layer"
        JWT[JWT Tokens]
        OAUTH[OAuth Providers]
        MFA[Multi-Factor Auth]
    end
    
    subgraph "Authorization Layer"
        RBAC[Role-Based Access Control]
        ACL[Access Control Lists]
        POLICY[Security Policies]
    end
    
    subgraph "Data Protection"
        ENCRYPT[Data Encryption]
        SECRETS[Secrets Management]
        AUDIT[Audit Logging]
    end
    
    CLIENT --> WAF
    BOT --> WAF
    API_USER --> WAF
    
    WAF --> CF
    CF --> RL
    
    RL --> JWT
    JWT --> OAUTH
    OAUTH --> MFA
    
    MFA --> RBAC
    RBAC --> ACL
    ACL --> POLICY
    
    POLICY --> ENCRYPT
    ENCRYPT --> SECRETS
    SECRETS --> AUDIT
```

---

## 4. Functional Requirements

### 4.1 User Management (UM)
- **UM-001**: Users can register with email/password authentication
- **UM-002**: Users can authenticate via GitHub OAuth
- **UM-003**: Users can manage profile information
- **UM-004**: System supports role-based access (Admin, User)
- **UM-005**: Users can reset passwords via email
- **UM-006**: Users can enable two-factor authentication

### 4.2 Repository Management (RM)
- **RM-001**: Users can connect GitHub repositories via OAuth
- **RM-002**: Users can add GitLab repositories with access tokens
- **RM-003**: System can detect application frameworks automatically
- **RM-004**: Users can select deployment branches
- **RM-005**: System can handle private repositories securely
- **RM-006**: Users can configure build commands per repository

### 4.3 Server Management (SM)
- **SM-001**: Users can add multiple EC2 server configurations
- **SM-002**: System validates server connectivity via SSH
- **SM-003**: Users can categorize servers by environment
- **SM-004**: System can install required dependencies automatically
- **SM-005**: Users can manage SSH keys securely
- **SM-006**: System monitors server health and resources

### 4.4 Application Deployment (AD)
- **AD-001**: Users can create application deployment configurations
- **AD-002**: System supports multiple deployment strategies
- **AD-003**: Users can trigger manual deployments
- **AD-004**: System supports automatic deployments on git push
- **AD-005**: Users can roll back to previous deployments
- **AD-006**: System provides real-time deployment logs

### 4.5 SSL Certificate Management (SSL)
- **SSL-001**: System automatically requests SSL certificates
- **SSL-002**: System installs certificates on target servers
- **SSL-003**: System auto-renews certificates before expiration
- **SSL-004**: Users can view certificate status and expiry
- **SSL-005**: System supports custom CA certificates
- **SSL-006**: System handles wildcard certificates

### 4.6 Domain Management (DM)
- **DM-001**: Users can configure custom domains for applications
- **DM-002**: System provides DNS configuration instructions
- **DM-003**: System verifies domain ownership
- **DM-004**: System configures Nginx virtual hosts automatically
- **DM-005**: Users can manage subdomain routing
- **DM-006**: System supports multiple domains per application

### 4.7 Monitoring & Logging (ML)
- **ML-001**: System monitors application uptime and performance
- **ML-002**: Users can view real-time application logs
- **ML-003**: System sends deployment status notifications
- **ML-004**: Users can set up custom alerts
- **ML-005**: System tracks resource usage metrics
- **ML-006**: Users can export logs and metrics

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **NFR-P-001**: API response time < 500ms for 95% of requests
- **NFR-P-002**: Application deployment time < 10 minutes
- **NFR-P-003**: Frontend page load time < 3 seconds
- **NFR-P-004**: System supports 1000+ concurrent deployments
- **NFR-P-005**: Database query response time < 100ms

### 5.2 Scalability Requirements
- **NFR-S-001**: System scales horizontally to handle increased load
- **NFR-S-002**: Database supports 100,000+ applications
- **NFR-S-003**: System supports multi-region deployment
- **NFR-S-004**: Auto-scaling based on CPU/memory metrics
- **NFR-S-005**: Load balancing across multiple instances

### 5.3 Reliability Requirements
- **NFR-R-001**: System uptime 99.9% (8.76 hours downtime/year)
- **NFR-R-002**: Deployment success rate > 95%
- **NFR-R-003**: Automatic failover within 30 seconds
- **NFR-R-004**: Data backup and recovery procedures
- **NFR-R-005**: Zero-downtime deployments for platform updates

### 5.4 Security Requirements
- **NFR-SE-001**: All communications encrypted with TLS 1.3
- **NFR-SE-002**: Sensitive data encrypted at rest (AES-256)
- **NFR-SE-003**: Rate limiting: 100 requests/minute per user
- **NFR-SE-004**: Audit logging for all user actions
- **NFR-SE-005**: Regular security vulnerability scanning

### 5.5 Usability Requirements
- **NFR-U-001**: Intuitive web interface for non-technical users
- **NFR-U-002**: Mobile-responsive design
- **NFR-U-003**: Comprehensive documentation and tutorials
- **NFR-U-004**: Multi-language support (English, Spanish, French)
- **NFR-U-005**: Accessibility compliance (WCAG 2.1 AA)

---

## 6. Technology Stack

### 6.1 Frontend Stack
```yaml
Framework: Next.js 14
- TypeScript support
- Server-side rendering
- Static site generation
- API routes

UI/UX:
- Tailwind CSS for styling
- Headless UI for components
- Framer Motion for animations
- React Hook Form for forms

State Management:
- Zustand for global state
- React Query for server state
- Context API for auth state

Development Tools:
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Jest for testing
```

### 6.2 Backend Stack
```yaml
Runtime: Node.js 18+ LTS
Framework: Express.js
- RESTful API design
- Middleware support
- Error handling
- Request validation

Authentication:
- JWT tokens
- Passport.js strategies
- OAuth integration
- Session management

Validation & Documentation:
- Joi for request validation
- Swagger/OpenAPI docs
- Rate limiting middleware
- CORS configuration
```

### 6.3 Serverless Stack
```yaml
Platform: AWS Lambda
Framework: Serverless Framework v3
- YAML configuration
- Plugin ecosystem
- Local development
- Multi-stage deployment

Runtime Support:
- Node.js 18 functions
- Python 3.9 functions
- Environment variables
- VPC configuration

Event Sources:
- HTTP API Gateway
- SQS message queues
- EventBridge events
- CloudWatch schedules
```

### 6.4 Database Stack
```yaml
Primary Database: MongoDB Atlas
- Replica set configuration
- Automatic backups
- Performance monitoring
- Security features

Caching: Redis (AWS ElastiCache)
- Session storage
- API response caching
- Real-time data
- Pub/Sub messaging

Search: MongoDB Atlas Search
- Full-text search
- Faceted search
- Auto-complete
- Custom scoring
```

### 6.5 Infrastructure Stack
```yaml
Cloud Provider: AWS
Compute:
- ECS Fargate for microservices
- Lambda for serverless functions
- EC2 for target deployments

Storage:
- S3 for build artifacts
- EFS for shared storage
- EBS for persistent volumes

Networking:
- VPC with public/private subnets
- Application Load Balancer
- NAT Gateway for private access
- Route 53 for DNS management

Security:
- IAM roles and policies
- Secrets Manager for sensitive data
- WAF for application protection
- CloudTrail for audit logging
```

### 6.6 DevOps Stack
```yaml
CI/CD: GitHub Actions
- Automated testing
- Multi-environment deployment
- Security scanning
- Performance testing

Infrastructure as Code: Terraform
- AWS resource provisioning
- Environment management
- State management
- Module reusability

Monitoring: AWS CloudWatch + DataDog
- Application metrics
- Log aggregation
- Custom dashboards
- Alert management

Container: Docker
- Multi-stage builds
- Optimized images
- Security scanning
- Registry management
```

---

## 7. Database Design

### 7.1 MongoDB Schema Design

#### 7.1.1 Users Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "john.doe@example.com",
  username: "johndoe",
  password: "$2b$10$hashedPasswordString",
  githubId: "12345678",
  gitlabId: null,
  role: "user", // "admin", "user"
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://avatars.githubusercontent.com/u/12345678",
    company: "Tech Corp",
    location: "San Francisco, CA",
    website: "https://johndoe.dev"
  },
  preferences: {
    theme: "dark", // "light", "dark", "auto"
    notifications: {
      email: true,
      webhook: false,
      deployment: true,
      ssl: true
    },
    timezone: "America/Los_Angeles"
  },
  subscription: {
    plan: "free", // "free", "pro", "enterprise"
    limits: {
      applications: 5,
      servers: 3,
      deployments: 100
    }
  },
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: false,
  lastLogin: ISODate("2025-10-30T02:42:45Z"),
  createdAt: ISODate("2025-01-15T10:30:00Z"),
  updatedAt: ISODate("2025-10-30T02:42:45Z")
}
```

#### 7.1.2 Repositories Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  name: "my-awesome-app",
  fullName: "johndoe/my-awesome-app",
  description: "A Next.js application with API backend",
  provider: "github", // "github", "gitlab", "bitbucket"
  url: "https://github.com/johndoe/my-awesome-app",
  cloneUrl: "https://github.com/johndoe/my-awesome-app.git",
  sshUrl: "git@github.com:johndoe/my-awesome-app.git",
  defaultBranch: "main",
  branches: ["main", "develop", "feature/new-ui"],
  isPrivate: false,
  language: "JavaScript",
  framework: "nextjs", // auto-detected: "react", "vue", "angular", "nodejs", "python", etc.
  webhookId: "webhook_123456789",
  webhookSecret: "encrypted_webhook_secret",
  accessToken: "encrypted_github_token",
  deploymentConfig: {
    buildCommand: "npm run build",
    startCommand: "npm start",
    installCommand: "npm ci",
    outputDirectory: ".next",
    environmentVariables: {
      "NODE_ENV": "production",
      "API_URL": "https://api.example.com"
    },
    nodeVersion: "18",
    packageManager: "npm" // "npm", "yarn", "pnpm"
  },
  stats: {
    stars: 42,
    forks: 8,
    size: 2048, // KB
    lastCommit: ISODate("2025-10-29T15:30:00Z")
  },
  isActive: true,
  createdAt: ISODate("2025-02-01T09:15:00Z"),
  updatedAt: ISODate("2025-10-30T01:20:00Z")
}
```

#### 7.1.3 Servers Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  name: "Production Server #1",
  description: "Main production server for web applications",
  host: "192.168.1.100",
  port: 22,
  username: "ubuntu",
  sshKey: "encrypted_private_key_content",
  sshKeyFingerprint: "SHA256:abc123def456...",
  region: "us-east-1",
  provider: "aws", // "aws", "digitalocean", "linode", "custom"
  instanceId: "i-1234567890abcdef0",
  environment: "production", // "production", "staging", "development"
  tags: ["web", "nodejs", "production"],
  
  specifications: {
    cpu: "2 vCPUs",
    memory: "4 GB",
    storage: "80 GB SSD",
    bandwidth: "1 TB",
    os: "Ubuntu 22.04 LTS"
  },
  
  configuration: {
    nginxInstalled: true,
    dockerInstalled: true,
    nodeVersion: "18.17.0",
    pythonVersion: "3.9.2",
    phpVersion: null,
    customPackages: ["git", "curl", "htop"]
  },
  
  monitoring: {
    status: "online", // "online", "offline", "error", "maintenance"
    lastCheck: ISODate("2025-10-30T02:40:00Z"),
    uptime: 99.9,
    cpuUsage: 15.2,
    memoryUsage: 58.7,
    diskUsage: 42.3,
    loadAverage: [0.5, 0.3, 0.2]
  },
  
  security: {
    firewallEnabled: true,
    sslOnly: true,
    failbanInstalled: true,
    lastSecurityUpdate: ISODate("2025-10-25T03:00:00Z")
  },
  
  limits: {
    maxApplications: 10,
    maxDomains: 20,
    maxBandwidth: 1000 // GB
  },
  
  isActive: true,
  createdAt: ISODate("2025-01-20T14:45:00Z"),
  updatedAt: ISODate("2025-10-30T02:40:00Z")
}
```

#### 7.1.4 Applications Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  repositoryId: ObjectId("507f1f77bcf86cd799439012"),
  serverId: ObjectId("507f1f77bcf86cd799439013"),
  
  name: "My Awesome App",
  description: "Production deployment of my awesome application",
  slug: "my-awesome-app",
  
  deployment: {
    branch: "main",
    buildCommand: "npm run build",
    startCommand: "npm start",
    port: 3000,
    processName: "my-awesome-app",
    autoRestart: true,
    instances: 1
  },
  
  environment: {
    NODE_ENV: "production",
    PORT: "3000",
    DATABASE_URL: "encrypted_database_url",
    API_KEY: "encrypted_api_key",
    CUSTOM_VAR: "custom_value"
  },
  
  domains: [{
    domain: "myapp.example.com",
    isCustom: true,
    isPrimary: true,
    sslEnabled: true,
    sslCertificateId: ObjectId("507f1f77bcf86cd799439018"),
    dnsConfigured: true,
    createdAt: ISODate("2025-03-01T10:00:00Z")
  }, {
    domain: "my-awesome-app.deployer.app",
    isCustom: false,
    isPrimary: false,
    sslEnabled: true,
    sslCertificateId: ObjectId("507f1f77bcf86cd799439019"),
    dnsConfigured: true,
    createdAt: ISODate("2025-02-15T16:30:00Z")
  }],
  
  nginx: {
    configPath: "/etc/nginx/sites-available/my-awesome-app.conf",
    proxyPass: "http://localhost:3000",
    customConfig: "client_max_body_size 50M;",
    gzipEnabled: true,
    cacheEnabled: true
  },
  
  monitoring: {
    status: "running", // "running", "stopped", "building", "error", "deploying"
    health: "healthy", // "healthy", "unhealthy", "unknown"
    uptime: 99.8,
    responseTime: 245, // milliseconds
    lastHealthCheck: ISODate("2025-10-30T02:41:00Z"),
    errorRate: 0.1 // percentage
  },
  
  metrics: {
    requests24h: 15420,
    bandwidth24h: 2.4, // GB
    uniqueVisitors24h: 8932,
    avgResponseTime: 235 // milliseconds
  },
  
  backup: {
    enabled: true,
    frequency: "daily", // "hourly", "daily", "weekly"
    retention: 30, // days
    lastBackup: ISODate("2025-10-29T03:00:00Z")
  },
  
  isActive: true,
  createdAt: ISODate("2025-02-15T16:20:00Z"),
  updatedAt: ISODate("2025-10-30T02:41:00Z")
}
```

#### 7.1.5 Deployments Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  applicationId: ObjectId("507f1f77bcf86cd799439014"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  
  version: "v1.2.3",
  commitHash: "abc123def456789",
  commitMessage: "Add new user dashboard feature",
  branch: "main",
  author: {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://avatars.githubusercontent.com/u/12345678"
  },
  
  trigger: {
    type: "manual", // "manual", "webhook", "scheduled"
    triggeredBy: ObjectId("507f1f77bcf86cd799439011"),
    source: "web-ui" // "web-ui", "api", "webhook", "cli"
  },
  
  status: "success", // "pending", "building", "deploying", "success", "failed", "cancelled"
  phase: "completed", // "queued", "cloning", "building", "testing", "deploying", "completed"
  
  timeline: {
    queuedAt: ISODate("2025-10-30T02:35:00Z"),
    startedAt: ISODate("2025-10-30T02:35:10Z"),
    buildStarted: ISODate("2025-10-30T02:35:15Z"),
    buildCompleted: ISODate("2025-10-30T02:37:45Z"),
    deployStarted: ISODate("2025-10-30T02:37:50Z"),
    completedAt: ISODate("2025-10-30T02:39:20Z")
  },
  
  duration: {
    total: 250, // seconds
    build: 150,
    deploy: 90,
    queue: 10
  },
  
  buildInfo: {
    buildId: "build_123456789",
    buildLog: "s3://logs-bucket/deployments/build_123456789.log",
    artifacts: "s3://artifacts-bucket/applications/my-app/v1.2.3/",
    buildSize: 15.7, // MB
    dependencies: {
      installed: 245,
      updated: 12,
      vulnerabilities: 0
    }
  },
  
  deployInfo: {
    deployId: "deploy_987654321",
    deployLog: "s3://logs-bucket/deployments/deploy_987654321.log",
    previousVersion: "v1.2.2",
    rollbackAvailable: true,
    healthChecksPassed: true,
    processRestarted: true
  },
  
  environment: {
    nodeVersion: "18.17.0",
    npmVersion: "9.6.7",
    buildTool: "webpack",
    serverOS: "Ubuntu 22.04",
    nginxVersion: "1.18.0"
  },
  
  logs: [{
    timestamp: ISODate("2025-10-30T02:35:15Z"),
    level: "info",
    message: "Starting build process",
    source: "build-service"
  }, {
    timestamp: ISODate("2025-10-30T02:35:20Z"),
    level: "info", 
    message: "Installing dependencies...",
    source: "npm"
  }, {
    timestamp: ISODate("2025-10-30T02:37:30Z"),
    level: "info",
    message: "Build completed successfully",
    source: "webpack"
  }, {
    timestamp: ISODate("2025-10-30T02:39:15Z"),
    level: "info",
    message: "Application deployed and running",
    source: "deploy-service"
  }],
  
  notifications: {
    email: true,
    webhook: false,
    slack: true
  },
  
  createdAt: ISODate("2025-10-30T02:35:00Z"),
  updatedAt: ISODate("2025-10-30T02:39:20Z")
}
```

#### 7.1.6 SSL Certificates Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439018"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  serverId: ObjectId("507f1f77bcf86cd799439013"),
  applicationId: ObjectId("507f1f77bcf86cd799439014"),
  
  domain: "myapp.example.com",
  subjectAltNames: ["www.myapp.example.com", "api.myapp.example.com"],
  
  provider: "letsencrypt", // "letsencrypt", "custom", "cloudflare"
  type: "domain", // "domain", "wildcard", "multi-domain"
  
  certificate: {
    serialNumber: "03:B5:2F:C4:2C:C8:E4:58:59:4B:2E:65:8F:77:A4:B2:2A:1D",
    fingerprint: "SHA256:F8:5B:2E:8A:1C:9D:7F:3E:4A:5B:6C:7D:8E:9F:0A:1B:2C:3D:4E:5F",
    issuer: "Let's Encrypt Authority X3",
    algorithm: "RSA-2048"
  },
  
  paths: {
    certificateFile: "/etc/letsencrypt/live/myapp.example.com/fullchain.pem",
    privateKeyFile: "/etc/letsencrypt/live/myapp.example.com/privkey.pem",
    chainFile: "/etc/letsencrypt/live/myapp.example.com/chain.pem"
  },
  
  status: "active", // "pending", "active", "expired", "revoked", "error"
  
  dates: {
    issuedAt: ISODate("2025-09-30T10:15:00Z"),
    expiresAt: ISODate("2025-12-29T10:15:00Z"),
    renewAfter: ISODate("2025-12-15T10:15:00Z")
  },
  
  autoRenew: {
    enabled: true,
    daysBeforeExpiry: 14,
    lastAttempt: ISODate("2025-10-20T03:00:00Z"),
    nextAttempt: ISODate("2025-12-15T03:00:00Z"),
    attempts: 0,
    maxAttempts: 3
  },
  
  validation: {
    method: "http-01", // "http-01", "dns-01", "tls-alpn-01"
    challenges: [{
      type: "http-01",
      token: "challenge_token_123",
      keyAuthorization: "key_auth_456",
      status: "valid",
      validatedAt: ISODate("2025-09-30T10:10:00Z")
    }]
  },
  
  monitoring: {
    checksEnabled: true,
    lastCheck: ISODate("2025-10-30T02:00:00Z"),
    daysUntilExpiry: 60,
    alertThreshold: 7 // days
  },
  
  usage: {
    applications: [ObjectId("507f1f77bcf86cd799439014")],
    nginxConfigured: true,
    httpsRedirect: true,
    hstsEnabled: true
  },
  
  createdAt: ISODate("2025-09-30T10:15:00Z"),
  updatedAt: ISODate("2025-10-30T02:00:00Z")
}
```

#### 7.1.7 Activity Logs Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439020"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  
  action: "application.deploy", // action.resource format
  resource: {
    type: "application",
    id: ObjectId("507f1f77bcf86cd799439014"),
    name: "My Awesome App"
  },
  
  details: {
    version: "v1.2.3",
    branch: "main",
    commit: "abc123def456789",
    duration: 250,
    success: true
  },
  
  metadata: {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    ipAddress: "192.168.1.50",
    location: "San Francisco, CA",
    source: "web-ui"
  },
  
  timestamp: ISODate("2025-10-30T02:39:20Z")
}
```

### 7.2 Database Indexes

```javascript
// Users Collection Indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "githubId": 1 }, { sparse: true });
db.users.createIndex({ "role": 1, "isActive": 1 });
db.users.createIndex({ "createdAt": 1 });

// Repositories Collection Indexes
db.repositories.createIndex({ "userId": 1, "isActive": 1 });
db.repositories.createIndex({ "fullName": 1 }, { unique: true });
db.repositories.createIndex({ "provider": 1, "isPrivate": 1 });
db.repositories.createIndex({ "framework": 1 });
db.repositories.createIndex({ "updatedAt": -1 });

// Servers Collection Indexes
db.servers.createIndex({ "userId": 1, "isActive": 1 });
db.servers.createIndex({ "environment": 1, "monitoring.status": 1 });
db.servers.createIndex({ "host": 1, "port": 1 });
db.servers.createIndex({ "provider": 1, "region": 1 });

// Applications Collection Indexes
db.applications.createIndex({ "userId": 1, "isActive": 1 });
db.applications.createIndex({ "repositoryId": 1 });
db.applications.createIndex({ "serverId": 1 });
db.applications.createIndex({ "slug": 1 }, { unique: true });
db.applications.createIndex({ "domains.domain": 1 });
db.applications.createIndex({ "monitoring.status": 1 });

// Deployments Collection Indexes
db.deployments.createIndex({ "applicationId": 1, "createdAt": -1 });
db.deployments.createIndex({ "userId": 1, "createdAt": -1 });
db.deployments.createIndex({ "status": 1, "phase": 1 });
db.deployments.createIndex({ "commitHash": 1 });
db.deployments.createIndex({ "createdAt": -1 });

// SSL Certificates Collection Indexes
db.sslCertificates.createIndex({ "domain": 1 }, { unique: true });
db.sslCertificates.createIndex({ "userId": 1, "status": 1 });
db.sslCertificates.createIndex({ "serverId": 1 });
db.sslCertificates.createIndex({ "dates.expiresAt": 1 });
db.sslCertificates.createIndex({ "autoRenew.enabled": 1, "autoRenew.nextAttempt": 1 });

// Activity Logs Collection Indexes
db.activityLogs.createIndex({ "userId": 1, "timestamp": -1 });
db.activityLogs.createIndex({ "action": 1, "timestamp": -1 });
db.activityLogs.createIndex({ "resource.type": 1, "resource.id": 1 });
db.activityLogs.createIndex({ "timestamp": -1 });
// TTL Index for log retention (keep logs for 1 year)
db.activityLogs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 });
```

---

## 8. API Specifications

### 8.1 Authentication APIs

#### POST /api/v1/auth/register
**Register a new user account**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "Account created successfully. Please verify your email."
}
```

#### POST /api/v1/auth/login
**Authenticate user with email and password**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 86400
  }
}
```

#### GET /api/v1/auth/github
**Initiate GitHub OAuth authentication**

```http
GET /api/v1/auth/github?redirect_uri=https://app.example.com/auth/callback
```

**Response (302 Redirect):**
```
Location: https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=repo,user:email
```

#### POST /api/v1/auth/github/callback
**Complete GitHub OAuth authentication**

```http
POST /api/v1/auth/github/callback
Content-Type: application/json

{
  "code": "github_oauth_code_123",
  "state": "random_state_string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "githubId": "12345678",
      "avatar": "https://avatars.githubusercontent.com/u/12345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false
  }
}
```

### 8.2 Repository APIs

#### GET /api/v1/repositories
**Get user's repositories**

```http
GET /api/v1/repositories?page=1&limit=20&provider=github&search=my-app
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repositories": [{
      "id": "507f1f77bcf86cd799439012",
      "name": "my-awesome-app",
      "fullName": "johndoe/my-awesome-app",
      "description": "A Next.js application with API backend",
      "provider": "github",
      "url": "https://github.com/johndoe/my-awesome-app",
      "defaultBranch": "main",
      "isPrivate": false,
      "language": "JavaScript",
      "framework": "nextjs",
      "lastCommit": "2025-10-29T15:30:00Z",
      "createdAt": "2025-02-01T09:15:00Z"
    }],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### POST /api/v1/repositories/sync
**Sync repositories from GitHub/GitLab**

```http
POST /api/v1/repositories/sync
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "github",
  "force": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "synced": 15,
    "new": 3,
    "updated": 2,
    "errors": 0
  },
  "message": "Repositories synced successfully"
}
```

#### POST /api/v1/repositories
**Add a repository manually**

```http
POST /api/v1/repositories
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "gitlab",
  "url": "https://gitlab.com/johndoe/my-project",
  "accessToken": "gitlab_access_token_here",
  "branch": "main"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "repository": {
      "id": "507f1f77bcf86cd799439025",
      "name": "my-project",
      "fullName": "johndoe/my-project",
      "provider": "gitlab",
      "url": "https://gitlab.com/johndoe/my-project",
      "webhookUrl": "https://api.deployer.app/webhooks/gitlab/507f1f77bcf86cd799439025"
    }
  },
  "message": "Repository added successfully"
}
```

#### GET /api/v1/repositories/{id}/branches
**Get repository branches**

```http
GET /api/v1/repositories/507f1f77bcf86cd799439012/branches
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "branches": [{
      "name": "main",
      "isDefault": true,
      "lastCommit": {
        "hash": "abc123def456789",
        "message": "Add new user dashboard feature",
        "author": "John Doe",
        "date": "2025-10-29T15:30:00Z"
      }
    }, {
      "name": "develop",
      "isDefault": false,
      "lastCommit": {
        "hash": "def456abc789123",
        "message": "Work in progress on new feature",
        "author": "John Doe", 
        "date": "2025-10-28T10:20:00Z"
      }
    }]
  }
}
```

### 8.3 Server APIs

#### GET /api/v1/servers
**Get user's servers**

```http
GET /api/v1/servers?environment=production&status=online
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "servers": [{
      "id": "507f1f77bcf86cd799439013",
      "name": "Production Server #1",
      "description": "Main production server for web applications",
      "host": "192.168.1.100",
      "port": 22,
      "username": "ubuntu",
      "environment": "production",
      "provider": "aws",
      "region": "us-east-1",
      "status": "online",
      "specifications": {
        "cpu": "2 vCPUs",
        "memory": "4 GB",
        "storage": "80 GB SSD"
      },
      "monitoring": {
        "uptime": 99.9,
        "cpuUsage": 15.2,
        "memoryUsage": 58.7,
        "diskUsage": 42.3,
        "lastCheck": "2025-10-30T02:40:00Z"
      },
      "applications": 3,
      "createdAt": "2025-01-20T14:45:00Z"
    }]
  }
}
```

#### POST /api/v1/servers
**Add a new server**

```http
POST /api/v1/servers
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Staging Server",
  "description": "Server for staging deployments",
  "host": "staging.example.com",
  "port": 22,
  "username": "deploy",
  "sshKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...",
  "environment": "staging",
  "provider": "digitalocean",
  "region": "nyc1",
  "tags": ["staging", "nodejs"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "server": {
      "id": "507f1f77bcf86cd799439030",
      "name": "Staging Server",
      "host": "staging.example.com",
      "environment": "staging",
      "status": "connecting",
      "testResults": {
        "connection": "pending",
        "sudo": "pending",
        "docker": "pending"
      }
    }
  },
  "message": "Server added successfully. Connection test in progress."
}
```

#### GET /api/v1/servers/{id}/test
**Test server connection**

```http
GET /api/v1/servers/507f1f77bcf86cd799439013/test
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connection": {
      "status": "success",
      "latency": 45,
      "message": "SSH connection established"
    },
    "system": {
      "os": "Ubuntu 22.04.3 LTS",
      "kernel": "5.15.0-88-generic",
      "uptime": "15 days, 3 hours",
      "architecture": "x86_64"
    },
    "resources": {
      "cpu": {
        "cores": 2,
        "usage": 15.2,
        "loadAverage": [0.5, 0.3, 0.2]
      },
      "memory": {
        "total": "4.0 GB",
        "used": "2.3 GB",
        "available": "1.7 GB",
        "usage": 58.7
      },
      "disk": {
        "total": "78 GB",
        "used": "33 GB", 
        "available": "45 GB",
        "usage": 42.3
      }
    },
    "software": {
      "nginx": {
        "installed": true,
        "version": "1.18.0",
        "running": true
      },
      "docker": {
        "installed": true,
        "version": "24.0.6",
        "running": true
      },
      "node": {
        "installed": true,
        "version": "18.17.0"
      }
    }
  }
}
```

### 8.4 Application APIs

#### GET /api/v1/applications
**Get user's applications**

```http
GET /api/v1/applications?serverId=507f1f77bcf86cd799439013&status=running
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [{
      "id": "507f1f77bcf86cd799439014",
      "name": "My Awesome App",
      "slug": "my-awesome-app",
      "repository": {
        "name": "my-awesome-app",
        "fullName": "johndoe/my-awesome-app",
        "branch": "main"
      },
      "server": {
        "id": "507f1f77bcf86cd799439013",
        "name": "Production Server #1",
        "host": "192.168.1.100"
      },
      "domains": [{
        "domain": "myapp.example.com",
        "isPrimary": true,
        "sslEnabled": true
      }],
      "status": "running",
      "health": "healthy",
      "uptime": 99.8,
      "lastDeployment": {
        "id": "507f1f77bcf86cd799439015",
        "version": "v1.2.3",
        "deployedAt": "2025-10-30T02:39:20Z",
        "status": "success"
      },
      "metrics": {
        "requests24h": 15420,
        "responseTime": 245
      },
      "createdAt": "2025-02-15T16:20:00Z"
    }]
  }
}
```

#### POST /api/v1/applications
**Create a new application**

```http
POST /api/v1/applications
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Blog App",
  "repositoryId": "507f1f77bcf86cd799439012",
  "serverId": "507f1f77bcf86cd799439013",
  "branch": "main",
  "deployment": {
    "buildCommand": "npm run build",
    "startCommand": "npm start",
    "port": 3000
  },
  "environment": {
    "NODE_ENV": "production",
    "API_URL": "https://api.myblog.com"
  },
  "domains": [{
    "domain": "myblog.example.com",
    "isPrimary": true
  }]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "507f1f77bcf86cd799439035",
      "name": "My Blog App",
      "slug": "my-blog-app",
      "status": "created",
      "deploymentUrl": "https://api.deployer.app/applications/507f1f77bcf86cd799439035/deploy"
    }
  },
  "message": "Application created successfully. Ready for deployment."
}
```

#### POST /api/v1/applications/{id}/deploy
**Deploy an application**

```http
POST /api/v1/applications/507f1f77bcf86cd799439014/deploy
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "branch": "main",
  "message": "Deploy latest features",
  "environment": {
    "DEBUG": "false",
    "CACHE_TTL": "3600"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "deployment": {
      "id": "507f1f77bcf86cd799439040",
      "status": "pending",
      "phase": "queued",
      "estimatedDuration": 300,
      "logsUrl": "wss://api.deployer.app/deployments/507f1f77bcf86cd799439040/logs",
      "createdAt": "2025-10-30T02:45:00Z"
    }
  },
  "message": "Deployment started successfully"
}
```

#### GET /api/v1/applications/{id}/logs
**Get application logs**

```http
GET /api/v1/applications/507f1f77bcf86cd799439014/logs?lines=100&follow=true
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [{
      "timestamp": "2025-10-30T02:44:15.123Z",
      "level": "info",
      "message": "Server started on port 3000",
      "source": "application"
    }, {
      "timestamp": "2025-10-30T02:44:20.456Z",
      "level": "info",
      "message": "Database connected successfully",
      "source": "application"
    }, {
      "timestamp": "2025-10-30T02:44:25.789Z",
      "level": "warn",
      "message": "Deprecated API endpoint used: /api/v1/old-endpoint",
      "source": "application"
    }],
    "totalLines": 1247,
    "hasMore": true
  }
}
```

### 8.5 Deployment APIs

#### GET /api/v1/deployments
**Get deployment history**

```http
GET /api/v1/deployments?applicationId=507f1f77bcf86cd799439014&page=1&limit=10
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deployments": [{
      "id": "507f1f77bcf86cd799439015",
      "application": {
        "id": "507f1f77bcf86cd799439014",
        "name": "My Awesome App"
      },
      "version": "v1.2.3",
      "commitHash": "abc123def456789",
      "commitMessage": "Add new user dashboard feature",
      "branch": "main",
      "author": {
        "name": "John Doe",
        "avatar": "https://avatars.githubusercontent.com/u/12345678"
      },
      "status": "success",
      "duration": 250,
      "createdAt": "2025-10-30T02:35:00Z",
      "completedAt": "2025-10-30T02:39:20Z"
    }],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET /api/v1/deployments/{id}
**Get deployment details**

```http
GET /api/v1/deployments/507f1f77bcf86cd799439015
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deployment": {
      "id": "507f1f77bcf86cd799439015",
      "applicationId": "507f1f77bcf86cd799439014",
      "version": "v1.2.3",
      "commitHash": "abc123def456789",
      "commitMessage": "Add new user dashboard feature",
      "branch": "main",
      "status": "success",
      "phase": "completed",
      "timeline": {
        "queuedAt": "2025-10-30T02:35:00Z",
        "startedAt": "2025-10-30T02:35:10Z", 
        "buildStarted": "2025-10-30T02:35:15Z",
        "buildCompleted": "2025-10-30T02:37:45Z",
        "deployStarted": "2025-10-30T02:37:50Z",
        "completedAt": "2025-10-30T02:39:20Z"
      },
      "duration": {
        "total": 250,
        "build": 150,
        "deploy": 90
      },
      "buildInfo": {
        "buildSize": 15.7,
        "dependencies": {
          "installed": 245,
          "vulnerabilities": 0
        }
      },
      "environment": {
        "nodeVersion": "18.17.0",
        "npmVersion": "9.6.7"
      }
    }
  }
}
```

#### POST /api/v1/deployments/{id}/rollback
**Rollback to a previous deployment**

```http
POST /api/v1/deployments/507f1f77bcf86cd799439015/rollback
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Critical bug found in current version"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "rollback": {
      "id": "507f1f77bcf86cd799439045",
      "targetDeploymentId": "507f1f77bcf86cd799439015",
      "status": "pending",
      "estimatedDuration": 120,
      "createdAt": "2025-10-30T02:50:00Z"
    }
  },
  "message": "Rollback initiated successfully"
}
```

### 8.6 SSL Certificate APIs

#### GET /api/v1/ssl-certificates
**Get SSL certificates**

```http
GET /api/v1/ssl-certificates?serverId=507f1f77bcf86cd799439013&status=active
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "certificates": [{
      "id": "507f1f77bcf86cd799439018",
      "domain": "myapp.example.com",
      "subjectAltNames": ["www.myapp.example.com"],
      "provider": "letsencrypt",
      "type": "domain",
      "status": "active",
      "issuer": "Let's Encrypt Authority X3",
      "issuedAt": "2025-09-30T10:15:00Z",
      "expiresAt": "2025-12-29T10:15:00Z",
      "daysUntilExpiry": 60,
      "autoRenew": true,
      "applications": [{
        "id": "507f1f77bcf86cd799439014",
        "name": "My Awesome App"
      }],
      "createdAt": "2025-09-30T10:15:00Z"
    }]
  }
}
```

#### POST /api/v1/ssl-certificates
**Request a new SSL certificate**

```http
POST /api/v1/ssl-certificates
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "domain": "newapp.example.com",
  "subjectAltNames": ["www.newapp.example.com"],
  "serverId": "507f1f77bcf86cd799439013",
  
