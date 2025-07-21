import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { UserService } from './user.service';
import db from '../db/db';
import { 
    Employee, 
    EmployeeStatus, 
    Department,
    ContractType,
    EmploymentLevel,
    OnboardingStage
} from '../models/interfaces/employee';

export interface EmployeeFilters {
    status?: string;
    department?: string;
    search?: string;
}

interface OnboardingUpdate {
    stage?: OnboardingStage;
    progress?: number;
    task?: {
        id: string;
        status: string;
    };
}

export class EmployeeService {
    private pool: any; // Use any type for now to bypass the TypeScript error
    private userService: UserService;

    constructor(userService?: UserService) {
        this.pool = db;
        this.userService = userService || new UserService();
    }

    /**
     * Create a new employee
     */
    async createEmployee(employeeData: Partial<Employee>, organizationId: string): Promise<Employee> {
        // Begin transaction
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Generate a new ID for the employee
            const employeeId = uuidv4();
            
            // Insert into employees table
            const result = await client.query(
                `INSERT INTO employees (
                    id, 
                    organization_id,
                    user_id,
                    status,
                    personal_info,
                    contact_info,
                    employment_details,
                    education,
                    work_experience,
                    skills,
                    documents,
                    onboarding,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`,
                [
                    employeeId,
                    organizationId,
                    employeeData.userId,
                    employeeData.status || 'active',
                    employeeData.personalInfo ? JSON.stringify(employeeData.personalInfo) : '{}',
                    employeeData.contactInfo ? JSON.stringify(employeeData.contactInfo) : '{}',
                    employeeData.employmentDetails ? JSON.stringify(employeeData.employmentDetails) : '{}',
                    employeeData.education ? JSON.stringify(employeeData.education) : '[]',
                    employeeData.workExperience ? JSON.stringify(employeeData.workExperience) : '[]',
                    employeeData.skills ? JSON.stringify(employeeData.skills) : '[]',
                    employeeData.documents ? JSON.stringify(employeeData.documents) : '[]',
                    employeeData.onboarding ? JSON.stringify(employeeData.onboarding) : '{}'
                ]
            );
            
            // If employee is linked to a user, update the user record with employee_id
            if (employeeData.userId) {
                await client.query(
                    'UPDATE users SET metadata = metadata || $1 WHERE id = $2',
                    [
                        JSON.stringify({ employee_id: employeeId }),
                        employeeData.userId
                    ]
                );
            }
            
            await client.query('COMMIT');
            
            return this.mapRowToEmployee(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating employee', { error });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get an employee by ID
     */
    async getEmployeeById(employeeId: string, organizationId: string): Promise<Employee | null> {
        try {
            const result = await this.pool.query(
                `SELECT * FROM employees WHERE id = $1 AND organization_id = $2`,
                [employeeId, organizationId]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.mapRowToEmployee(result.rows[0]);
        } catch (error) {
            logger.error('Error getting employee by ID', { error, employeeId });
            throw error;
        }
    }

    /**
     * Update an employee
     */
    async updateEmployee(employeeId: string, updateData: Partial<Employee>, organizationId: string): Promise<Employee | null> {
        // Begin transaction
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // First check if employee exists and belongs to the organization
            const checkResult = await client.query(
                `SELECT id FROM employees WHERE id = $1 AND organization_id = $2`,
                [employeeId, organizationId]
            );
            
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }
            
            // Build the update query dynamically based on what fields are provided
            const updates: string[] = [];
            const values: any[] = [employeeId, organizationId];
            let valueIndex = 3;
            
            if (updateData.status) {
                updates.push(`status = $${valueIndex++}`);
                values.push(updateData.status);
            }
            
            if (updateData.personalInfo) {
                updates.push(`personal_info = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.personalInfo));
            }
            
            if (updateData.contactInfo) {
                updates.push(`contact_info = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.contactInfo));
            }
            
            if (updateData.employmentDetails) {
                updates.push(`employment_details = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.employmentDetails));
            }
            
            if (updateData.education) {
                updates.push(`education = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.education));
            }
            
            if (updateData.workExperience) {
                updates.push(`work_experience = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.workExperience));
            }
            
            if (updateData.skills) {
                updates.push(`skills = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.skills));
            }
            
