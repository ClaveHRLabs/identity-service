# Identity Service

The Identity Service is a crucial part of the ClaveHR platform responsible for user authentication, authorization, and identity management. It handles user registration, login, token management, and access control.

## Features

- User authentication (login, registration, password reset)
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Organization and user management
- Secure password handling with bcrypt
- PostgreSQL database integration

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
│   ├── config/            # Application configuration
│   ├── db/                # Database connection and queries
│   ├── middleware/        # Express middlewares
│   ├── models/            # Data models and validation schemas
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── app.ts             # Application entry point
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
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

### Health Check

- `GET /health` - Check service health

## License

MIT
