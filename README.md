# Identity Service

The Identity Service is a crucial part of the ClaveHR platform responsible for user authentication, authorization, and identity management. It handles user registration, login, token management, and access control.

## Features

- **User Authentication** - Login, registration, password reset with secure JWT tokens
- **API Key Authentication** - Generate and manage API keys for programmatic access
- **JWT-based Authentication** - Access and refresh tokens with configurable expiration
- **Role-based Access Control (RBAC)** - Comprehensive permission system with 11+ roles
- **Organization Management** - Multi-tenant organization profiles and setup codes
- **User Management** - Complete user lifecycle with role assignments
- **Security Features** - Bcrypt password hashing, IP whitelisting, rate limiting
- **PostgreSQL Integration** - Robust database layer with migrations
- **API Key Features**:
    - Generate secure API keys with `xapi-` prefix format
    - Configurable expiration (or never-expiring keys)
    - Rate limiting per API key
    - IP address whitelisting
    - Usage tracking and analytics
    - Token generation from API keys (inherits user permissions)

## Technology Stack

- Node.js 18+
- TypeScript
- Express.js
- PostgreSQL
- JWT
- Zod for validation
- Winston for logging

## Project Structure

```
identity-service/
├── src/
│   ├── api/               # API-related code
│   │   ├── controllers/   # Route controllers
│   │   ├── middlewares/   # Express middlewares
│   │   ├── routes/        # API route definitions
│   │   └── validators/    # Request validation schemas
│   ├── config/            # Application configuration
│   ├── db/                # Database connection and queries
│   ├── models/            # Data models and validation schemas
│   │   ├── interfaces/    # TypeScript interfaces
│   │   └── schemas/       # Zod validation schemas
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── app.ts             # Application entry point
├── schema/                # Database schema and migrations
│   ├── migrations/        # Migration SQL files
│   └── schema.sql         # Current DB schema
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── client.http        # API client examples
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Yarn or npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-org/clavehr.git
cd identity-service
```

2. Install dependencies

```bash
yarn install
```

3. Create a `.env` file in the root directory (use `.env.example` as a template)

```bash
cp .env.example .env
```

4. Update the database credentials and JWT secrets in your `.env` file

5. Create the database

```bash
createdb clavehr_identity
```

6. Run database migrations (when implemented)

```bash
yarn migrate
```

### Development

Start the development server:

```bash
yarn dev
```

The server will be available at http://localhost:3001 (or the PORT specified in your .env file).

### Building for Production

```bash
yarn build
yarn start
```

### Testing

```bash
yarn test
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `POST /api/auth/refresh` - Refresh an access token
- `POST /api/auth/logout` - Logout a user

### API Key Management

- `POST /api/xkey` - Create a new API key
- `GET /api/xkey` - List user's API keys
- `GET /api/xkey/:id` - Get API key details
- `PUT /api/xkey/:id` - Update API key settings
- `DELETE /api/xkey/:id` - Deactivate API key
- `GET /api/xkey/stats` - Get API key usage statistics
- `POST /api/xkey/authenticate` - Authenticate with API key and get tokens

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Organizations

- `POST /api/organizations` - Create an organization profile
- `GET /api/organizations/:id` - Get organization profile by ID
- `PUT /api/organizations/:id` - Update organization profile
- `DELETE /api/organizations/:id` - Delete organization profile
- `GET /api/organizations` - List organization profiles with optional filters

### Setup Codes

- `POST /api/setup-codes` - Create a new organization setup code
- `GET /api/organizations/:organizationId/setup-codes` - Get all setup codes for an organization
- `POST /api/setup-codes/validate` - Validate and use a setup code
- `DELETE /api/setup-codes/:id` - Delete a setup code

### Roles & Permissions

- `GET /api/roles` - Get all roles (requires 'view_all_users' permission)
- `GET /api/roles/assignable` - Get roles that the current user can assign
- `POST /api/roles/assign` - Assign role to user (requires 'manage_roles' permission)
- `DELETE /api/roles/user/:userId/role/:roleId` - Remove role from user

### Health Check

- `GET /health` - Check service health
- `GET /ping` - Simple ping endpoint

## API Key Authentication

The Identity Service supports API key-based authentication for programmatic access. API keys inherit the permissions of the user who created them, making them perfect for integrations, CI/CD pipelines, and third-party applications.

### API Key Features

- **Secure Generation**: Keys use the format `xapi-{32-character-hex}` for easy identification
- **Flexible Expiration**: Set custom expiration dates or create never-expiring keys
- **Rate Limiting**: Configure requests per minute limits (1-1000 RPM)
- **IP Whitelisting**: Restrict API key usage to specific IP addresses or ranges
- **Usage Tracking**: Monitor API key usage with detailed analytics
- **Permission Inheritance**: API keys automatically inherit all permissions from the creating user
- **Token Generation**: Exchange API keys for JWT access/refresh tokens

### Creating an API Key

```bash
curl -X POST http://localhost:5002/api/xkey \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Integration Key",
    "description": "API key for third-party integration",
    "expires_at": "2025-12-31T23:59:59.000Z",
    "rate_limit_per_minute": 100,
    "allowed_ips": ["192.168.1.100", "10.0.0.0/16"],
    "metadata": {
      "environment": "production",
      "service": "external-api"
    }
  }'
