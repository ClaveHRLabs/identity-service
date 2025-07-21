import { z } from 'zod';
import {
    EmployeeStatus,
    Department,
    ContractType,
    EmploymentLevel,
    DocumentType,
    DocumentStatus,
    OnboardingStage
} from '../../models/interfaces/employee';

// Schema for creating a new employee
const createEmployeeBodySchema = z.object({
    userId: z.string().uuid().optional(),
    status: z.enum(['active', 'onboarding', 'offboarding', 'terminated', 'on_leave'] as const).default('active'),
    personalInfo: z.object({
        firstName: z.string().min(1, 'First name is required'),
        middleName: z.string().optional(),
        lastName: z.string().min(1, 'Last name is required'),
        preferredName: z.string().optional(),
        pronouns: z.string().optional(),
        photo: z.string().optional()
    }),
    contactInfo: z.object({
        email: z.string().email('Invalid email format'),
        personalEmail: z.string().email('Invalid email format').optional(),
        phone: z.string().min(5, 'Phone number is required'),
        alternatePhone: z.string().optional(),
        address: z.object({
            street: z.string(),
            city: z.string(),
            state: z.string(),
            zipCode: z.string(),
            country: z.string()
        }),
        emergencyContact: z.object({
            name: z.string(),
            relationship: z.string(),
            phone: z.string(),
            email: z.string().email('Invalid email format').optional()
        }).optional()
    }),
    employmentDetails: z.object({
        employeeId: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        department: z.enum([
            'engineering', 'product', 'marketing', 'sales', 
            'customer_support', 'hr', 'finance', 'operations', 'leadership'
        ] as const),
        position: z.string(),
        level: z.enum([
            'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'
        ] as const),
        contractType: z.enum([
            'full_time', 'part_time', 'contractor', 'intern', 'consultant'
        ] as const),
        manager: z.string().optional(),
        directReports: z.array(z.string()).optional(),
        workLocation: z.enum(['remote', 'office', 'hybrid'] as const),
        office: z.string().optional(),
        salary: z.number().optional(),
        salaryFrequency: z.enum(['hourly', 'monthly', 'annually'] as const).optional(),
        status: z.enum(['active', 'onboarding', 'offboarding', 'terminated', 'on_leave'] as const)
    }),
    education: z.array(
        z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            gpa: z.number().optional(),
            achievements: z.array(z.string()).optional()
        })
    ).optional().default([]),
    workExperience: z.array(
        z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            description: z.string().optional(),
            achievements: z.array(z.string()).optional()
        })
    ).optional().default([]),
    skills: z.array(
        z.object({
            name: z.string(),
            category: z.string(),
            proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert'] as const),
            yearsOfExperience: z.number().optional()
        })
    ).optional().default([]),
    documents: z.array(
        z.object({
            id: z.string(),
            type: z.enum([
                'identification', 'work_authorization', 'tax_forms',
                'employment_contract', 'confidentiality_agreement', 
                'educational_certificates', 'reference_letters',
                'background_check', 'medical_information'
            ] as const),
            name: z.string(),
            status: z.enum([
                'not_started', 'pending', 'uploaded', 
                'verified', 'rejected', 'expired'
            ] as const),
            uploadDate: z.string().optional(),
            expirationDate: z.string().optional(),
            verificationDate: z.string().optional(),
            notes: z.string().optional(),
            url: z.string().optional()
        })
    ).optional().default([]),
    onboarding: z.object({
        stage: z.enum([
            'pre_onboarding', 'paperwork', 'orientation',
            'team_introduction', 'training', 'first_assignment',
            'first_review', 'completed'
        ] as const),
        progress: z.number().min(0).max(100),
        startDate: z.string(),
        targetCompletionDate: z.string(),
        actualCompletionDate: z.string().optional(),
        buddy: z.string().optional(),
        tasks: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
                dueDate: z.string().optional(),
                completionDate: z.string().optional(),
                status: z.enum(['not_started', 'in_progress', 'completed', 'overdue'] as const),
                assignee: z.string().optional(),
                category: z.enum(['paperwork', 'training', 'introductions', 'setup', 'other'] as const),
                required: z.boolean()
            })
        ).optional().default([]),
        notes: z.string().optional()
    }).optional().default({
        stage: 'pre_onboarding',
        progress: 0,
        startDate: new Date().toISOString(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tasks: []
    })
});

