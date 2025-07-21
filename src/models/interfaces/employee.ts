// Employee status in the company
export type EmployeeStatus =
    | "active"
    | "onboarding"
    | "offboarding"
    | "terminated"
    | "on_leave";

// Department in the company
export type Department =
    | "engineering"
    | "product"
    | "marketing"
    | "sales"
    | "customer_support"
    | "hr"
    | "finance"
    | "operations"
    | "leadership";

// Employee contract type
export type ContractType =
    | "full_time"
    | "part_time"
    | "contractor"
    | "intern"
    | "consultant";

// Employment level in the organization
export type EmploymentLevel =
    | "entry"
    | "mid"
    | "senior"
    | "lead"
    | "manager"
    | "director"
    | "executive";

// Document types that employees need to submit
export type DocumentType =
    | "identification"
    | "work_authorization"
    | "tax_forms"
    | "employment_contract"
    | "confidentiality_agreement"
    | "educational_certificates"
    | "reference_letters"
    | "background_check"
    | "medical_information";

// Document status
export type DocumentStatus =
    | "not_started"
    | "pending"
    | "uploaded"
    | "verified"
    | "rejected"
    | "expired";

// Onboarding stage
export type OnboardingStage =
    | "pre_onboarding"
    | "paperwork"
    | "orientation"
    | "team_introduction"
    | "training"
    | "first_assignment"
    | "first_review"
    | "completed";

// Demographic information (for diversity reporting and compliance)
export interface Demographics {
    gender?: string;
    ethnicity?: string;
    dateOfBirth?: string;
    maritalStatus?: string;
    disabilities?: string[];
    veteranStatus?: boolean;
}

// Contact information
export interface ContactInfo {
    email: string;
    personalEmail?: string;
    phone: string;
    alternatePhone?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
        email?: string;
    };
}

// Employment details
export interface EmploymentDetails {
    employeeId: string;
    startDate: string;
    endDate?: string;
    department: Department;
    position: string;
    level: EmploymentLevel;
    contractType: ContractType;
    manager?: string; // managerId
    directReports?: string[]; // employee IDs
    workLocation: "remote" | "office" | "hybrid";
    office?: string;
    salary?: number;
    salaryFrequency?: "hourly" | "monthly" | "annually";
    status: EmployeeStatus;
}

// Education background
export interface Education {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    gpa?: number;
    achievements?: string[];
}

// Work experience
export interface WorkExperience {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
}

// Skills
export interface Skill {
    name: string;
    category: string;
    proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience?: number;
}

// Document
export interface Document {
    id: string;
    type: DocumentType;
    name: string;
    status: DocumentStatus;
    uploadDate?: string;
    expirationDate?: string;
    verificationDate?: string;
    notes?: string;
    url?: string; // In a real app, this would be a secure URL
}

// Onboarding checklist item
export interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
    completionDate?: string;
    status: "not_started" | "in_progress" | "completed" | "overdue";
    assignee?: string; // ID of person responsible
    category: "paperwork" | "training" | "introductions" | "setup" | "other";
    required: boolean;
}

// Onboarding data
export interface Onboarding {
    stage: OnboardingStage;
    progress: number; // 0-100
    startDate: string;
    targetCompletionDate: string;
    actualCompletionDate?: string;
    buddy?: string; // employeeId of onboarding buddy
    tasks: OnboardingTask[];
    notes?: string;
}

// Personal information
export interface PersonalInfo {
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    pronouns?: string;
    photo?: string;
}

// Complete employee profile
export interface Employee {
    id: string;
    organizationId: string;
    userId?: string;
    status: EmployeeStatus;
    personalInfo: PersonalInfo;
    contactInfo: ContactInfo;
    demographics?: Demographics;
    employmentDetails: EmploymentDetails;
    education: Education[];
    workExperience: WorkExperience[];
    skills: Skill[];
    documents: Document[];
    onboarding: Onboarding;
    createdAt: Date;
    updatedAt: Date;
} 