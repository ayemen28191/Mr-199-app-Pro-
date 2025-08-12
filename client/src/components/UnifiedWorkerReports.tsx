import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Printer, FileDown, Calendar, Users, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: number;
}

interface Project {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  workDays: number;
  workHours: number;
  description: string;
  dailyWage: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  notes?: string;
}

interface TransferRecord {
  id: string;
  date: string;
  amount: number;
  recipientName: string;
  transferNumber: string;
  notes?: string;
}

// Utility functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-YE', {
    style: 'currency',
    currency: 'YER',
    minimumFractionDigits: 0,
  }).format(amount).replace('ر.ي.‏', '') + ' ر.ي';
};

// Main component
export const UnifiedWorkerReports: React.FC = () => {
  const [reportType, setReportType] = useState<'clearance' | 'detailed'>('clearance');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('2025-07-25');
  const [dateTo, setDateTo] = useState('2025-08-12');
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch workers and projects
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Generate clearance report
  const generateClearanceReport = async () => {
    setIsGenerating(true);
    try {
      const promises = selectedWorkers.map(async (workerId) => {
        const worker = workers.find(w => w.id === workerId);
        if (!worker) return null;

        // Fetch worker data from multiple projects
        const workerProjects = await Promise.all(
          selectedProjects.map(async (projectId) => {
            const project = projects.find(p => p.id === projectId);
            const response = await fetch(
              `/api/workers/${workerId}/account-statement?projectIds=${projectId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
            );
            const data = await response.json();
            return {
              project,
              attendance: data.attendance || [],
              transfers: data.transfers || []
            };
          })
        );

        return {
          worker,
          projects: workerProjects
        };
      });

      const workersData = await Promise.all(promises);
      setReportData({ type: 'clearance', workers: workersData.filter(Boolean) });
    } catch (error) {
      console.error('Error generating clearance report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate detailed report
  const generateDetailedReport = async () => {
    setIsGenerating(true);
    try {
      const worker = workers.find(w => w.id === selectedWorker);
      const project = projects.find(p => p.id === selectedProject);
      
      const response = await fetch(
        `/api/workers/${selectedWorker}/account-statement?projectIds=${selectedProject}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      const data = await response.json();
      
      setReportData({ 
        type: 'detailed', 
        worker, 
        project,
        attendance: data.attendance || [],
        transfers: data.transfers || []
      });
    } catch (error) {
      console.error('Error generating detailed report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    // Excel export logic will be added here
    console.log('Excel export functionality to be implemented');
  };

  // Clearance Report Component
  const ClearanceReportView = ({ data }: { data: any }) => {
    const { workers } = data;
    
    // Calculate totals
    let totalWorkers = workers.length;
    let totalProjects = selectedProjects.length;
    let totalDays = 0;
    let totalHours = 0;
    let totalAmountDue = 0;
    let totalAmountReceived = 0;
    let totalTransferred = 0;

    // Build rows data
    const rows: any[] = [];
    let rowIndex = 1;

    workers.forEach((workerData: any) => {
      const { worker, projects } = workerData;
      
      projects.forEach((projectData: any, projectIndex: number) => {
        const { project, attendance, transfers } = projectData;
        
        // Calculate project totals for this worker
        const projectDays = attendance.reduce((sum: number, att: any) => sum + (att.workDays || 0), 0);
        const projectHours = attendance.reduce((sum: number, att: any) => sum + (att.workHours || 0), 0);
        const projectAmountDue = attendance.reduce((sum: number, att: any) => sum + (att.dailyWage * att.workDays), 0);
        const projectAmountReceived = attendance.reduce((sum: number, att: any) => sum + (att.paidAmount || 0), 0);
        const projectRemaining = projectAmountDue - projectAmountReceived;
        
        totalDays += projectDays;
        totalHours += projectHours;
        totalAmountDue += projectAmountDue;
        totalAmountReceived += projectAmountReceived;

        // Add project row
        rows.push({
          type: 'project',
          rowNumber: projectIndex === 0 ? rowIndex : '',
          workerName: projectIndex === 0 ? worker.name : '',
          workerType: projectIndex === 0 ? worker.type : '',
          projectName: project?.name || '',
          dailyWage: worker.dailyWage,
          workDays: projectDays,
          workHours: projectHours,
          amountDue: projectAmountDue,
          amountReceived: projectAmountReceived,
          remaining: projectRemaining,
          notes: ''
        });

        // Add transfer rows
        transfers.forEach((transfer: any) => {
          totalTransferred += transfer.amount;
          rows.push({
            type: 'transfer',
            rowNumber: '',
            workerName: '',
            workerType: '',
            projectName: project?.name || '',
            dailyWage: '',
            workDays: '',
            workHours: '',
            amountDue: '',
            amountReceived: transfer.amount,
            remaining: -transfer.amount,
            notes: `حوالة حسنة، رقم الى: ${transfer.recipientName} - رقم: ${transfer.transferNumber}`
          });
        });
      });
      
      rowIndex++;
    });

    return (
      <div className="unified-report clearance-report">
        {/* Header */}
        <div className="report-header" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '3px solid #1e40af', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: '0' }}>
            شركة الفتيني للمقاولات والاستشارات الهندسية
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '10px 0' }}>
            كشف تصفية العمال
          </h2>
          <p style={{ fontSize: '16px', color: '#666', margin: '5px 0' }}>
            للفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
          </p>
        </div>

        {/* Statistics Bar */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#e5e7eb', 
          padding: '10px', 
          marginBottom: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <div>عدد العمال: [{totalWorkers}]</div>
          <div>عدد المشاريع: {totalProjects}</div>
          <div>إجمالي أيام العمل: {totalDays.toFixed(1)}</div>
          <div>عدد السجلات: [{rows.filter(r => r.type === 'project').length}]</div>
        </div>

        {/* Main Table */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            backgroundColor: '#1e40af', 
            color: 'white', 
            textAlign: 'center', 
            padding: '10px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            كشف التصفية للعمال
          </div>
          
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px',
            border: '1px solid #000'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>م</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>الاسم</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المهنة</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>اسم المشروع</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>الأجر اليومي</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>أيام العمل</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>إجمالي الساعات</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المبلغ المستحق</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المبلغ المستلم</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المتبقي</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr 
                  key={index}
                  style={{ 
                    backgroundColor: row.type === 'transfer' ? '#fef3c7' : 'white'
                  }}
                >
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.rowNumber}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.workerName}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.workerType}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.projectName}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.dailyWage ? formatCurrency(row.dailyWage) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.workDays !== '' ? row.workDays.toFixed(1) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.workHours !== '' ? row.workHours.toFixed(1) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: row.type === 'project' ? '#dc2626' : '' }}>
                    {row.amountDue !== '' ? formatCurrency(row.amountDue) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: '#16a34a' }}>
                    {row.amountReceived !== '' ? formatCurrency(row.amountReceived) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: row.remaining > 0 ? '#dc2626' : '#16a34a' }}>
                    {row.remaining !== '' ? formatCurrency(row.remaining) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {row.notes}
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr style={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  الإجماليات
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {totalDays.toFixed(1)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {totalHours.toFixed(1)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountDue)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountReceived)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountDue - totalAmountReceived)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final Summary */}
        <div style={{ 
          backgroundColor: '#e0f2fe', 
          padding: '15px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>الملخص النهائي</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '10px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <div>
              <div style={{ color: '#1e40af' }}>{formatCurrency(totalAmountDue)}</div>
              <div>إجمالي المبلغ المستحق</div>
            </div>
            <div>
              <div style={{ color: '#dc2626' }}>{formatCurrency(totalTransferred)}</div>
              <div>إجمالي المبلغ المحول</div>
            </div>
            <div>
              <div style={{ color: '#16a34a' }}>{formatCurrency(totalAmountReceived)}</div>
              <div>إجمالي المبلغ المستلم</div>
            </div>
            <div>
              <div style={{ color: '#dc2626' }}>{formatCurrency(totalAmountDue - totalAmountReceived)}</div>
              <div>إجمالي المبلغ المتبقي</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع المدير العام
            </div>
          </div>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع مدير المشروع
            </div>
          </div>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع المهندس
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          fontSize: '12px',
          color: '#666'
        }}>
          تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء<br/>
          التاريخ: {formatDate(new Date().toISOString().split('T')[0])}
        </div>
      </div>
    );
  };

  // Detailed Report Component
  const DetailedReportView = ({ data }: { data: any }) => {
    const { worker, project, attendance = [], transfers = [] } = data;
    
    // Calculate totals with safe number handling
    const totalDays = attendance.reduce((sum: number, att: any) => {
      const workDays = Number(att.workDays) || 0;
      return sum + workDays;
    }, 0);
    const totalHours = attendance.reduce((sum: number, att: any) => {
      const workHours = Number(att.workHours) || 0;
      return sum + workHours;
    }, 0);
    const totalAmountDue = attendance.reduce((sum: number, att: any) => {
      const dailyWage = Number(att.dailyWage) || 0;
      const workDays = Number(att.workDays) || 0;
      return sum + (dailyWage * workDays);
    }, 0);
    const totalAmountReceived = attendance.reduce((sum: number, att: any) => {
      const paidAmount = Number(att.paidAmount) || 0;
      return sum + paidAmount;
    }, 0);
    const totalTransferred = transfers.reduce((sum: number, transfer: any) => {
      const amount = Number(transfer.amount) || 0;
      return sum + amount;
    }, 0);

    return (
      <div className="unified-report detailed-report">
        {/* Header */}
        <div className="report-header" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '3px solid #1e40af', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: '0' }}>
            شركة الفتيني للمقاولات والاستشارات الهندسية
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '10px 0' }}>
            كشف حساب تفصيلي للعمل
          </h2>
          <p style={{ fontSize: '16px', color: '#666', margin: '5px 0' }}>
            للفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
          </p>
        </div>

        {/* Statistics Bar */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#e5e7eb', 
          padding: '10px', 
          marginBottom: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <div>اسم العامل: {worker.name} [{worker.type}]</div>
          <div>عدد المشاريع: 1</div>
          <div>إجمالي أيام العمل: {totalDays.toFixed(1)}</div>
          <div>عدد السجلات: [{attendance.length}]</div>
        </div>

        {/* Main Table */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            backgroundColor: '#1e40af', 
            color: 'white', 
            textAlign: 'center', 
            padding: '10px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            كشف حساب تفصيلي للعامل
          </div>
          
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px',
            border: '1px solid #000'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>م</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>التاريخ</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>اليوم</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>اسم المشروع</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>الأجر اليومي</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>أيام العمل</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>إجمالي الساعات</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المبلغ المستحق</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المبلغ المستلم</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>المتبقي</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record: any, index: number) => {
                const dayName = new Date(record.date).toLocaleDateString('ar', { weekday: 'long' });
                const amountDue = record.dailyWage * record.workDays;
                const remaining = amountDue - (record.paidAmount || 0);
                
                return (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {formatDate(record.date)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {dayName}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {project?.name || ''}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {formatCurrency(record.dailyWage)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {record.workDays.toFixed(1)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {record.workHours.toFixed(1)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: '#dc2626' }}>
                      {formatCurrency(amountDue)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: '#16a34a' }}>
                      {formatCurrency(record.paidAmount || 0)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatCurrency(remaining)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {record.notes || ''}
                    </td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr style={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  الإجماليات
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {totalDays.toFixed(1)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {totalHours.toFixed(1)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountDue)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountReceived)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {formatCurrency(totalAmountDue - totalAmountReceived)}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final Summary */}
        <div style={{ 
          backgroundColor: '#e0f2fe', 
          padding: '15px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>الملخص النهائي</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '10px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <div>
              <div style={{ color: '#1e40af' }}>{formatCurrency(totalAmountDue)}</div>
              <div>إجمالي المبلغ المستحق</div>
            </div>
            <div>
              <div style={{ color: '#dc2626' }}>{formatCurrency(totalTransferred)}</div>
              <div>إجمالي المبلغ المحول</div>
            </div>
            <div>
              <div style={{ color: '#16a34a' }}>{formatCurrency(totalAmountReceived)}</div>
              <div>إجمالي المبلغ المستلم</div>
            </div>
            <div>
              <div style={{ color: '#dc2626' }}>{formatCurrency(totalAmountDue - totalAmountReceived)}</div>
              <div>إجمالي المبلغ المتبقي</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع المحاسب
            </div>
          </div>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع المهندس المشرف
            </div>
          </div>
          <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '40px 10px 10px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>
              توقيع العامل
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          fontSize: '12px',
          color: '#666'
        }}>
          تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء<br/>
          التاريخ: {formatDate(new Date().toISOString().split('T')[0])}
        </div>
      </div>
    );
  };

  return (
    <div className="unified-reports-container">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <FileDown className="h-6 w-6" />
            تقارير العمال الموحدة
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'clearance' | 'detailed')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clearance" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                كشف تصفية العمال
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                كشف تفصيلي للعامل
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clearance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اختيار العمال (متعدد)</Label>
                  <Select 
                    value={selectedWorkers.join(',')} 
                    onValueChange={(value) => setSelectedWorkers(value ? value.split(',') : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العمال..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name} - {worker.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>اختيار المشاريع (متعدد)</Label>
                  <Select 
                    value={selectedProjects.join(',')} 
                    onValueChange={(value) => setSelectedProjects(value ? value.split(',') : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشاريع..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={generateClearanceReport} 
                disabled={isGenerating || selectedWorkers.length === 0 || selectedProjects.length === 0}
                className="w-full"
              >
                {isGenerating ? 'جاري إنشاء التقرير...' : 'إنشاء كشف التصفية'}
              </Button>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اختيار العامل</Label>
                  <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العامل..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name} - {worker.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>اختيار المشروع</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشروع..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={generateDetailedReport} 
                disabled={isGenerating || !selectedWorker || !selectedProject}
                className="w-full"
              >
                {isGenerating ? 'جاري إنشاء التقرير...' : 'إنشاء الكشف التفصيلي'}
              </Button>
            </TabsContent>
          </Tabs>

          {reportData && (
            <div className="mt-8 space-y-4">
              <div className="flex gap-2 print:hidden">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button onClick={handleExportExcel} variant="outline">
                  <FileDown className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
              </div>

              <div ref={printRef} className="print:m-0">
                {reportData.type === 'clearance' && <ClearanceReportView data={reportData} />}
                {reportData.type === 'detailed' && <DetailedReportView data={reportData} />}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .unified-report, .unified-report * {
              visibility: visible;
            }
            .unified-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              direction: rtl;
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            @page {
              size: A4;
              margin: 1cm;
            }
          }
          
          .unified-reports-container {
            direction: rtl;
          }
          
          .unified-report {
            direction: rtl;
            font-family: 'Arial', sans-serif;
          }
        `
      }} />
    </div>
  );
};