// Schema for updating an employee
const updateEmployeeBodySchema = z.object({
    status: z.enum(['active', 'onboarding', 'offboarding', 'terminated', 'on_leave'] as const).optional(),
    personalInfo: z.object({
        firstName: z.string().min(1, 'First name is required').optional(),
        middleName: z.string().optional(),
        lastName: z.string().min(1, 'Last name is required').optional(),
        preferredName: z.string().optional(),
        pronouns: z.string().optional(),
        photo: z.string().optional()
    }).optional(),
    contactInfo: z.object({
        email: z.string().email('Invalid email format').optional(),
        personalEmail: z.string().email('Invalid email format').optional(),
        phone: z.string().min(5, 'Phone number is required').optional(),
        alternatePhone: z.string().optional(),
        address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional()
        }).optional(),
        emergencyContact: z.object({
            name: z.string().optional(),
            relationship: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().email('Invalid email format').optional()
        }).optional()
    }).optional(),
    employmentDetails: z.object({
        employeeId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        department: z.enum([
            'engineering', 'product', 'marketing', 'sales', 
            'customer_support', 'hr', 'finance', 'operations', 'leadership'
        ] as const).optional(),
        position: z.string().optional(),
        level: z.enum([
            'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'
        ] as const).optional(),
        contractType: z.enum([
            'full_time', 'part_time', 'contractor', 'intern', 'consultant'
        ] as const).optional(),
        manager: z.string().optional(),
        directReports: z.array(z.string()).optional(),
        workLocation: z.enum(['remote', 'office', 'hybrid'] as const).optional(),
        office: z.string().optional(),
        salary: z.number().optional(),
        salaryFrequency: z.enum(['hourly', 'monthly', 'annually'] as const).optional(),
        status: z.enum(['active', 'onboarding', 'offboarding', 'terminated', 'on_leave'] as const).optional()
    }).optional(),
    education: z.array(
        z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            gpa: z.number().optional(),
            achievements: z.array(z.string()).optional()
        })
    ).optional(),
    workExperience: z.array(
        z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            description: z.string().optional(),
            achievements: z.array(z.string()).optional()
        })
    ).optional(),
    skills: z.array(
        z.object({
            name: z.string(),
            category: z.string(),
            proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert'] as const),
            yearsOfExperience: z.number().optional()
        })
    ).optional(),
    documents: z.array(
        z.object({
            id: z.string(),
            type: z.enum([
                'identification', 'work_authorization', 'tax_forms',
                'employment_contract', 'confidentiality_agreement', 
                'educational_certificates', 'reference_letters',
                'background_check', 'medical_information'
            ] as const),
            name: z.string(),
            status: z.enum([
                'not_started', 'pending', 'uploaded', 
                'verified', 'rejected', 'expired'
            ] as const),
            uploadDate: z.string().optional(),
            expirationDate: z.string().optional(),
            verificationDate: z.string().optional(),
            notes: z.string().optional(),
            url: z.string().optional()
        })
    ).optional(),
    onboarding: z.object({
        stage: z.enum([
            'pre_onboarding', 'paperwork', 'orientation',
            'team_introduction', 'training', 'first_assignment',
            'first_review', 'completed'
        ] as const).optional(),
        progress: z.number().min(0).max(100).optional(),
        startDate: z.string().optional(),
        targetCompletionDate: z.string().optional(),
        actualCompletionDate: z.string().optional(),
        buddy: z.string().optional(),
        tasks: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
                dueDate: z.string().optional(),
                completionDate: z.string().optional(),
                status: z.enum(['not_started', 'in_progress', 'completed', 'overdue'] as const),
                assignee: z.string().optional(),
                category: z.enum(['paperwork', 'training', 'introductions', 'setup', 'other'] as const),
                required: z.boolean()
            })
        ).optional(),
        notes: z.string().optional()
    }).optional()
});

// Schema for updating onboarding status
const onboardingUpdateBodySchema = z.object({
    stage: z.enum([
        'pre_onboarding', 'paperwork', 'orientation',
        'team_introduction', 'training', 'first_assignment',
        'first_review', 'completed'
    ] as const).optional(),
    progress: z.number().min(0).max(100).optional(),
    task: z.object({
        id: z.string(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'overdue'] as const)
    }).optional()
});

export const createEmployeeSchema = z.object({ body: createEmployeeBodySchema });
export const updateEmployeeSchema = z.object({ body: updateEmployeeBodySchema });
export const onboardingUpdateSchema = z.object({ body: onboardingUpdateBodySchema });

export class EmployeeValidator {
    createEmployeeSchema = createEmployeeSchema;
    updateEmployeeSchema = updateEmployeeSchema;
    onboardingUpdateSchema = onboardingUpdateSchema;
} 