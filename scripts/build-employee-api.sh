#!/bin/bash

# Create required directories
mkdir -p dist/models/interfaces
mkdir -p dist/api/controllers
mkdir -p dist/api/routes
mkdir -p dist/api/validators
mkdir -p dist/services

# Copy and transpile the employee files
echo "Transpiling employee interface..."
npx tsc src/models/interfaces/employee.ts --outDir dist/models/interfaces --esModuleInterop true --skipLibCheck true

echo "Transpiling employee controller..."
npx tsc src/api/controllers/employee.controller.ts --outDir dist/api/controllers --esModuleInterop true --skipLibCheck true

echo "Transpiling employee routes..."
npx tsc src/api/routes/employee.routes.ts --outDir dist/api/routes --esModuleInterop true --skipLibCheck true

echo "Transpiling employee validator..."
npx tsc src/api/validators/employee.validator.ts --outDir dist/api/validators --esModuleInterop true --skipLibCheck true

echo "Transpiling employee service..."
npx tsc src/services/employee.service.ts --outDir dist/services --esModuleInterop true --skipLibCheck true

# Add migration file
echo "Copying migration file..."
mkdir -p dist/schema/migrations
cp src/schema/migrations/006_employees.sql dist/schema/migrations/

echo "Build completed successfully." 