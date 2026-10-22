// Core Authentication Models and Session Interfaces

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  cnic?: string;
  bankDetails?: any;
  roleName: string;
  permissions: string[];
  isOwner: boolean;
  isSuperAdmin?: boolean;
  status: string;
  isEmailVerified?: boolean;
  branchId?: string;
  branchName?: string;
  branchTimezone?: string;
  branchCurrency?: string;
}

export interface CompanyProfile {
  companyId: string;
  name: string;
  region: 'PK' | 'IND' | 'USA' | 'EU' | 'UAE';
  timezone: string;
  currency: string;
  companyTimezone?: string;
  companyCurrency?: string;
  logoUrl?: string;
  subscription: {
    plan: string;
    status: string;
    trialEndsAt?: string | Date;
  };
  onboardingConfig?: {
    requireCnic: boolean;
    requireAddress: boolean;
    requireBankDetails: boolean;
  };
  payrollConfig?: {
    lateFineType: string;
    lateFineValue: number;
    overtimeMultiplier: number;
    salaryPayDay: number;
    autoSalarySlipEnabled: boolean;
  };
  topPerformerEnabled?: boolean;
  topPerformerEvalDay?: number;
  socialMedia?: {
    linkedin?: { username?: string; password?: string; apiKey?: string; connected?: boolean };
    twitter?: { username?: string; password?: string; apiKey?: string; connected?: boolean };
    facebook?: { pageName?: string; pageId?: string; accessToken?: string; connected?: boolean };
    instagram?: { username?: string; password?: string; accessToken?: string; connected?: boolean };
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: UserProfile;
  company: CompanyProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
  regionHint?: string;
}

export interface RegisterPayload {
  type: 'company' | 'employee';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // Company specific
  companyName?: string;
  companyPhone?: string;
  registrationNumber?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  logoUrl?: string;
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  region?: 'PK' | 'IND' | 'USA' | 'EU' | 'UAE';
  timezone?: string;
  currency?: string;
  // Employee specific
  invitationToken?: string;
  companyRegion?: string;
  userLocationRegion?: string;
  customFields?: Record<string, any>;
  documents?: Array<{ name: string; url: string; fieldKey?: string; uploadedAt?: Date }>;
  dateOfBirth?: string;
  cnic?: string;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
  };
}
