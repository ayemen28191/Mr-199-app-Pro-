import { useEffect, useRef } from 'react';

interface FormErrorHandlerProps {
  errors: Record<string, string>;
  onFirstError?: (fieldName: string) => void;
}

export const FormErrorHandler = ({ errors, onFirstError }: FormErrorHandlerProps) => {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const errorFields = Object.keys(errors);
    
    if (errorFields.length > 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      
      // لمسة دعابية في الكونسول
      console.log('أووه، يبدو أنك نسيت تعبئة بعض الحقول! 😅');
      
      // التركيز على أول حقل فيه خطأ
      const firstErrorField = errorFields[0];
      const element = document.getElementById(firstErrorField);
      
      if (element) {
        element.focus();
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
      
      onFirstError?.(firstErrorField);
    }
    
    // إعادة تعيين المرجع عند مسح الأخطاء
    if (errorFields.length === 0) {
      hasTriggeredRef.current = false;
    }
  }, [errors, onFirstError]);

  return null;
};

interface FormFieldProps {
  id: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({ id, error, children, className = '' }: FormFieldProps) => {
  return (
    <div className={`form-group ${error ? 'error' : ''} ${className}`} id={`group-${id}`}>
      {children}
      <div className="error-message" id={`error-${id}`}>
        {error}
      </div>
    </div>
  );
};

// Hook لإدارة أخطاء النموذج
export const useFormErrors = () => {
  const clearErrors = (errorObj: Record<string, string>) => {
    return Object.keys(errorObj).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {} as Record<string, string>);
  };

  const validateField = (value: string, rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => boolean;
  }, fieldName: string) => {
    if (rules.required && !value.trim()) {
      return `${fieldName} مطلوب`;
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} يجب أن يكون ${rules.minLength} حروف على الأقل`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} يجب أن يكون ${rules.maxLength} حرف كحد أقصى`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} غير صالح`;
    }
    
    if (rules.custom && !rules.custom(value)) {
      return `${fieldName} غير صالح`;
    }
    
    return '';
  };

  return { clearErrors, validateField };
};