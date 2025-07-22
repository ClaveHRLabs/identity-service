import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validateRoleAssignment, getAssignableRoles } from '../middlewares/validate-role-assignment';
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
    CheckUserPermissionValidator
} from '../validators/role.validator';
import { Permission } from '../../models/enums/roles.enum';

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
    roleController.getRoles
);

router.get(
    '/assignable',
    serviceAuth, // Add service auth
    authenticate,
    getAssignableRoles,
    roleController.getAssignableRoles
);

router.get(
    '/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.VIEW_ALL_USERS),
    validateRequest(GetRoleValidator),
    roleController.getRoleById
);

router.post(
    '/',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(CreateRoleValidator),
    roleController.createRole
);

router.put(
    '/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(UpdateRoleValidator),
    roleController.updateRole
);

router.delete(
    '/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(DeleteRoleValidator),
    roleController.deleteRole
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
    roleController.getPermissions
);

router.get(
    '/permissions/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(GetPermissionValidator),
    roleController.getPermissionById
);

router.post(
    '/permissions',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_SYSTEM),
    validateRequest(CreatePermissionValidator),
    roleController.createPermission
);

router.put(
    '/permissions/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_SYSTEM),
    validateRequest(UpdatePermissionValidator),
    roleController.updatePermission
);

router.delete(
    '/permissions/:id',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_SYSTEM),
    validateRequest(DeletePermissionValidator),
    roleController.deletePermission
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
    roleController.getUserRoles
);

router.post(
    '/assign',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(AssignRoleToUserValidator),
    validateRoleAssignment,
    roleController.assignRoleToUser
);

router.post(
    '/assign-by-name',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(AssignRoleToUserByNameValidator),
    roleController.assignRoleToUserByName
);

router.post(
    '/user/:userId/remove-role',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(RemoveRoleFromUserByNameValidator),
    roleController.removeRoleFromUserByName
);

router.delete(
    '/user/:userId/role/:roleId',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_ROLES),
    validateRequest(RemoveRoleFromUserValidator),
    validateRoleAssignment,
    roleController.removeRoleFromUser
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
    roleController.getRolePermissions
);

router.post(
    '/permissions/assign',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_SYSTEM),
    validateRequest(AssignPermissionToRoleValidator),
    roleController.assignPermissionToRole
);

router.delete(
    '/:roleId/permissions/:permissionId',
    serviceAuth, // Add service auth
    authenticate,
    authorize(Permission.MANAGE_SYSTEM),
    validateRequest(RemovePermissionFromRoleValidator),
    roleController.removePermissionFromRole
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
    roleController.checkUserPermission
);

export default router; 