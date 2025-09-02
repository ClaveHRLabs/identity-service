import { Router } from 'express';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
    validateRoleAssignment,
    getAssignableRoles,
} from '../middlewares/validate-role-assignment';
import { serviceAuth } from '../middlewares/service-auth'; // Import service auth middleware

import {
    CreateRoleValidator,
    UpdateRoleValidator,
    GetRoleValidator,
    DeleteRoleValidator,
    ListRolesValidator,
    CreatePermissionValidator,
    UpdatePermissionValidator,
    GetPermissionValidator,
    DeletePermissionValidator,
    ListPermissionsValidator,
    AssignRoleToUserValidator,
    AssignRoleToUserByNameValidator,
    RemoveRoleFromUserValidator,
    RemoveRoleFromUserByNameValidator,
    GetUserRolesValidator,
    AssignPermissionToRoleValidator,
    RemovePermissionFromRoleValidator,
    GetRolePermissionsValidator,
    CheckUserPermissionValidator,
} from '../validators/role.validator';
import { Permission } from '../../models/enums/roles.enum';
import { RoleController } from '../controllers/role.controller';

export const createRoleRoutes = (roleController: RoleController) => {
    const router = Router();

    /**
     * Role Management Routes
     */
    router.get(
        '/',
        serviceAuth, // Add service auth
        authenticate,
        authorize('view_all_users'),
        validateRequest(ListRolesValidator),
        roleController.getRoles.bind(roleController),
    );

    router.get(
        '/assignable',
        serviceAuth, // Add service auth
        authenticate,
        getAssignableRoles,
        roleController.getAssignableRoles.bind(roleController),
    );

    router.get(
        '/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.VIEW_ALL_USERS),
        validateRequest(GetRoleValidator),
        roleController.getRoleById.bind(roleController),
    );

    router.post(
        '/',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(CreateRoleValidator),
        roleController.createRole.bind(roleController),
    );

    router.put(
        '/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(UpdateRoleValidator),
        roleController.updateRole.bind(roleController),
    );

    router.delete(
        '/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(DeleteRoleValidator),
        roleController.deleteRole.bind(roleController),
    );

    /**
     * Permission Management Routes
     */
    router.get(
        '/permissions',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(ListPermissionsValidator),
        roleController.getPermissions.bind(roleController),
    );

    router.get(
        '/permissions/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(GetPermissionValidator),
        roleController.getPermissionById.bind(roleController),
    );

    router.post(
        '/permissions',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_SYSTEM),
        validateRequest(CreatePermissionValidator),
        roleController.createPermission.bind(roleController),
    );

    router.put(
        '/permissions/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_SYSTEM),
        validateRequest(UpdatePermissionValidator),
        roleController.updatePermission.bind(roleController),
    );

    router.delete(
        '/permissions/:id',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_SYSTEM),
        validateRequest(DeletePermissionValidator),
        roleController.deletePermission.bind(roleController),
    );

    /**
     * User Role Assignment Routes
     */
    router.get(
        '/user/:userId',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.VIEW_ALL_USERS),
        validateRequest(GetUserRolesValidator),
        roleController.getRoles.bind(roleController), // TODO: implement getUserRoles
    );

    router.post(
        '/assign',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(AssignRoleToUserValidator),
        validateRoleAssignment,
        roleController.createRole.bind(roleController), // TODO: implement assignRoleToUser
    );

    router.post(
        '/assign-by-name',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(AssignRoleToUserByNameValidator),
        roleController.createRole.bind(roleController), // TODO: implement assignRoleToUserByName
    );

    router.post(
        '/user/:userId/remove-role',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(RemoveRoleFromUserByNameValidator),
        roleController.deleteRole.bind(roleController), // TODO: implement removeRoleFromUserByName
    );

    router.delete(
        '/user/:userId/role/:roleId',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_ROLES),
        validateRequest(RemoveRoleFromUserValidator),
        validateRoleAssignment,
        roleController.deleteRole.bind(roleController), // TODO: implement removeRoleFromUser
    );

    /**
     * Role Permission Routes
     */
    router.get(
        '/:roleId/permissions',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.VIEW_ALL_USERS),
        validateRequest(GetRolePermissionsValidator),
        roleController.getRolePermissions.bind(roleController),
    );

    router.post(
        '/permissions/assign',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_SYSTEM),
        validateRequest(AssignPermissionToRoleValidator),
        roleController.assignPermissionToRole.bind(roleController),
    );

    router.delete(
        '/:roleId/permissions/:permissionId',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.MANAGE_SYSTEM),
        validateRequest(RemovePermissionFromRoleValidator),
        roleController.removePermissionFromRole.bind(roleController),
    );

    /**
     * Permission Check Route
     */
    router.get(
        '/check-permission/:userId/:permissionName',
        serviceAuth, // Add service auth
        authenticate,
        authorize(Permission.VIEW_ALL_USERS),
        validateRequest(CheckUserPermissionValidator),
        roleController.getRoles.bind(roleController), // TODO: implement checkUserPermission
    );

    return router;
};
