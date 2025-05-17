import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validateRoleAssignment, getAssignableRoles } from '../middlewares/validate-role-assignment';

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
    RemoveRoleFromUserValidator,
    GetUserRolesValidator,
    AssignPermissionToRoleValidator,
    RemovePermissionFromRoleValidator,
    GetRolePermissionsValidator,
    CheckUserPermissionValidator
} from '../validators/role.validator';

const router = Router();

/**
 * Role Management Routes
 */
router.get(
    '/',
    authenticate,
    authorize('view_all_users'),
    validateRequest(ListRolesValidator),
    roleController.getRoles
);

router.get(
    '/assignable',
    authenticate,
    getAssignableRoles,
    roleController.getAssignableRoles
);

router.get(
    '/:id',
    authenticate,
    authorize('view_all_users'),
    validateRequest(GetRoleValidator),
    roleController.getRoleById
);

router.post(
    '/',
    authenticate,
    authorize('manage_roles'),
    validateRequest(CreateRoleValidator),
    roleController.createRole
);

router.put(
    '/:id',
    authenticate,
    authorize('manage_roles'),
    validateRequest(UpdateRoleValidator),
    roleController.updateRole
);

router.delete(
    '/:id',
    authenticate,
    authorize('manage_roles'),
    validateRequest(DeleteRoleValidator),
    roleController.deleteRole
);

/**
 * Permission Management Routes
 */
router.get(
    '/permissions',
    authenticate,
    authorize('manage_roles'),
    validateRequest(ListPermissionsValidator),
    roleController.getPermissions
);

router.get(
    '/permissions/:id',
    authenticate,
    authorize('manage_roles'),
    validateRequest(GetPermissionValidator),
    roleController.getPermissionById
);

router.post(
    '/permissions',
    authenticate,
    authorize('manage_system'),
    validateRequest(CreatePermissionValidator),
    roleController.createPermission
);

router.put(
    '/permissions/:id',
    authenticate,
    authorize('manage_system'),
    validateRequest(UpdatePermissionValidator),
    roleController.updatePermission
);

router.delete(
    '/permissions/:id',
    authenticate,
    authorize('manage_system'),
    validateRequest(DeletePermissionValidator),
    roleController.deletePermission
);

/**
 * User Role Assignment Routes
 */
router.get(
    '/user/:userId',
    authenticate,
    authorize('view_all_users'),
    validateRequest(GetUserRolesValidator),
    roleController.getUserRoles
);

router.post(
    '/assign',
    authenticate,
    authorize('manage_roles'),
    validateRequest(AssignRoleToUserValidator),
    validateRoleAssignment,
    roleController.assignRoleToUser
);

router.delete(
    '/user/:userId/role/:roleId',
    authenticate,
    authorize('manage_roles'),
    validateRequest(RemoveRoleFromUserValidator),
    validateRoleAssignment,
    roleController.removeRoleFromUser
);

/**
 * Role Permission Routes
 */
router.get(
    '/:roleId/permissions',
    authenticate,
    authorize('view_all_users'),
    validateRequest(GetRolePermissionsValidator),
    roleController.getRolePermissions
);

router.post(
    '/permissions/assign',
    authenticate,
    authorize('manage_system'),
    validateRequest(AssignPermissionToRoleValidator),
    roleController.assignPermissionToRole
);

router.delete(
    '/:roleId/permissions/:permissionId',
    authenticate,
    authorize('manage_system'),
    validateRequest(RemovePermissionFromRoleValidator),
    roleController.removePermissionFromRole
);

/**
 * Permission Check Route
 */
router.get(
    '/check-permission/:userId/:permissionName',
    authenticate,
    authorize('view_all_users'),
    validateRequest(CheckUserPermissionValidator),
    roleController.checkUserPermission
);

export default router; 