import bcrypt from "bcrypt";

export const SecurityConfig = {
  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12,
    
    // Check password strength
    isStrong(password: string): boolean {
      if (password.length < this.minLength) return false;
      if (this.requireUppercase && !/[A-Z]/.test(password)) return false;
      if (this.requireLowercase && !/[a-z]/.test(password)) return false;
      if (this.requireNumbers && !/\d/.test(password)) return false;
      if (this.requireSpecialChars && !/[@$!%*?&]/.test(password)) return false;
      return true;
    },
    
    // Hash password with enhanced security
    async hash(password: string): Promise<string> {
      return bcrypt.hash(password, this.saltRounds);
    },
    
    // Verify password
    async verify(password: string, hash: string): Promise<boolean> {
      return bcrypt.compare(password, hash);
    }
  },
  
  // Session management
  session: {
    tokenLifetime: 24 * 60 * 60 * 1000, // 24 hours
    renewalThreshold: 2 * 60 * 60 * 1000, // Renew if less than 2 hours left
    
    // Generate secure session token
    generateToken(userId: number, userType: string): string {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      return `session_${userId}_${userType}_${timestamp}_${random}`;
    },
    
    // Validate session token
    isValid(token: string): boolean {
      const parts = token.split('_');
      if (parts.length < 4 || parts[0] !== 'session') return false;
      
      const timestamp = parseInt(parts[3]);
      const age = Date.now() - timestamp;
      return age < this.tokenLifetime;
    },
    
    // Check if session needs renewal
    needsRenewal(token: string): boolean {
      const parts = token.split('_');
      if (parts.length < 4) return true;
      
      const timestamp = parseInt(parts[3]);
      const age = Date.now() - timestamp;
      const remaining = this.tokenLifetime - age;
      return remaining < this.renewalThreshold;
    }
  },
  
  // Input sanitization
  sanitize: {
    // Remove potentially dangerous characters
    cleanInput(input: string): string {
      return input
        .trim()
        .replace(/[<>\"']/g, '') // Remove basic XSS chars
        .substring(0, 1000); // Limit length
    },
    
    // Validate email format
    isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) && email.length <= 255;
    },
    
    // Validate phone number
    isValidPhone(phone: string): boolean {
      const phoneRegex = /^[\d\s\+\-\(\)]{8,20}$/;
      return phoneRegex.test(phone);
    }
  },
  
  // Rate limiting configurations
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // 5 attempts per window
    },
    email: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3 // 3 emails per hour
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per window
    }
  }
};