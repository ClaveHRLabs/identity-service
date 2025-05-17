# Identity Service

The Identity Service is a crucial part of the ClaveHR platform responsible for user authentication, authorization, and identity management. It handles user registration, login, token management, and access control.

## Features

- User authentication (login, registration, password reset)
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Organization and user management
- Secure password handling with bcrypt
- PostgreSQL database integration
- Organization profiles and setup code management
- Idempotent organization onboarding with secure setup codes

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

### Health Check

- `GET /health` - Check service health
- `GET /ping` - Simple ping endpoint

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
- **GET /api/roles/check-permission/:userId/:permissionName** - Check if user has permission

All API endpoints are protected by authorization middleware that validates the user has the required permissions before allowing access.

## License

MIT
