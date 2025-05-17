import { Router } from 'express';
import { SetupCodeController } from '../controllers/setup-code.controller';
import { validateRequest } from '../middlewares/validate-request';
import { verifyAdminKey } from '../middlewares/admin-auth';
import { addSetupCodeHeader } from '../middlewares/setup-code';
import {
    CreateSetupCodeValidator,
    ValidateSetupCodeValidator,
    DeleteSetupCodeValidator,
    ListSetupCodesValidator
} from '../validators/organization.validator';

export const createSetupCodeRoutes = (setupCodeController: SetupCodeController) => {
    const router = Router();

    // Create a new setup code - requires admin key
    router.post(
        '/',
        verifyAdminKey,
        validateRequest(CreateSetupCodeValidator),
        setupCodeController.createSetupCode.bind(setupCodeController)
    );

    // Validate and use a setup code - adds setup code to header
    router.post(
        '/validate',
        validateRequest(ValidateSetupCodeValidator),
        addSetupCodeHeader,
        setupCodeController.validateSetupCode.bind(setupCodeController)
    );

    // Delete a setup code - requires admin key
    router.delete(
        '/:id',
        verifyAdminKey,
        validateRequest(DeleteSetupCodeValidator),
        setupCodeController.deleteSetupCode.bind(setupCodeController)
    );

    // Get all setup codes for an organization (this route is defined separately)

    return router;
}; 