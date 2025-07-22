import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate, loadUser } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { serviceAuth } from '../middlewares/service-auth'; // Import the service auth middleware
import {
    CreateUserValidator,
    UpdateUserValidator,
    GetUserValidator,
    DeleteUserValidator,
    ListUsersValidator,
    GetCurrentUserValidator
} from '../validators/user.validator';
import { Permission } from '../../models/enums/roles.enum';

export const createUserRoutes = (userController: UserController) => {
    const router = Router();

    // Create a new user - requires manage_users permission or valid service key
    router.post(
        '/',
        serviceAuth, // Add service auth middleware first
        authenticate,
        authorize(Permission.MANAGE_USERS),
        validateRequest(CreateUserValidator),
        userController.createUser.bind(userController)
    );

    // Get current authenticated user
    router.get(
        '/me',
        authenticate,
        loadUser,
        validateRequest(GetCurrentUserValidator),
        userController.getCurrentUser.bind(userController)
    );

    // Get user by ID - requires view_all_users permission
    router.get(
        '/:id',
        serviceAuth, // Add service auth middleware
        authenticate,
        validateRequest(GetUserValidator),
        userController.getUser.bind(userController)
    );

    // Update user - requires manage_users permission
    router.put(
        '/:id',
        serviceAuth, // Add service auth middleware
        authenticate,
        authorize(Permission.MANAGE_USERS),
        validateRequest(UpdateUserValidator),
        userController.updateUser.bind(userController)
    );

    // Delete user - requires manage_users permission
    router.delete(
        '/:id',
        serviceAuth, // Add service auth middleware
        authenticate,
        authorize(Permission.MANAGE_USERS),
        validateRequest(DeleteUserValidator),
        userController.deleteUser.bind(userController)
    );

    // List users with optional filtering - requires view_all_users permission
    router.get(
        '/',
        serviceAuth, // Add service auth middleware
        authenticate,
        authorize(Permission.VIEW_ALL_USERS),
        validateRequest(ListUsersValidator),
        userController.listUsers.bind(userController)
    );

    return router;
}; 