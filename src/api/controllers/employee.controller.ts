import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../../services/employee.service';
import { logger } from '../../utils/logger';

export class EmployeeController {
    private employeeService: EmployeeService;

    constructor(employeeService: EmployeeService) {
        this.employeeService = employeeService;
    }

    /**
     * Create a new employee
     */
    async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const employeeData = req.body;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const employee = await this.employeeService.createEmployee(employeeData, organizationId);

            res.status(201).json({
                success: true,
                data: employee
            });
        } catch (error) {
            logger.error('Error creating employee', { error });
            next(error);
        }
    }

    /**
     * Get employee by ID
     */
    async getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const employee = await this.employeeService.getEmployeeById(id, organizationId);

            if (!employee) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: employee
            });
        } catch (error) {
            logger.error('Error getting employee', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Update employee
     */
    async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const employee = await this.employeeService.updateEmployee(id, updateData, organizationId);

            if (!employee) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: employee
            });
        } catch (error) {
            logger.error('Error updating employee', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Delete employee
     */
    async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const deleted = await this.employeeService.deleteEmployee(id, organizationId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Employee deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting employee', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * List employees with optional filtering
     */
    async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { 
                status, 
                department, 
                search,
                limit = '100', 
                offset = '0' 
            } = req.query;
            
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const filters: { 
                status?: string; 
                department?: string;
                search?: string;
            } = {};
            
            if (status) filters.status = status as string;
            if (department) filters.department = department as string;
            if (search) filters.search = search as string;

            const result = await this.employeeService.listEmployees(
                organizationId,
                filters,
                Number(limit),
                Number(offset)
            );

            res.status(200).json({
                success: true,
                data: {
                    items: result.employees,
                    total: result.total,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });
        } catch (error) {
            logger.error('Error listing employees', { error, query: req.query });
            next(error);
        }
    }
    
    /**
     * Update employee onboarding status
     */
    async updateOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { stage, progress, task } = req.body;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const employee = await this.employeeService.updateOnboardingStatus(
                id, 
                { stage, progress, task },
                organizationId
            );

            if (!employee) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: employee
            });
        } catch (error) {
            logger.error('Error updating employee onboarding', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Get employees by manager
     */
    async getEmployeesByManager(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { managerId } = req.params;
            const organizationId = req.organizationId;

            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    message: 'Organization ID is required'
                });
                return;
            }

            const employees = await this.employeeService.getEmployeesByManager(managerId, organizationId);

            res.status(200).json({
                success: true,
                data: employees
            });
        } catch (error) {
            logger.error('Error getting employees by manager', { error, managerId: req.params.managerId });
            next(error);
        }
    }
} 