import { useState, useEffect } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';

interface PasswordRequirement {
  test: (password: string) => boolean;
  label: string;
}

interface ValidationCheckersProps {
  email: string;
  phone: string;
  password: string;
  mode?: 'registration' | 'forgot-password'; // Add mode prop
  onValidationChange?: (validation: {
    email: boolean;
    phone: boolean;
    password: boolean;
  }) => void;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    test: (password: string) => password.length >= 8,
    label: 'Au moins 8 caractères'
  },
  {
    test: (password: string) => /[a-z]/.test(password),
    label: 'Au moins une minuscule (a-z)'
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    label: 'Au moins une majuscule (A-Z)'
  },
  {
    test: (password: string) => /\d/.test(password),
    label: 'Au moins un chiffre (0-9)'
  },
  {
    test: (password: string) => /[@$!%*?&]/.test(password),
    label: 'Au moins un caractère spécial (@$!%*?&)'
  }
];

export const ValidationCheckers = ({ 
  email, 
  phone, 
  password, 
  mode = 'registration',
  onValidationChange 
}: ValidationCheckersProps) => {
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | ''>('');
  const [phoneStatus, setPhoneStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | ''>('');
  const [showPassword, setShowPassword] = useState(false);

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Email validation
  useEffect(() => {
    const checkEmail = debounce(async (email: string) => {
      if (!email) {
        setEmailStatus('');
        return;
      }
      
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailStatus('invalid');
        return;
      }

      setEmailStatus('checking');
      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setEmailStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Email check error:', error);
        setEmailStatus('');
      }
    }, 500);

    checkEmail(email);
  }, [email]);

  // Phone validation
  useEffect(() => {
    const checkPhone = debounce(async (phone: string) => {
      if (!phone) {
        setPhoneStatus('');
        return;
      }
      
      // Basic phone format check (international format or local)
      const phoneRegex = /^(\+\d{1,4})?[\s\-]?\d{8,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setPhoneStatus('invalid');
        return;
      }

      setPhoneStatus('checking');
      try {
        const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();
        setPhoneStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Phone check error:', error);
        setPhoneStatus('');
      }
    }, 500);

    checkPhone(phone);
  }, [phone]);

  // Password validation
  const passwordChecks = passwordRequirements.map(req => ({
    ...req,
    passed: req.test(password)
  }));

  const allPasswordRequirementsMet = passwordChecks.every(check => check.passed);

  // Notify parent of validation status
  useEffect(() => {
    if (onValidationChange) {
      // For forgot-password mode, we want email to be 'taken' (exists)
      // For registration mode, we want email to be 'available' (doesn't exist)
      const emailValid = mode === 'forgot-password' 
        ? emailStatus === 'taken' 
        : emailStatus === 'available';
      
      const phoneValid = mode === 'forgot-password'
        ? phoneStatus === 'taken'
        : phoneStatus === 'available';
      
      onValidationChange({
        email: emailValid,
        phone: phoneValid, 
        password: allPasswordRequirementsMet && password.length > 0
      });
    }
  }, [emailStatus, phoneStatus, allPasswordRequirementsMet, password, mode, onValidationChange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'available':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'taken':
        return <X className="w-4 h-4 text-red-500" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = (type: 'email' | 'phone', status: string) => {
    if (mode === 'forgot-password') {
      const forgotPasswordMessages = {
        email: {
          checking: 'Recherche en cours...',
          available: '❌ Compte non trouvé',
          taken: '✅ Compte trouvé - un email sera envoyé',
          invalid: 'Format email invalide'
        },
        phone: {
          checking: 'Recherche en cours...',
          available: '❌ Compte non trouvé',
          taken: '✅ Compte trouvé - un email sera envoyé',
          invalid: 'Format de numéro invalide'
        }
      };
      return forgotPasswordMessages[type][status as keyof typeof forgotPasswordMessages[typeof type]] || '';
    }
    
    // Default registration mode messages
    const messages = {
      email: {
        checking: 'Vérification...',
        available: 'Email disponible ✓',
        taken: 'Cet email est déjà utilisé',
        invalid: 'Format email invalide'
      },
      phone: {
        checking: 'Vérification...',
        available: 'Numéro disponible ✓',
        taken: 'Ce numéro est déjà utilisé',
        invalid: 'Format de numéro invalide'
      }
    };
    return messages[type][status as keyof typeof messages[typeof type]] || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checking':
        return 'text-blue-600';
      case 'available':
        return mode === 'forgot-password' ? 'text-red-600' : 'text-green-600';
      case 'taken':
        return mode === 'forgot-password' ? 'text-green-600' : 'text-red-600';
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Email Status */}
      {email && emailStatus && (
        <div className={`flex items-center space-x-2 text-sm ${getStatusColor(emailStatus)}`}>
          {getStatusIcon(emailStatus)}
          <span>{getStatusMessage('email', emailStatus)}</span>
        </div>
      )}

      {/* Phone Status */}
      {phone && phoneStatus && (
        <div className={`flex items-center space-x-2 text-sm ${getStatusColor(phoneStatus)}`}>
          {getStatusIcon(phoneStatus)}
          <span>{getStatusMessage('phone', phoneStatus)}</span>
        </div>
      )}

      {/* Password Requirements */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exigences du mot de passe:</span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
            </button>
          </div>
          
          {showPassword && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-mono border p-2 rounded bg-white">
                {password || '(vide)'}
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            {passwordChecks.map((check, index) => (
              <div key={index} className={`flex items-center space-x-2 text-sm ${
                check.passed ? 'text-green-600' : 'text-gray-500'
              }`}>
                {check.passed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span>{check.label}</span>
              </div>
            ))}
          </div>
          
          {allPasswordRequirementsMet && (
            <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
              <Check className="w-4 h-4" />
              <span>Mot de passe valide ✓</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationCheckers;