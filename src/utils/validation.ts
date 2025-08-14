// Security validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (email.length > 254) {
      errors.push('Email address is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', '123456789', 'password1'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || !name.trim()) {
    errors.push('Full name is required');
  } else {
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }
    
    if (trimmedName.length > 100) {
      errors.push('Full name is too long (max 100 characters)');
    }
    
    // Allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
    }
    
    // Prevent excessive special characters
    if ((trimmedName.match(/[-']/g) || []).length > 3) {
      errors.push('Full name contains too many special characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};