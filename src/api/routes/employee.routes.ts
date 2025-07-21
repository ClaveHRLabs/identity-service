import express from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { EmployeeService } from '../../services/employee.service';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate-request';
import { EmployeeValidator } from '../validators/employee.validator';
import { Permission } from '../../models/enums/roles.enum';
import { authorize } from '../middlewares/authorize';

const router = express.Router();
const employeeController = new EmployeeController(new EmployeeService());
const validator = new EmployeeValidator();

// All employee routes require authentication
router.use(authenticate);

// Create a new employee
router.post(
    '/',
    authorize(Permission.MANAGE_USERS),
    validateRequest(validator.createEmployeeSchema),
    (req, res, next) => employeeController.createEmployee(req, res, next)
);

// Get employee by ID
router.get(
    '/:id',
    authorize(Permission.MANAGE_USERS),
    (req, res, next) => employeeController.getEmployee(req, res, next)
);

// Update employee
router.patch(
    '/:id',
    authorize(Permission.MANAGE_USERS),
    validateRequest(validator.updateEmployeeSchema),
    (req, res, next) => employeeController.updateEmployee(req, res, next)
);

// Delete employee
router.delete(
    '/:id',
    authorize(Permission.MANAGE_USERS),
    (req, res, next) => employeeController.deleteEmployee(req, res, next)
);

// List employees
router.get(
    '/',
    authorize(Permission.MANAGE_USERS),
    (req, res, next) => employeeController.listEmployees(req, res, next)
);

// Update employee onboarding status
router.patch(
    '/:id/onboarding',
    authorize(Permission.MANAGE_USERS),
    validateRequest(validator.onboardingUpdateSchema),
    (req, res, next) => employeeController.updateOnboardingStatus(req, res, next)
);

// Get employees by manager
router.get(
    '/manager/:managerId',
    authorize(Permission.MANAGE_USERS),
    (req, res, next) => employeeController.getEmployeesByManager(req, res, next)
);

export default router; 