/**
 * مكون تصدير تقرير المصروفات اليومية لفترة زمنية
 * كل يوم في ورقة منفصلة في ملف Excel واحد
 * المالك: عمار
 * التاريخ: 2025-08-16
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSelectedProject } from '@/hooks/use-selected-project';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Camera
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import type { Project } from '@shared/schema';

interface DailyExpenseData {
  date: string;
  projectName: string;
  projectId: string;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  carriedForward: number;
  transferFromProject?: string;
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
  miscExpenses: any[];
  supplierPayments?: any[];
  incomingProjectTransfers?: any[]; // الأموال المرحلة من مشاريع أخرى
  outgoingProjectTransfers?: any[]; // الأموال المرحلة إلى مشاريع أخرى
}

export default function DailyExpensesBulkExport() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // جلب بيانات المشاريع
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // دالة تنسيق العملة (أرقام إنجليزية)
  const formatCurrency = (amount: number) => {
    return `${Number(amount).toLocaleString('en-US', { useGrouping: true })} ريال`;
  };

  // دالة تنسيق الأرقام (إنجليزية) - بدون كلمة "ريال"
  const formatNumber = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US', { useGrouping: true });
  };

  // دالة تنسيق التاريخ (بالإنجليزية)
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // دالة جلب بيانات المصروفات اليومية لفترة
  const fetchDailyExpensesForPeriod = async (projectId: string, fromDate: string, toDate: string) => {
    const expenses: DailyExpenseData[] = [];
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    console.log(`📅 جلب المصروفات اليومية من ${fromDate} إلى ${toDate} للمشروع ${projectId}`);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/reports/daily-expenses/${projectId}/${dateStr}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            expenses.push({
              ...data,
              date: dateStr,
              projectName: selectedProject?.name || 'مشروع غير محدد'
            });
          }
        }
        
        // تحديث progress
        const current = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const total = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setExportProgress({ current, total });
        
      } catch (error) {
        console.error(`خطأ في جلب بيانات ${dateStr}:`, error);
      }
    }
    
    return expenses;
  };

  // دالة الحصول على اسم اليوم بالعربي
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return dayNames[date.getDay()];
  };

  // دالة إنشاء ورقة Excel ليوم واحد (مطابقة للصور المرجعية 100%)
  const createDayWorksheet = (workbook: ExcelJS.Workbook, dayData: DailyExpenseData) => {
    const worksheetName = `${formatDate(dayData.date)}`.replace(/\//g, '-');
    const worksheet = workbook.addWorksheet(worksheetName);
    
    // إعداد اتجاه النص من اليمين لليسار
    worksheet.views = [{ rightToLeft: true }];

    // رأس التقرير مطابق للصور المرجعية
    worksheet.mergeCells('A1:E1');
    const headerCell = worksheet.getCell('A1');
    const dayName = getDayName(dayData.date);
    const formattedDate = formatDate(dayData.date);
    headerCell.value = `كشف مصروفات ${dayData.projectName} يوم ${dayName} تاريخ ${formattedDate}`;
    headerCell.font = { name: 'Arial Unicode MS', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } }; // أزرق مطابق للمرجع
    headerCell.border = {
      top: { style: 'medium' }, bottom: { style: 'medium' },
      left: { style: 'medium' }, right: { style: 'medium' }
    };
    worksheet.getRow(1).height = 30;

    // رؤوس الجدول الرئيسي مطابقة للصور المرجعية (5 أعمدة فقط)
    const headers = ['المبلغ', 'نوع الحساب', 'نوع', 'الإجمالي المبلغ المتبقي', 'ملاحظات'];
    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell, index) => {
      cell.font = { name: 'Arial Unicode MS', size: 11, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // أخضر مطابق للمرجع
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    worksheet.getRow(2).height = 25;

    // حساب الرصيد الجاري - البداية بصفر أو بالرصيد المرحل
    let currentBalance = 0;
    
    // صف المبلغ المرحل من سابق (إذا كان هناك رصيد مرحل)
    if (dayData.carriedForward && dayData.carriedForward !== 0) {
      currentBalance = dayData.carriedForward; // إضافة الرصيد المرحل
      
      const yesterdayDate = new Date(dayData.date);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const formattedYesterday = formatDate(yesterdayDate.toISOString().split('T')[0]);
      
      const carryForwardRow = worksheet.addRow([
        formatNumber(Math.abs(dayData.carriedForward)),
        'مرحلة',
        'ترحيل',
        formatNumber(currentBalance),
        `مرحلة من تاريخ ${formattedYesterday}`
      ]);
      
      carryForwardRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8E6B8' } }; // أخضر فاتح للمرحلة
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    }

    // الحوالات المرحلة من مشاريع أخرى (الأموال الواردة من مشاريع أخرى)
    if (dayData.incomingProjectTransfers && dayData.incomingProjectTransfers.length > 0) {
      dayData.incomingProjectTransfers.forEach((transfer: any) => {
        if (transfer.amount > 0) {
          currentBalance += transfer.amount; // إضافة المبلغ المرحل للرصيد
          
          const transferRow = worksheet.addRow([
            formatNumber(transfer.amount),
            'مرحل من مشروع آخر',
            'ترحيل',
            formatNumber(currentBalance),
            `مرحل من مشروع: ${transfer.fromProjectName || 'مشروع غير محدد'} - ${transfer.transferNotes || transfer.description || ''}`
          ]);
          
          transferRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC99' } }; // لون مميز للمبالغ المرحلة من مشاريع أخرى
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // الحوالات المالية العادية - حوالات من نفس المشروع
    if (dayData.fundTransfers && dayData.fundTransfers.length > 0) {
      dayData.fundTransfers.forEach((transfer: any) => {
        if (transfer.amount > 0) {
          currentBalance += transfer.amount; // إضافة الحوالة للرصيد
          
          // تفاصيل الحوالة المحسنة
          let notes = '';
          if (transfer.senderName && transfer.transferNumber) {
            notes = `حوالة من: ${transfer.senderName}، رقم الحوالة: ${transfer.transferNumber}`;
          } else if (transfer.description || transfer.notes) {
            notes = transfer.description || transfer.notes;
          } else if (transfer.transferNumber) {
            notes = `حوالة رقم ${transfer.transferNumber}`;
          } else {
            notes = 'حوالة مالية';
          }
          
          const transferRow = worksheet.addRow([
            formatNumber(transfer.amount),
            'حوالة',
            'توريد',
            formatNumber(currentBalance),
            notes
          ]);
          
          transferRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8E6B8' } }; // أخضر فاتح للحوالات
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // مصروفات العمال مع تفاصيل أيام العمل والمعاملات
    if (dayData.workerAttendance && dayData.workerAttendance.length > 0) {
      dayData.workerAttendance.forEach((worker: any) => {
        const workerAmount = worker.paidAmount || worker.actualWage || worker.totalWage || 0;
        if (workerAmount > 0) {
          currentBalance -= workerAmount; // طرح أجرة العامل من الرصيد
          
          // تنسيق ملاحظات العامل والمعامل المحسن (مطابق للصورة)
          const multiplier = worker.multiplier || worker.overtimeMultiplier || null;
          const workDays = worker.workDays || 1;
          const startTime = worker.startTime || '4:00';
          const endTime = worker.endTime || worker.hoursWorked || worker.workHours || '7:00';
          
          // تنسيق الملاحظة مع جميع التفاصيل المطلوبة
          let notes = `العمل من الساعة ${startTime} عصر وحتى الساعة ${endTime} صباحاً`;
          if (workDays && workDays !== 1) {
            notes += ` — ${workDays} أيام`;
          }
          if (multiplier && multiplier !== 1) {
            notes += ` — معامل ${multiplier}`;
          }
          // إضافة وصف العمل إن وجد
          if (worker.workDescription) {
            notes += ` - ${worker.workDescription}`;
          }
          
          // عرض المعامل إذا وجد
          let amountDisplayWithMultiplier = formatNumber(workerAmount);
          if (multiplier && multiplier !== 1) {
            amountDisplayWithMultiplier = `${multiplier}\n${formatNumber(workerAmount)}`;
          }
          
          const workerRow = worksheet.addRow([
            amountDisplayWithMultiplier,
            `مصروف ${worker.workerName || worker.worker?.name || 'عامل'}`,
            'منصرف',
            formatNumber(currentBalance),
            notes
          ]);
          
          workerRow.eachCell((cell, index) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // إضافة المعامل في عمود المبلغ إذا وجد
            if (index === 1 && multiplier && multiplier !== 1) {
              cell.value = { richText: [
                { text: multiplier.toString(), font: { size: 8, bold: true } },
                { text: '\n' },
                { text: formatNumber(workerAmount), font: { size: 10 } }
              ]};
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            }
            
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // مصاريف النقليات والمواصلات
    if (dayData.transportationExpenses && dayData.transportationExpenses.length > 0) {
      dayData.transportationExpenses.forEach((expense: any) => {
        const amount = expense.amount || expense.totalAmount || 0;
        if (amount > 0) {
          currentBalance -= amount; // طرح مصروف النقليات من الرصيد
          
          const expenseRow = worksheet.addRow([
            formatNumber(amount),
            'نقليات', // تغيير من "نثريات" إلى "نقليات"
            'منصرف',
            formatNumber(currentBalance),
            expense.notes || expense.description || expense.destination || `${expense.expenseType || 'مواصلات'}`
          ]);
          
          expenseRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // مشتريات المواد النقدية فقط (المؤجلة لا تظهر في الجدول الرئيسي)
    if (dayData.materialPurchases && dayData.materialPurchases.length > 0) {
      dayData.materialPurchases.forEach((material: any) => {
        // إظهار المشتريات النقدية فقط في الجدول الرئيسي
        const isCashPurchase = !material.paymentType || material.paymentType === 'cash';
        const amount = material.totalAmount || material.totalCost || 0;
        
        if (amount > 0 && isCashPurchase) {
          currentBalance -= amount; // طرح مشتريات المواد النقدية من الرصيد
          
          const materialRow = worksheet.addRow([
            formatNumber(amount),
            'مهندس',
            'منصرف',
            formatNumber(currentBalance),
            `${material.materialName || material.material?.name || 'مواد'}`
          ]);
          
          materialRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // تحويلات العمال
    if (dayData.workerTransfers && dayData.workerTransfers.length > 0) {
      dayData.workerTransfers.forEach((transfer: any) => {
        const amount = transfer.amount || 0;
        if (amount > 0) {
          currentBalance -= amount; // طرح تحويلات العمال من الرصيد
          
          const transferRow = worksheet.addRow([
            formatNumber(amount),
            'تحويل عامل',
            'منصرف',
            formatNumber(currentBalance),
            `تحويل إلى ${transfer.workerName || 'عامل'} - ${transfer.notes || transfer.description || 'تحويل'}`
          ]);
          
          transferRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // مدفوعات الموردين
    if (dayData.supplierPayments && dayData.supplierPayments.length > 0) {
      dayData.supplierPayments.forEach((payment: any) => {
        const amount = payment.amount || 0;
        if (amount > 0) {
          currentBalance -= amount; // طرح مدفوعات الموردين من الرصيد
          
          const paymentRow = worksheet.addRow([
            formatNumber(amount),
            'دفع مورد',
            'منصرف',
            formatNumber(currentBalance),
            `دفع إلى ${payment.supplierName || 'مورد'} - ${payment.notes || payment.description || 'دفعة'}`
          ]);
          
          paymentRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // مصاريف أخرى ومتنوعة وحسابات أخرى
    if (dayData.miscExpenses && dayData.miscExpenses.length > 0) {
      dayData.miscExpenses.forEach((misc: any) => {
        const amount = misc.amount || misc.totalAmount || 0;
        if (amount > 0) {
          currentBalance -= amount; // طرح المصاريف المتنوعة من الرصيد
          
          // تحديد نوع المصروف
          let expenseType = misc.expenseType || 'مصروف متنوع';
          if (expenseType.includes('نثريات') && misc.description && misc.description.includes('نقليات')) {
            expenseType = 'نقليات';
          } else if (misc.category && misc.category.includes('حسابات أخرى')) {
            expenseType = 'منصرف - حسابات أخرى';
          }
          
          const miscRow = worksheet.addRow([
            formatNumber(amount),
            expenseType,
            'منصرف',
            formatNumber(currentBalance),
            misc.notes || misc.description || 'مصروف متنوع'
          ]);
          
          miscRow.eachCell((cell) => {
            cell.font = { name: 'Arial Unicode MS', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          });
        }
      });
    }

    // صف فارغ قبل المبلغ المتبقي
    const emptyRow = worksheet.addRow(['', '', '', '', '']);
    emptyRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    
    // صف عنوان المبلغ المتبقي
    const balanceTitleRow = worksheet.addRow(['', '', '', 'المبلغ المتبقي', '']);
    balanceTitleRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 11, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    
    // صف المبلغ المتبقي النهائي (خلفية برتقالية)
    const finalBalanceRow = worksheet.addRow(['', '', '', formatNumber(currentBalance), '']);
    finalBalanceRow.eachCell((cell, index) => {
      cell.font = { name: 'Arial Unicode MS', size: 12, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }; // برتقالي مطابق للمرجع
      cell.border = {
        top: { style: 'medium' }, bottom: { style: 'medium' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
      
      // تلوين الرصيد السالب بالأحمر
      if (index === 4 && currentBalance < 0) {
        cell.font = { ...cell.font, color: { argb: 'FFFF0000' } };
      }
    });
    finalBalanceRow.height = 25;

    // فراغ قبل الجدول الإضافي
    worksheet.addRow(['']);

    // جدول المشتريات (جميع المشتريات مع عمود نوع الدفع)
    if (dayData.materialPurchases && dayData.materialPurchases.length > 0) {
      // فراغ قبل الجدول الإضافي
      worksheet.addRow(['']);
      
      const purchasesHeaders = ['المشروع', 'محل التوريد', 'المبلغ', 'نوع الدفع', 'الملاحظات'];
      const purchasesHeaderRow = worksheet.addRow(purchasesHeaders);
      
      purchasesHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } }; // أزرق مطابق للمرجع
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // عرض جميع المشتريات مع نوع الدفع
      dayData.materialPurchases.forEach((purchase: any) => {
        const purchaseDescription = `شراء عدد ${purchase.quantity || 1} ${purchase.materialName || purchase.material?.name || 'مادة'} ${purchase.notes || ''}`;
        const paymentType = purchase.purchaseType || purchase.paymentType || 'نقد';
        
        const purchaseRow = worksheet.addRow([
          dayData.projectName,
          purchase.supplierName || purchase.supplier?.name || 'إبراهيم نجم الدين',
          formatNumber(purchase.totalAmount || purchase.totalCost || 0),
          paymentType,
          purchaseDescription
        ]);
        
        purchaseRow.eachCell((cell, index) => {
          cell.font = { name: 'Arial Unicode MS', size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          
          // تمييز المشتريات الآجلة بلون مختلف (في عمود نوع الدفع)
          if (index === 4 && (paymentType === 'آجل' || paymentType === 'أجل')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6CC' } }; // لون برتقالي فاتح للآجل
          }
          
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });
    }

    // تعديل عرض الأعمدة للجدول الرئيسي (5 أعمدة)
    const columnsConfig = [
      { width: 15 }, // المبلغ
      { width: 20 }, // نوع الحساب
      { width: 12 }, // نوع
      { width: 18 }, // الإجمالي المبلغ المتبقي
      { width: 40 }  // ملاحظات
    ];
    
    // تطبيق إعدادات الأعمدة على الصفوف الموجودة فقط
    for (let i = 0; i < columnsConfig.length; i++) {
      if (worksheet.getColumn(i + 1)) {
        worksheet.getColumn(i + 1).width = columnsConfig[i].width;
      }
    }

    // إعداد الطباعة
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    return worksheet;
  };

  // دالة تحميل صورة المعاينة
  const downloadComponentImage = async () => {
    try {
      console.log('📸 بدء تحميل صورة معاينة تصدير المصروفات المجمعة...');
      
      const element = document.getElementById('bulk-export-component');
      if (!element) {
        alert('❌ لم يتم العثور على محتوى المعاينة');
        return;
      }

      // التقاط الصورة
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // جودة عالية
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // تحويل إلى صورة وتحميلها
      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const projectName = selectedProject?.name?.replace(/[\\/:*?"<>|]/g, '-') || 'مشروع';
      link.download = `معاينة_تصدير_المصروفات_المجمعة_${projectName}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ تم تحميل صورة المعاينة بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الصورة:', error);
      alert('❌ حدث خطأ أثناء تحميل صورة المعاينة. يرجى المحاولة مرة أخرى.');
    }
  };

  // دالة التصدير الرئيسية
  const handleBulkExport = async () => {
    if (!selectedProjectId) {
      toast({
        title: "يرجى تحديد المشروع",
        description: "يجب تحديد مشروع لتصدير المصروفات",
        variant: "destructive"
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "يرجى تحديد الفترة الزمنية",
        description: "يجب تحديد تاريخ البداية والنهاية",
        variant: "destructive"
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "خطأ في التواريخ",
        description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: 0 });

    try {
      console.log('🚀 بدء تصدير المصروفات اليومية المجمعة...');
      
      // جلب البيانات
      const dailyExpenses = await fetchDailyExpensesForPeriod(selectedProjectId, dateFrom, dateTo);
      
      if (dailyExpenses.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد مصروفات في الفترة المحددة",
          variant: "destructive"
        });
        return;
      }

      console.log(`📊 تم جلب ${dailyExpenses.length} يوم من البيانات`);

      // إنشاء ملف Excel
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'شركة الفتيني للمقاولات والاستشارات الهندسية';
      workbook.created = new Date();

      // إنشاء ورقة لكل يوم
      dailyExpenses.forEach((dayData) => {
        createDayWorksheet(workbook, dayData);
      });

      // تصدير الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const projectName = selectedProject?.name?.replace(/[\\/:*?"<>|]/g, '-') || 'مشروع';
      const fileName = `تقرير_المصروفات_اليومية_${projectName}_من_${dateFrom}_إلى_${dateTo}.xlsx`;
      saveAs(blob, fileName);

      console.log('📄 تفاصيل الملف المُصدّر:');
      console.log(`   📁 اسم الملف: ${fileName}`);
      console.log(`   📊 عدد الأوراق: ${dailyExpenses.length}`);
      console.log(`   📋 البيانات المُضمّنة:`);

      toast({
        title: "تم التصدير بنجاح! 🎉",
        description: `تم تصدير ${dailyExpenses.length} يوم من المصروفات اليومية`,
      });

      console.log('✅ تم إنتهاء التصدير بنجاح');

    } catch (error) {
      console.error('❌ خطأ في التصدير:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير المصروفات اليومية",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  // إعداد التواريخ الافتراضية
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (!dateTo) setDateTo(today);
    if (!dateFrom) setDateFrom(weekAgo);
  }, []);

  return (
    <Card className="w-full" id="bulk-export-component">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            تصدير المصروفات اليومية لفترة زمنية
          </CardTitle>
          <Button 
            onClick={downloadComponentImage}
            variant="secondary" 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Camera className="h-4 w-4 mr-1" />
            تحميل صورة
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* تنبيه توضيحي */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">كيفية الاستخدام</h3>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            سيتم إنشاء ملف Excel واحد يحتوي على ورقة منفصلة لكل يوم في الفترة المحددة.
            كل ورقة تحتوي على تفاصيل المصروفات اليومية لذلك اليوم.
          </p>
        </div>

        {/* معلومات المشروع */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">المشروع المحدد:</h3>
          <div className="flex items-center gap-2">
            {projectsLoading ? (
              <Badge variant="secondary" className="text-sm">
                جاري التحميل...
              </Badge>
            ) : selectedProject ? (
              <>
                <Badge variant="default" className="text-sm">
                  {selectedProject.name}
                </Badge>
                {selectedProject.status && (
                  <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                    {selectedProject.status === 'active' ? 'نشط' : selectedProject.status}
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="destructive" className="text-sm">
                لم يتم تحديد مشروع
              </Badge>
            )}
          </div>
        </div>

        {/* اختيار الفترة الزمنية */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              من تاريخ
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              إلى تاريخ
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isExporting && exportProgress.total > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>جاري المعالجة...</span>
              <span>{exportProgress.current} من {exportProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* زر التصدير */}
        <div className="flex justify-center">
          <Button
            onClick={handleBulkExport}
            disabled={isExporting || !selectedProjectId}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                تصدير إلى Excel
              </>
            )}
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">ما سيتم تضمينه في التقرير:</h4>
          </div>
          <ul className="text-sm text-green-700 mt-2 space-y-1">
            <li>• ملخص الدخل والمصاريف لكل يوم (أرقام وتواريخ إنجليزية)</li>
            <li>• تفاصيل أجور العمال مع أيام وساعات العمل</li>
            <li>• مشتريات المواد والأدوات مع تفاصيل الموردين</li>
            <li>• مصاريف النقل والمواصلات</li>
            <li>• مدفوعات الموردين وطرق الدفع</li>
            <li>• الحوالات والتحويلات المالية</li>
            <li>• الرصيد المرحل من المشاريع الأخرى</li>
            <li>• جميع البيانات حقيقية من قاعدة البيانات</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}