# 🏗️ Backend Development Rules - ClaveHR

## 📖 Table of Contents
- [🏛️ ARCH: Architecture & Design Patterns](#-arch-architecture--design-patterns)
- [🏷️ NAME: Naming Conventions](#️-name-naming-conventions)
- [📁 FILE: File Organization & Naming](#-file-file-organization--naming)
- [🎨 STYLE: Code Style & Formatting](#-style-code-style--formatting)
- [⚙️ CONFIG: Constants & Configuration](#️-config-constants--configuration)
- [🌐 COMM: Service Communication](#-comm-service-communication)
- [🗃️ DB: Database Repository Patterns](#️-db-database-repository-patterns)
- [🎮 CTRL: Controller Patterns](#-ctrl-controller-patterns)
- [⚡ PERF: Performance & Best Practices](#-perf-performance--best-practices)
- [🧪 TEST: Testing & Quality](#-test-testing--quality)
- [🔄 MIGRATE: Migration & Legacy Code](#-migrate-migration--legacy-code)

---

## 🏛️ ARCH: Architecture & Design Patterns

### 1. Dependency Injection (DI) Container
- **MUST** use `@vspl/core` DI container for all services and controllers
- **MUST** register services using `appContainer.register(name, factory, { dependencies: [...] })`
- **MUST** define service names in `di/service-names.ts`
- **MUST** use constructor injection for all dependencies
- **NEVER** use direct imports of service instances

```typescript
// ✅ CORRECT
constructor(
    userService: UserService,
    emailService: EmailService,
) {
    this.userService = userService;
    this.emailService = emailService;
}

// ❌ INCORRECT
import { userService } from './user.service';
```

### 2. Database Patterns
- **MUST** use DI-based database access through `executeQuery` and `tx`
- **NEVER** import `db` directly - use `import { query as executeQuery, transaction as tx } from '../index'`
- **MUST** handle `QueryResult` objects properly: access data via `.rows[0]` or `.rows`
- **MUST** use transactions for multi-step operations
- **NEVER** create table existence checks in repositories

```typescript
// ✅ CORRECT
import { query as executeQuery, transaction as tx } from '../index';

const queryResult = await executeQuery(query, params);
return queryResult.rows[0];

// ❌ INCORRECT
import db from '../db';
const result = await db.query(query, params);
return result; // Missing .rows[0]
```

### 3. Error Handling
- **NEVER** use `@CatchErrors` decorator (deprecated)
- **MUST** use try-catch blocks in service methods
- **MUST** log errors with context using `createLogger()` from `@vspl/core`
- **MUST** throw meaningful error messages

### 4. Logging
- **MUST** use `createLogger()` from `@vspl/core`
- **NEVER** create local logger instances
- **MUST** log with structured data (objects) for context

```typescript
// ✅ CORRECT
import { createLogger } from '@vspl/core';
const logger = createLogger();

logger.error('Error processing user', { error, userId, organizationId });

// ❌ INCORRECT
import { logger } from '../utils/logger';
```

## 🏷️ NAME: Naming Conventions

### 1. Variables & Functions
- **MUST** use camelCase for variables, functions, and methods
- **MUST** use descriptive names that explain purpose
- **MUST** use meaningful prefixes for boolean variables: `is`, `has`, `can`, `should`
- **MUST** use verb-noun pattern for functions: `getUser`, `createEvent`, `validateInput`

```typescript
// ✅ CORRECT
const userId = req.params.id;
const isActiveUser = user.status === 'active';
const hasPermission = checkUserPermission(user, 'read');
const canEditProfile = user.role === 'admin';

async function getUserById(id: string): Promise<User | null> {}
async function createNewEvent(eventData: EventData): Promise<Event> {}

// ❌ INCORRECT
const id = req.params.id; // Too generic
const active = user.status === 'active'; // Missing 'is' prefix
const permission = checkUserPermission(user, 'read'); // Missing 'has' prefix

async function user(id: string): Promise<User | null> {} // Missing verb
async function newEvent(eventData: EventData): Promise<Event> {} // Missing verb
```

### 2. Classes & Interfaces
- **MUST** use PascalCase for classes, interfaces, types, and enums
- **MUST** use descriptive names that indicate purpose
- **MUST** suffix interfaces with meaningful names (not just 'I' prefix)
- **MUST** suffix repository classes with 'Repository'
- **MUST** suffix service classes with 'Service'
- **MUST** suffix controller classes with 'Controller'

```typescript
// ✅ CORRECT
interface UserProfile {
    id: string;
    name: string;
}

interface DatabaseConnection {
    host: string;
    port: number;
}

class UserService {
    async getUser(id: string): Promise<User> {}
}

class UserRepository {
    async findById(id: string): Promise<User | null> {}
}

class UserController {
    async getUser(req: Request, res: Response): Promise<void> {}
}

enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
}

// ❌ INCORRECT
interface IUser {} // Don't use 'I' prefix
interface user {} // Must be PascalCase
class userService {} // Must be PascalCase
class User {} // Service class should have 'Service' suffix
```

### 3. Constants & Enums
- **MUST** use SCREAMING_SNAKE_CASE for module-level constants
- **MUST** use PascalCase for enum names and SCREAMING_SNAKE_CASE for enum values
- **MUST** group related constants in objects with descriptive names

```typescript
// ✅ CORRECT
const DEFAULT_PAGE_SIZE = 10;
const MAX_RETRY_ATTEMPTS = 3;
const API_ENDPOINTS = {
    USERS: '/api/users',
    EVENTS: '/api/events',
    REPORTS: '/api/reports',
} as const;

enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

enum EventType {
    TEAM_MEETING = 'team_meeting',
    TRAINING_SESSION = 'training_session',
    COMPANY_EVENT = 'company_event',
}

// ❌ INCORRECT
const pageSize = 10; // Should be SCREAMING_SNAKE_CASE
const MaxRetries = 3; // Should be SCREAMING_SNAKE_CASE
enum httpStatusCode {} // Should be PascalCase
enum EventType {
    teamMeeting = 'team_meeting', // Should be SCREAMING_SNAKE_CASE
}
```

### 4. Database & Query Variables
- **MUST** use descriptive names for query variables
- **MUST** use `queryResult` for database query results
- **MUST** use `transaction` for transaction parameter names
- **MUST** use plural forms for arrays/collections

```typescript
// ✅ CORRECT
const getUserQuery = 'SELECT * FROM users WHERE id = $1';
const updateUserQuery = 'UPDATE users SET name = $1 WHERE id = $2';
const queryResult = await executeQuery(getUserQuery, [userId]);
const users = queryResult.rows;
const user = queryResult.rows[0];

return await tx(async (transaction) => {
    const result = await transaction.query(query, params);
    return result.rows[0];
});

// ❌ INCORRECT
const query = 'SELECT * FROM users WHERE id = $1'; // Too generic
const result = await executeQuery(query, [userId]); // Should be 'queryResult'
const user = result; // Missing .rows[0]

return await tx(async (tx) => { // Should be 'transaction'
    const result = await tx.query(query, params);
    return result.rows[0];
});
```

### 5. API Routes & Endpoints
- **MUST** use kebab-case for URL paths
- **MUST** use plural nouns for resource collections
- **MUST** use RESTful conventions
- **MUST** use descriptive route parameter names

```typescript
// ✅ CORRECT
/api/users
/api/users/:userId
/api/events/:eventId/registrations
/api/surveys/:surveyId/responses
/api/wellness-programs/:programId/activities

app.get('/api/users/:userId', userController.getUser);
app.post('/api/events/:eventId/registrations', eventController.registerForEvent);

// ❌ INCORRECT
/api/user // Should be plural
/api/Users // Should be lowercase
/api/events/:id // Should be ':eventId' for clarity
/api/wellnessPrograms // Should be kebab-case
```

### 6. Environment Variables
- **MUST** use SCREAMING_SNAKE_CASE for environment variable names
- **MUST** use descriptive prefixes to group related variables
- **MUST** include service name in service-specific variables

```typescript
// ✅ CORRECT
DATABASE_URL=postgresql://localhost:5432/claveHR
DATABASE_MAX_CONNECTIONS=20
REDIS_HOST=localhost
REDIS_PORT=6379
SERVICE_API_KEY=your-api-key
EMPLOYEE_SERVICE_URL=http://localhost:3001
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

// ❌ INCORRECT
databaseUrl // Should be SCREAMING_SNAKE_CASE
DB_URL // Too abbreviated
apiKey // Missing SERVICE_ prefix
employeeUrl // Missing SERVICE_ suffix
```

### 7. Error Messages & Logging
- **MUST** use descriptive error message identifiers
- **MUST** use consistent pattern for log message descriptions
- **MUST** group error messages by domain/feature

```typescript
// ✅ CORRECT
const ERROR_MESSAGES = {
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists',
    INVALID_CREDENTIALS: 'Invalid username or password',
    EVENT_REGISTRATION_FULL: 'Event registration is full',
    SURVEY_ALREADY_SUBMITTED: 'Survey has already been submitted',
} as const;

logger.error('Failed to create user account', { 
    error, 
    userId, 
    organizationId 
});

logger.info('User successfully registered for event', { 
    userId, 
    eventId, 
    registrationId 
});

// ❌ INCORRECT
const ERRORS = {
    ERROR1: 'User not found', // Non-descriptive key
    userExists: 'User already exists', // Should be SCREAMING_SNAKE_CASE
}

logger.error('Error', { error }); // Too generic
logger.info('Success'); // No context provided
```

### 8. Test Files & Functions
- **MUST** use descriptive test names that explain what is being tested
- **MUST** follow `describe/it` pattern with clear descriptions
- **MUST** use `should` or `must` pattern for test descriptions

```typescript
// ✅ CORRECT
describe('UserService', () => {
    describe('getUserById', () => {
        it('should return user when valid ID is provided', async () => {});
        it('should return null when user does not exist', async () => {});
        it('should throw error when invalid ID format is provided', async () => {});
    });
    
    describe('createUser', () => {
        it('should create user with valid data', async () => {});
        it('should throw error when email already exists', async () => {});
    });
});

// ❌ INCORRECT
describe('User', () => {
    it('test1', async () => {}); // Non-descriptive
    it('gets user', async () => {}); // Missing context
    it('user creation', async () => {}); // Unclear expectation
});
```

## 📁 FILE: File Organization & Naming

### 1. Service Files
- **MUST** use kebab-case for all service files
- **MUST** suffix with `.service.ts`
- **MUST** group related services in subdirectories when needed

```typescript
// ✅ CORRECT
user.service.ts
email.service.ts
notification.service.ts
event/event.service.ts
event/event-registration.service.ts
wellness/wellness-program.service.ts
survey/pulse-survey.service.ts

// ❌ INCORRECT
UserService.ts          // Should be kebab-case
user_service.ts         // Should use dashes, not underscores
userService.ts          // Should be kebab-case
user.ts                 // Missing .service suffix
```

### 2. Repository Files
- **MUST** use kebab-case for all repository files
- **MUST** suffix with `.repository.ts`
- **MUST** match the primary entity name

```typescript
// ✅ CORRECT
user.repository.ts
event.repository.ts
event-registration.repository.ts
pulse-survey.repository.ts
recognition-comment.repository.ts
wellness-program.repository.ts

// ❌ INCORRECT
UserRepository.ts       // Should be kebab-case
user_repository.ts      // Should use dashes
userRepo.ts            // Should use full 'repository'
users.repository.ts    // Should be singular 'user'
```

### 3. Controller Files
- **MUST** use kebab-case for all controller files
- **MUST** suffix with `.controller.ts`
- **MUST** group in subdirectories by domain when complex

```typescript
// ✅ CORRECT
user.controller.ts
event.controller.ts
survey.controller.ts
recognition/recognition.controller.ts
recognition/recognition-analytics.controller.ts
wellness/wellness-program.controller.ts

// ❌ INCORRECT
UserController.ts       // Should be kebab-case
user_controller.ts      // Should use dashes
userCtrl.ts            // Should use full 'controller'
users.controller.ts    // Should be singular
```

### 4. Route Files
- **MUST** use kebab-case for route files
- **MUST** suffix with `.routes.ts`
- **MUST** use plural form for resource routes

```typescript
// ✅ CORRECT
users.routes.ts
events.routes.ts
surveys.routes.ts
recognitions.routes.ts
wellness-programs.routes.ts
index.ts               // Main route aggregator

// ❌ INCORRECT
UserRoutes.ts          // Should be kebab-case
user_routes.ts         // Should use dashes
user.routes.ts         // Should be plural 'users'
userRoutes.ts          // Should be kebab-case
```

### 5. Model Files (Interfaces, Types, Enums)
- **MUST** use kebab-case for model files
- **MUST** group by type in subdirectories
- **MUST** use descriptive suffixes

```typescript
// ✅ CORRECT - Interfaces
interfaces/user.ts
interfaces/event.ts
interfaces/survey-response.ts
interfaces/recognition-analytics.ts

// ✅ CORRECT - Enums
enums/user-status.ts
enums/event-type.ts
enums/survey-frequency.ts
enums/recognition-type.ts

// ✅ CORRECT - Schemas (Validation)
schemas/user-schema.ts
schemas/event-schema.ts
schemas/survey-schema.ts

// ❌ INCORRECT
User.ts                // Should be in interfaces/ with kebab-case
userInterface.ts       // Should be in interfaces/ as user.ts
UserStatus.ts          // Should be in enums/ as user-status.ts
user_schema.ts         // Should use dashes
```

### 6. Middleware Files
- **MUST** use kebab-case for middleware files
- **MUST** use descriptive action names
- **MUST** group in middlewares directory

```typescript
// ✅ CORRECT
middlewares/authenticate.ts
middlewares/validate-organization.ts
middlewares/rate-limit.ts
middlewares/cors-config.ts
middlewares/error-handler.ts

// ❌ INCORRECT
middleware/Auth.ts     // Should be kebab-case and 'middlewares'
middleware/auth.ts     // Should be 'middlewares' (plural)
validateOrg.ts         // Should be descriptive and in middlewares/
error_handler.ts       // Should use dashes
```

### 7. Utility Files
- **MUST** use kebab-case for utility files
- **MUST** group by purpose
- **MUST** use descriptive names

```typescript
// ✅ CORRECT
utils/date-helper.ts
utils/string-formatter.ts
utils/validation-rules.ts
utils/encryption-helper.ts
utils/file-uploader.ts

// ❌ INCORRECT
utils/dateUtils.ts     // Should be kebab-case
utils/string_utils.ts  // Should use dashes
utils/validation.ts    // Should be more specific
Utils.ts               // Should be in utils/ with kebab-case
```

### 8. Configuration Files
- **MUST** use kebab-case for config files
- **MUST** be descriptive about what they configure

```typescript
// ✅ CORRECT
config/database-config.ts
config/email-config.ts
config/redis-config.ts
config/app-config.ts
config/environment.ts

// ❌ INCORRECT
config/db.ts           // Should be 'database-config'
config/emailConfig.ts  // Should be kebab-case
config/Config.ts       // Should be kebab-case and specific
dbConfig.ts            // Should be in config/ directory
```

### 9. Test Files
- **MUST** mirror source file structure
- **MUST** use same name as source file with `.test.ts` or `.spec.ts`
- **MUST** group by type (unit, integration, e2e)

```typescript
// ✅ CORRECT - Unit Tests
tests/unit/services/user.service.test.ts
tests/unit/repositories/user.repository.test.ts
tests/unit/controllers/user.controller.test.ts

// ✅ CORRECT - Integration Tests
tests/integration/api/users.integration.test.ts
tests/integration/database/user-queries.integration.test.ts

// ✅ CORRECT - E2E Tests
tests/e2e/user-workflow.e2e.test.ts
tests/e2e/survey-completion.e2e.test.ts

// ❌ INCORRECT
tests/UserService.test.ts      // Should mirror structure and use kebab-case
test/user.test.ts              // Should specify type (unit/integration/e2e)
user.service.spec.ts           // Should be in tests/ directory
```

### 10. Constants Files
- **MUST** use kebab-case for constant files
- **MUST** group by domain or purpose
- **MUST** use descriptive names

```typescript
// ✅ CORRECT
constants/error-messages.ts
constants/http-status-codes.ts
constants/validation-rules.ts
constants/api-endpoints.ts
constants/user/user-roles.ts
constants/survey/survey-types.ts

// ❌ INCORRECT
constants/errors.ts       // Should be 'error-messages'
constants/Constants.ts    // Should be kebab-case and specific
constants/httpCodes.ts    // Should be 'http-status-codes'
errorMessages.ts          // Should be in constants/ directory
```

### 11. Directory Structure Rules
- **MUST** follow this exact structure for consistency
- **MUST** group files logically by domain when subdirectories are needed

```
src/
├── api/
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   ├── event.controller.ts
│   │   ├── recognition/
│   │   │   ├── recognition.controller.ts
│   │   │   └── recognition-analytics.controller.ts
│   │   └── wellness/
│   │       ├── wellness-program.controller.ts
│   │       └── wellness-activity.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── users.routes.ts
│   │   ├── events.routes.ts
│   │   └── recognitions.routes.ts
│   └── middlewares/
│       ├── authenticate.ts
│       ├── validate-organization.ts
│       └── error-handler.ts
├── db/
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── event.repository.ts
│   │   └── event-registration.repository.ts
│   └── index.ts
├── di/
│   ├── container.ts
│   ├── service-names.ts
│   └── index.ts
├── services/
│   ├── user.service.ts
│   ├── email.service.ts
│   ├── event/
│   │   ├── event.service.ts
│   │   └── event-registration.service.ts
│   └── wellness/
│       ├── wellness-program.service.ts
│       └── wellness-activity.service.ts
├── models/
│   ├── interfaces/
│   │   ├── user.ts
│   │   ├── event.ts
│   │   └── survey-response.ts
│   ├── enums/
│   │   ├── user-status.ts
│   │   ├── event-type.ts
│   │   └── survey-frequency.ts
│   └── schemas/
│       ├── user-schema.ts
│       ├── event-schema.ts
│       └── survey-schema.ts
├── constants/
│   ├── error-messages.ts
│   ├── http-status-codes.ts
│   └── api-endpoints.ts
├── utils/
│   ├── date-helper.ts
│   ├── validation-rules.ts
│   └── encryption-helper.ts
├── config/
│   ├── database-config.ts
│   ├── email-config.ts
│   └── app-config.ts
└── tests/
    ├── unit/
    │   ├── services/
    │   ├── repositories/
    │   └── controllers/
    ├── integration/
    │   ├── api/
    │   └── database/
    └── e2e/
        └── workflows/
```

### 12. File Naming Best Practices
- **MUST** use meaningful, descriptive names
- **MUST** avoid abbreviations unless they're widely understood
- **MUST** be consistent across the entire codebase
- **MUST** follow the same pattern within each file type

```typescript
// ✅ CORRECT - Descriptive and Consistent
user-authentication.service.ts
employee-onboarding.service.ts
survey-response-analytics.repository.ts
recognition-comment.repository.ts
wellness-program-participation.service.ts

// ❌ INCORRECT - Too Abbreviated or Inconsistent
user-auth.service.ts           // 'auth' too abbreviated
emp-onboard.service.ts         // Too many abbreviations
survey-resp-analytics.repo.ts  // Inconsistent abbreviations
recognition_comment.repository.ts // Mixed naming conventions
wellnessProgramParticipation.service.ts // Wrong case
```

## 🎨 STYLE: Code Style & Formatting

### 1. TypeScript Standards
- **MUST** use TypeScript strict mode
- **MUST** define explicit return types for public methods
- **MUST** use proper interfaces for data structures
- **NEVER** use `any` type except for DI container type assertions

### 2. Function & Method Signatures
- **MUST** use trailing commas in multi-line function parameters
- **MUST** break long parameter lists into multiple lines
- **MUST** use descriptive parameter names

```typescript
// ✅ CORRECT
async updateUser(
    organizationId: string,
    userId: string,
    updates: Partial<User>,
    options?: UpdateOptions,
): Promise<User | null> {

// ❌ INCORRECT
async updateUser(organizationId: string, userId: string, updates: Partial<User>, options?: UpdateOptions): Promise<User | null> {
```

### 3. Import Organization
- **MUST** group imports: external libraries, then internal modules
- **MUST** use consistent import aliases: `{ query as executeQuery, transaction as tx }`
- **MUST** sort imports alphabetically within groups

```typescript
// ✅ CORRECT
import { createLogger, HttpStatusCode } from '@vspl/core';
import { Request, Response } from 'express';

import { query as executeQuery, transaction as tx } from '../db/index';
import { UserService } from '../services/user.service';
```

### 4. Object & Array Formatting
- **MUST** use trailing commas in multi-line objects and arrays
- **MUST** use consistent property alignment
- **MUST** use object shorthand when possible

```typescript
// ✅ CORRECT
const user = {
    id,
    name: userData.name,
    email: userData.email,
    department: userData.department,
};

// ❌ INCORRECT
const user = {
    id: id,
    name: userData.name,
    email: userData.email,
    department: userData.department
};
```

## ⚙️ CONFIG: Constants & Configuration

### 1. String Constants
- **MUST** use constants from `@vspl/core` when available
- **MUST** create local constants in `constants/messages.ts` for service-specific strings
- **NEVER** use hardcoded strings in business logic

```typescript
// ✅ CORRECT
import { HttpStatusCode } from '@vspl/core';
import { ERROR_MESSAGES } from '../constants/messages';

res.status(HttpStatusCode.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_USER });

// ❌ INCORRECT
res.status(400).json({ message: 'Invalid user' });
```

### 2. HTTP Status Codes
- **MUST** use `HttpStatusCode` enum from `@vspl/core`
- **NEVER** use numeric status codes directly

### 3. Environment Variables
- **MUST** access environment variables directly: `process.env.VARIABLE_NAME`
- **MUST** provide sensible defaults: `process.env.API_KEY || 'default-key'`
- **NEVER** import legacy `Config` objects

## 🌐 COMM: Service Communication

### 1. HTTP Client Usage
- **MUST** provide `baseUrl` configuration to `HttpClient` constructor
- **MUST** await `employeeServiceClient` before using: `const client = await employeeServiceClient;`
- **MUST** use service API keys in headers: `'x-service-key': process.env.SERVICE_API_KEY || 'default-key'`

```typescript
// ✅ CORRECT
const client = await employeeServiceClient;
const response = await client.get(`/api/users/${userId}`, { headers });

// ❌ INCORRECT
const response = await (await employeeServiceClient).get(`/api/users/${userId}`, { headers });
```

### 2. Error Handling in Service Calls
- **MUST** use `Promise.allSettled()` for batch operations
- **MUST** handle service failures gracefully
- **MUST** log service communication errors

## 🗃️ DB: Database Repository Patterns

### 1. Query Result Handling
- **MUST** use consistent variable naming: `queryResult` for query results
- **MUST** access data via `queryResult.rows[0]` for single records
- **MUST** access data via `queryResult.rows` for multiple records
- **MUST** check `queryResult.rowCount` for affected rows

```typescript
// ✅ CORRECT
const queryResult = await executeQuery(query, params);
if (queryResult.rows.length === 0) {
    return null;
}
return queryResult.rows[0];

// ❌ INCORRECT
const result = await executeQuery(query, params);
return result; // Missing .rows[0]
```

### 2. Transaction Patterns
- **MUST** use descriptive parameter names in transactions: `async (transaction) =>`
- **MUST** use `transaction.query()` within transaction blocks
- **NEVER** mix `executeQuery` and transaction queries

```typescript
// ✅ CORRECT
return await tx(async (transaction) => {
    const result = await transaction.query(query, params);
    return result.rows[0];
});

// ❌ INCORRECT
return await tx(async (tx) => {
    const result = await executeQuery(query, params); // Wrong - should use transaction.query
    return result.rows[0];
});
```

### 3. Pagination Patterns
- **MUST** return consistent pagination objects:
```typescript
return {
    data: results,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
};
```

## 🎮 CTRL: Controller Patterns

### 1. Request Handling
- **MUST** use type assertions for organization context: `(req as any).organizationId`
- **MUST** validate required parameters before processing
- **MUST** use consistent error response format

### 2. Response Patterns
- **MUST** use appropriate HTTP status codes from `@vspl/core`
- **MUST** return consistent JSON response structures
- **MUST** handle both success and error cases

```typescript
// ✅ CORRECT
try {
    const result = await this.userService.getUser(organizationId, userId);
    res.status(HttpStatusCode.OK).json(result);
} catch (error) {
    logger.error('Error getting user', { error, userId });
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        message: 'Internal server error' 
    });
}
```

## ⚡ PERF: Performance & Best Practices

### 1. Async/Await Usage
- **MUST** use async/await instead of promises
- **MUST** handle Promise.allSettled() for concurrent operations
- **MUST** avoid awaiting in map() - extract client first

```typescript
// ✅ CORRECT
const client = await employeeServiceClient;
const promises = userIds.map((id) => client.get(`/api/users/${id}`, { headers }));

// ❌ INCORRECT
const promises = userIds.map(async (id) => 
    (await employeeServiceClient).get(`/api/users/${id}`, { headers })
);
```

### 2. Memory Management
- **MUST** limit query results with pagination
- **MUST** use streaming for large data operations
- **MUST** clean up resources in finally blocks

### 3. Security
- **MUST** validate organization context for all operations
- **MUST** sanitize user inputs
- **MUST** use parameterized queries to prevent SQL injection
- **NEVER** expose internal error details to clients

## 🗂️ ORG: File Organization (Legacy)

### 1. Directory Structure
```
src/
├── api/
│   ├── controllers/
│   ├── routes/
│   └── middlewares/
├── db/
│   ├── repositories/
│   └── index.ts
├── di/
│   ├── container.ts
│   ├── service-names.ts
│   └── index.ts
├── services/
├── models/
│   ├── interfaces/
│   ├── enums/
│   └── schemas/
├── constants/
└── utils/
```

### 2. File Naming
- **MUST** use kebab-case for file names: `user-service.ts`
- **MUST** use descriptive names reflecting purpose
- **MUST** group related files in appropriate directories

### 3. Export Patterns
- **MUST** use named exports for services and controllers
- **MUST** provide default exports for main classes only
- **MUST** export types and interfaces from appropriate modules

## 🧪 TEST: Testing & Quality

### 1. Code Quality
- **MUST** ensure zero TypeScript compilation errors
- **MUST** fix linting warnings (unused variables, etc.)
- **MUST** maintain consistent code formatting

### 2. Error Prevention
- **MUST** validate all input parameters
- **MUST** handle edge cases (empty arrays, null values)
- **MUST** provide meaningful error messages

### 3. Documentation
- **MUST** document complex business logic
- **MUST** provide JSDoc comments for public methods
- **MUST** update this rules file when patterns change

## 🔄 MIGRATE: Migration & Legacy Code

### 1. Removing Legacy Patterns
- **MUST** remove `@CatchErrors` decorators when encountered
- **MUST** migrate from `db.*` direct calls to DI pattern
- **MUST** replace local logger imports with `@vspl/core` logger
- **MUST** remove database table existence checks

### 2. Backward Compatibility
- **MUST** maintain API contract compatibility during refactoring
- **MUST** ensure existing functionality remains intact
- **MUST** test thoroughly after architectural changes

---

## 📋 QUICK: Quick Reference Guide

### Section Identifiers for Development Guidance

| **Prefix** | **Section** | **Purpose** | **When to Use** |
|------------|-------------|-------------|-----------------|
| **🏛️ ARCH** | Architecture & Design Patterns | DI Container, Database Patterns, Error Handling | Setting up services, repositories, controllers |
| **🏷️ NAME** | Naming Conventions | Variables, Classes, Constants, DB queries | Writing any new code |
| **📁 FILE** | File Organization & Naming | File structure, naming patterns | Creating new files or organizing code |
| **🎨 STYLE** | Code Style & Formatting | TypeScript, formatting, imports | Code formatting and structure |
| **⚙️ CONFIG** | Constants & Configuration | String constants, HTTP codes, env vars | Adding constants or configuration |
| **🌐 COMM** | Service Communication | HTTP clients, inter-service calls | Service-to-service communication |
| **🗃️ DB** | Database Repository Patterns | Query handling, transactions, pagination | Database operations |
| **🎮 CTRL** | Controller Patterns | Request/response handling | API endpoint development |
| **⚡ PERF** | Performance & Best Practices | Async/await, memory, security | Performance optimization |
| **🧪 TEST** | Testing & Quality | Code quality, testing patterns | Writing tests and ensuring quality |
| **🔄 MIGRATE** | Migration & Legacy Code | Legacy pattern removal | Refactoring existing code |

### File Naming Quick Reference

| **File Type** | **Pattern** | **Example** |
|---------------|-------------|-------------|
| Services | `{entity}.service.ts` | `user.service.ts` |
| Repositories | `{entity}.repository.ts` | `event-registration.repository.ts` |
| Controllers | `{entity}.controller.ts` | `survey.controller.ts` |
| Routes | `{entities}.routes.ts` | `users.routes.ts` |
| Interfaces | `interfaces/{entity}.ts` | `interfaces/user.ts` |
| Enums | `enums/{entity}-{type}.ts` | `enums/user-status.ts` |
| Constants | `constants/{purpose}.ts` | `constants/error-messages.ts` |
| Utils | `utils/{purpose}-{type}.ts` | `utils/date-helper.ts` |
| Tests | `tests/{type}/{path}.test.ts` | `tests/unit/services/user.service.test.ts` |

### Common Patterns Quick Reference

```typescript
// ✅ Service Constructor Pattern
constructor(
    userRepository: UserRepository,
    emailService: EmailService,
) {
    this.userRepository = userRepository;
    this.emailService = emailService;
}

// ✅ Database Query Pattern
const queryResult = await executeQuery(getUserQuery, [userId]);
return queryResult.rows[0];

// ✅ Transaction Pattern
return await tx(async (transaction) => {
    const result = await transaction.query(query, params);
    return result.rows[0];
});

// ✅ Controller Response Pattern
try {
    const result = await this.userService.getUser(organizationId, userId);
    res.status(HttpStatusCode.OK).json(result);
} catch (error) {
    logger.error('Error getting user', { error, userId });
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR 
    });
}

// ✅ Service Communication Pattern
const client = await employeeServiceClient;
const response = await client.get(`/api/users/${userId}`, { headers });

// ✅ Logging Pattern
logger.error('Failed to create user', { error, userId, organizationId });
```

---

## ✅ ENFORCE: Enforcement

These rules are **MANDATORY** for all backend development. Code reviews **MUST** verify compliance with these standards. Any deviation requires explicit justification and team approval.

### Compliance Checklist

- [ ] **🏛️ ARCH**: Uses DI container, proper database patterns, no `@CatchErrors`
- [ ] **🏷️ NAME**: Follows camelCase, PascalCase, SCREAMING_SNAKE_CASE rules
- [ ] **📁 FILE**: Uses kebab-case files with proper suffixes and structure
- [ ] **🎨 STYLE**: Proper TypeScript, trailing commas, import organization
- [ ] **⚙️ CONFIG**: Uses constants from `@vspl/core` or local constants
- [ ] **🌐 COMM**: Proper HTTP client patterns with await handling
- [ ] **🗃️ DB**: Uses `queryResult.rows[0]`, proper transactions
- [ ] **🎮 CTRL**: Proper request handling with error responses
- [ ] **⚡ PERF**: Async/await patterns, Promise.allSettled for batches
- [ ] **🧪 TEST**: Zero TypeScript errors, proper test structure
- [ ] **🔄 MIGRATE**: Removes legacy patterns, maintains compatibility

Last Updated: January 2025
Version: 2.0.0