```

### Using API Keys

#### Method 1: Direct API Key Authentication

```bash
# Use API key directly as Bearer token
curl -H "Authorization: Bearer xapi-1234567890abcdef..." \
  http://localhost:5002/api/users/me

# Or use ApiKey prefix
curl -H "Authorization: ApiKey xapi-1234567890abcdef..." \
  http://localhost:5002/api/users/me
```

#### Method 2: Exchange for JWT Tokens

```bash
# Get JWT tokens using API key
curl -X POST http://localhost:5002/api/xkey/authenticate \
  -H "Content-Type: application/json" \
  -d '{"api_key": "xapi-1234567890abcdef..."}'

# Response includes access_token and refresh_token
# Use the access_token for subsequent requests
curl -H "Authorization: Bearer JWT_ACCESS_TOKEN" \
  http://localhost:5002/api/users/me
```

### API Key Management

```bash
# List your API keys
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/xkey

# Get API key details
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/xkey/KEY_ID

# Update API key settings
curl -X PUT http://localhost:5002/api/xkey/KEY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rate_limit_per_minute": 200}'

# Deactivate API key
curl -X DELETE http://localhost:5002/api/xkey/KEY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get usage statistics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/xkey/stats
```

### Security Best Practices

1. **Limit Scope**: Create API keys with minimal required permissions
2. **Set Expiration**: Use expiration dates for temporary integrations
3. **IP Restrictions**: Whitelist specific IP addresses when possible
4. **Rate Limiting**: Set appropriate rate limits to prevent abuse
5. **Monitor Usage**: Regularly check API key usage statistics
6. **Rotate Keys**: Periodically regenerate API keys for long-term usage
7. **Secure Storage**: Store API keys securely (environment variables, secrets management)

## Role-Based Access Control (RBAC)

The identity service implements a comprehensive role-based access control system that ensures users can only perform actions they have permissions for. This system consists of:

### Roles

The system defines the following roles with different permission levels:

1. **Super Admin** - System-wide access and configuration
2. **Organization Admin** - Full control over a specific organization
3. **Organization Manager** - User management and limited admin access
4. **HR Manager** - Access to HR-related features
5. **Hiring Manager** - Recruitment and applicant tracking
6. **Team Manager** - Manages direct reports and team operations
7. **Employee** - Basic access to personal information
8. **Recruiter** - Manages recruitment processes
9. **Learning Specialist** - Manages learning and development
10. **Succession Planner** - Manages succession planning
11. **ClaveHR Operator** - Special role for onboarding/deboarding organizations

### Permissions

Each role is assigned a set of permissions that define what actions they can perform:

- **manage_system** - Manage system-wide settings
- **manage_organizations** - Create, update, delete organizations
- **manage_users** - Create, update, delete users
- **view_all_users** - View all users in the organization
- **manage_roles** - Assign and remove user roles
- And more specific permissions...

### Role Assignment Restrictions

The system enforces rules around which roles can assign other roles:

1. **Super Admin** can assign any role
2. **ClaveHR Operator** can assign any role except Super Admin
3. **Organization Admin** can assign organization-level roles
4. **Organization Manager** can only assign Employee and Team Manager roles
5. **HR Manager** can only assign the Employee role

### API Endpoints

The RBAC system is exposed through the following API endpoints:

- **GET /api/roles** - Get all roles (requires 'view_all_users' permission)
- **GET /api/roles/assignable** - Get roles that the current user can assign
- **POST /api/roles/assign** - Assign role to user (requires 'manage_roles' permission)
- **DELETE /api/roles/user/:userId/role/:roleId** - Remove role from user

All API endpoints are protected by authorization middleware that validates the user has the required permissions before allowing access.

## Environment Variables

The service requires the following environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/clavehr_identity
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clavehr_identity
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRATION=7d

# Service Configuration
PORT=5002
SERVICE_NAME=identity-service
API_PREFIX=/api
FRONTEND_URL=http://localhost:3000

# Admin Configuration
ADMIN_KEY=your-admin-key-for-service-auth

# Optional: OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Service URLs
NOTIFICATION_SERVICE_URL=http://localhost:5010

# Development/Debug
SHOW_ERROR_STACK=false
SHOW_ERROR_DETAILS=false
```

## License

MIT
