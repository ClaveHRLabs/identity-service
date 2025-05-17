import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate, loadUser } from '../middlewares/authenticate';
import {
    CreateUserValidator,
    UpdateUserValidator,
    GetUserValidator,
    DeleteUserValidator,
    ListUsersValidator,
    GetCurrentUserValidator
} from '../validators/user.validator';

export const createUserRoutes = (userController: UserController) => {
    const router = Router();

    // Create a new user
    router.post(
        '/',
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

    // Get user by ID
    router.get(
        '/:id',
        validateRequest(GetUserValidator),
        userController.getUser.bind(userController)
    );

    // Update user
    router.put(
        '/:id',
        validateRequest(UpdateUserValidator),
        userController.updateUser.bind(userController)
    );

    // Delete user
    router.delete(
        '/:id',
        validateRequest(DeleteUserValidator),
        userController.deleteUser.bind(userController)
    );

    // List users with optional filtering
    router.get(
        '/',
        validateRequest(ListUsersValidator),
        userController.listUsers.bind(userController)
    );

    return router;
}; 