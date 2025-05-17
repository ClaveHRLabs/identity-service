import { Router } from 'express';
import { SetupCodeController } from '../controllers/setup-code.controller';
import { validateRequest } from '../middlewares/validate-request';
import {
    CreateSetupCodeValidator,
    ValidateSetupCodeValidator,
    DeleteSetupCodeValidator,
    ListSetupCodesValidator
} from '../validators/organization.validator';

export const createSetupCodeRoutes = (setupCodeController: SetupCodeController) => {
    const router = Router();

    // Create a new setup code
    router.post(
        '/',
        validateRequest(CreateSetupCodeValidator),
        setupCodeController.createSetupCode.bind(setupCodeController)
    );

    // Validate and use a setup code
    router.post(
        '/validate',
        validateRequest(ValidateSetupCodeValidator),
        setupCodeController.validateSetupCode.bind(setupCodeController)
    );

    // Delete a setup code
    router.delete(
        '/:id',
        validateRequest(DeleteSetupCodeValidator),
        setupCodeController.deleteSetupCode.bind(setupCodeController)
    );

    // Get all setup codes for an organization (this route is defined separately)

    return router;
}; 