            if (updateData.documents) {
                updates.push(`documents = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.documents));
            }
            
            if (updateData.onboarding) {
                updates.push(`onboarding = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.onboarding));
            }
            
            // If there are no updates, return the current employee
            if (updates.length === 0) {
                await client.query('ROLLBACK');
                return this.getEmployeeById(employeeId, organizationId);
            }
            
            // Add updated_at timestamp
            updates.push(`updated_at = NOW()`);
            
            // Perform the update
            const result = await client.query(
                `UPDATE employees 
                SET ${updates.join(', ')} 
                WHERE id = $1 AND organization_id = $2 
                RETURNING *`,
                values
            );
            
            await client.query('COMMIT');
            
            return this.mapRowToEmployee(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating employee', { error, employeeId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete an employee
     */
    async deleteEmployee(employeeId: string, organizationId: string): Promise<boolean> {
        try {
            const result = await this.pool.query(
                `DELETE FROM employees WHERE id = $1 AND organization_id = $2 RETURNING id`,
                [employeeId, organizationId]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            logger.error('Error deleting employee', { error, employeeId });
            throw error;
        }
    }

    /**
     * List employees with optional filtering
     */
    async listEmployees(
        organizationId: string, 
        filters: EmployeeFilters, 
        limit: number = 100, 
        offset: number = 0
    ): Promise<{ employees: Employee[]; total: number }> {
        try {
            // Build the query with optional filters
            let whereClause = 'WHERE organization_id = $1';
            const values: any[] = [organizationId];
            let valueIndex = 2;
            
            if (filters.status) {
                whereClause += ` AND status = $${valueIndex++}`;
                values.push(filters.status);
            }
            
            if (filters.department) {
                whereClause += ` AND employment_details->>'department' = $${valueIndex++}`;
                values.push(filters.department);
            }
            
            if (filters.search) {
                whereClause += ` AND (
                    personal_info->>'firstName' ILIKE $${valueIndex} OR
                    personal_info->>'lastName' ILIKE $${valueIndex} OR
                    contact_info->>'email' ILIKE $${valueIndex} OR
                    employment_details->>'position' ILIKE $${valueIndex}
                )`;
                values.push(`%${filters.search}%`);
                valueIndex++;
            }
            
            // Execute the query
            const result = await this.pool.query(
                `SELECT * FROM employees ${whereClause} ORDER BY created_at DESC LIMIT $${valueIndex++} OFFSET $${valueIndex}`,
                [...values, limit, offset]
            );
            
            // Get total count for pagination
            const countResult = await this.pool.query(
                `SELECT COUNT(*) FROM employees ${whereClause}`,
                values
            );
            
            return {
                employees: result.rows.map((row: any) => this.mapRowToEmployee(row)),
                total: parseInt(countResult.rows[0].count, 10)
            };
        } catch (error) {
            logger.error('Error listing employees', { error });
            throw error;
        }
    }

    /**
     * Update employee onboarding status
     */
    async updateOnboardingStatus(
        employeeId: string,
        updateData: OnboardingUpdate,
        organizationId: string
    ): Promise<Employee | null> {
        // Begin transaction
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Get the current employee to update the onboarding data
            const currentEmployee = await this.getEmployeeById(employeeId, organizationId);
            
            if (!currentEmployee) {
                await client.query('ROLLBACK');
                return null;
            }
            
            const currentOnboarding = currentEmployee.onboarding || {};
            let updatedOnboarding = { ...currentOnboarding };
            
            // Update onboarding stage if provided
            if (updateData.stage) {
                updatedOnboarding.stage = updateData.stage;
            }
            
            // Update progress if provided
            if (typeof updateData.progress === 'number') {
                updatedOnboarding.progress = updateData.progress;
            }
            
            // Update a specific task if provided
            if (updateData.task && updateData.task.id) {
                const tasks = updatedOnboarding.tasks || [];
                const taskIndex = tasks.findIndex(t => t.id === updateData.task?.id);
                
                if (taskIndex >= 0) {
                    tasks[taskIndex] = {
                        ...tasks[taskIndex],
                        status: updateData.task.status as "not_started" | "in_progress" | "completed" | "overdue",
                        completionDate: updateData.task.status === 'completed' ? new Date().toISOString() : tasks[taskIndex].completionDate
                    };
                }
                
                updatedOnboarding.tasks = tasks;
            }
            
            // Update the employee with the new onboarding data
            const result = await client.query(
                `UPDATE employees 
                SET onboarding = $1, updated_at = NOW() 
                WHERE id = $2 AND organization_id = $3 
                RETURNING *`,
                [JSON.stringify(updatedOnboarding), employeeId, organizationId]
            );
            
            await client.query('COMMIT');
            
            return this.mapRowToEmployee(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating employee onboarding', { error, employeeId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get employees by manager
     */
    async getEmployeesByManager(managerId: string, organizationId: string): Promise<Employee[]> {
        try {
            const result = await this.pool.query(
                `SELECT * FROM employees 
                WHERE organization_id = $1 
                AND employment_details->>'manager' = $2`,
                [organizationId, managerId]
            );
            
            return result.rows.map((row: any) => this.mapRowToEmployee(row));
        } catch (error) {
            logger.error('Error getting employees by manager', { error, managerId });
            throw error;
        }
    }

    /**
     * Map database row to Employee interface
     */
    private mapRowToEmployee(row: any): Employee {
        return {
            id: row.id,
            organizationId: row.organization_id,
            userId: row.user_id,
            status: row.status as EmployeeStatus,
            personalInfo: row.personal_info,
            contactInfo: row.contact_info,
            employmentDetails: row.employment_details,
            education: row.education,
            workExperience: row.work_experience,
            skills: row.skills,
            documents: row.documents,
            onboarding: row.onboarding,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
} 