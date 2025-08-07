import React, { useState, useCallback, useMemo } from "react";
import { z } from "zod";

// نموذج التحقق من بيانات تقرير تصفية العمال
export const workersSettlementSchema = z.object({
  projectIds: z
    .array(z.string().uuid("معرف المشروع غير صالح"))
    .min(1, "يجب اختيار مشروع واحد على الأقل")
    .max(10, "لا يمكن اختيار أكثر من 10 مشاريع في نفس الوقت"),
    
  dateFrom: z
    .string()
    .optional()
    .refine((date) => !date || isValidDate(date), "تاريخ البداية غير صالح"),
    
  dateTo: z
    .string()
    .optional()
    .refine((date) => !date || isValidDate(date), "تاريخ النهاية غير صالح"),
    
  workerIds: z
    .array(z.string().uuid("معرف العامل غير صالح"))
    .optional()
    .default([])
    .refine((workers) => !workers || workers.length <= 50, "لا يمكن اختيار أكثر من 50 عامل في نفس الوقت")
});

// التحقق من صحة التواريخ مع قوانين إضافية
export const dateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
}).refine((data) => {
  if (!data.dateFrom || !data.dateTo) return true;
  
  const fromDate = new Date(data.dateFrom);
  const toDate = new Date(data.dateTo);
  const today = new Date();
  
  // التحقق من أن تاريخ البداية ليس أكبر من تاريخ النهاية
  if (fromDate > toDate) return false;
  
  // التحقق من أن التواريخ ليست في المستقبل
  if (fromDate > today || toDate > today) return false;
  
  // التحقق من أن الفترة لا تزيد عن سنتين
  const maxPeriod = 2 * 365 * 24 * 60 * 60 * 1000; // سنتان بالميلي ثانية
  if (toDate.getTime() - fromDate.getTime() > maxPeriod) return false;
  
  return true;
}, {
  message: "فترة التاريخ غير صالحة - تحقق من أن تاريخ البداية أقل من النهاية، والتواريخ ليست في المستقبل، والفترة لا تزيد عن سنتين"
});

export type WorkersSettlementFormData = z.infer<typeof workersSettlementSchema>;

export type ValidationError = {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  suggestion?: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
};

// Hook للتحقق من بيانات تقرير تصفية العمال
export function useWorkersSettlementValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    infos: []
  });

  const validateForm = useCallback((data: Partial<WorkersSettlementFormData>): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    try {
      // التحقق الأساسي من النموذج
      workersSettlementSchema.parse(data);
      
      // تحققات إضافية مخصصة
      if (data.projectIds && data.projectIds.length > 5) {
        warnings.push({
          field: 'projectIds',
          message: 'اختيار أكثر من 5 مشاريع قد يجعل التقرير بطيء',
          type: 'warning',
          suggestion: 'فكر في تقسيم التقرير إلى مجموعات أصغر'
        });
      }

      if (data.workerIds && data.workerIds.length > 20) {
        warnings.push({
          field: 'workerIds',
          message: 'اختيار أكثر من 20 عامل قد يجعل التقرير معقد',
          type: 'warning',
          suggestion: 'يمكنك ترك الحقل فارغ لعرض جميع العمال النشطين'
        });
      }

      // التحقق من فترة التواريخ
      if (data.dateFrom && data.dateTo) {
        try {
          dateRangeSchema.parse({ dateFrom: data.dateFrom, dateTo: data.dateTo });
          
          const fromDate = new Date(data.dateFrom);
          const toDate = new Date(data.dateTo);
          const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 365) {
            warnings.push({
              field: 'dateRange',
              message: `الفترة المحددة طويلة (${daysDiff} يوم)`,
              type: 'warning',
              suggestion: 'التقارير الطويلة قد تستغرق وقت أطول في الإنشاء'
            });
          } else if (daysDiff > 30) {
            infos.push({
              field: 'dateRange',
              message: `سيتم إنشاء تقرير لفترة ${daysDiff} يوم`,
              type: 'info'
            });
          }
        } catch (dateError) {
          if (dateError instanceof z.ZodError) {
            errors.push({
              field: 'dateRange',
              message: dateError.errors[0]?.message || 'خطأ في فترة التواريخ',
              type: 'error',
              suggestion: 'تأكد من صحة التواريخ وأن تاريخ البداية أقل من النهاية'
            });
          }
        }
      }

      // معلومات إضافية مفيدة
      if (!data.dateFrom && !data.dateTo) {
        infos.push({
          field: 'dateRange',
          message: 'سيتم إنشاء التقرير لجميع الفترات المتاحة',
          type: 'info',
          suggestion: 'يمكنك تحديد فترة معينة لتقرير أكثر تركيز'
        });
      }

      if (!data.workerIds || data.workerIds.length === 0) {
        infos.push({
          field: 'workerIds',
          message: 'سيتم تضمين جميع العمال النشطين في المشاريع المحددة',
          type: 'info'
        });
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            type: 'error',
            suggestion: getSuggestionForError(err.path.join('.'), err.code)
          });
        });
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };

    setValidationResult(result);
    return result;
  }, []);

  const validateField = useCallback((fieldName: string, value: any): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    switch (fieldName) {
      case 'projectIds':
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors.push({
            field: fieldName,
            message: 'يجب اختيار مشروع واحد على الأقل',
            type: 'error',
            suggestion: 'اختر مشروع من القائمة أو استخدم المشروع المحدد حالياً'
          });
        }
        break;
        
      case 'dateFrom':
        if (value && !isValidDate(value)) {
          errors.push({
            field: fieldName,
            message: 'تاريخ البداية غير صالح',
            type: 'error',
            suggestion: 'استخدم تنسيق التاريخ الصحيح (YYYY-MM-DD)'
          });
        }
        break;
        
      case 'dateTo':
        if (value && !isValidDate(value)) {
          errors.push({
            field: fieldName,
            message: 'تاريخ النهاية غير صالح',
            type: 'error',
            suggestion: 'استخدم تنسيق التاريخ الصحيح (YYYY-MM-DD)'
          });
        }
        break;
    }
    
    return errors;
  }, []);

  const getFieldValidationState = useCallback((fieldName: string) => {
    const fieldErrors = validationResult.errors.filter(e => e.field === fieldName);
    const fieldWarnings = validationResult.warnings.filter(w => w.field === fieldName);
    
    if (fieldErrors.length > 0) return 'error';
    if (fieldWarnings.length > 0) return 'warning';
    return 'valid';
  }, [validationResult]);

  return {
    validationResult,
    validateForm,
    validateField,
    getFieldValidationState,
    isValid: validationResult.isValid
  };
}

// دوال مساعدة
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/));
}

function getSuggestionForError(field: string, errorCode: string): string {
  switch (field) {
    case 'projectIds':
      return 'اختر مشروع واحد على الأقل من القائمة';
    case 'dateFrom':
    case 'dateTo':
      return 'استخدم تنسيق التاريخ الصحيح (سنة-شهر-يوم)';
    case 'workerIds':
      return 'تأكد من اختيار عمال صالحين من القائمة';
    default:
      return 'تحقق من صحة البيانات المدخلة';
  }
}

// Hook للتحقق الفوري (Real-time validation)
export function useRealtimeValidation<T>(
  value: T,
  validator: (value: T) => ValidationError[]
) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const validate = useCallback((newValue: T) => {
    const newErrors = validator(newValue);
    setErrors(newErrors);
    return newErrors;
  }, [validator]);

  React.useEffect(() => {
    validate(value);
  }, [value, validate]);

  return {
    errors,
    isValid: errors.length === 0,
    validate
  };
}