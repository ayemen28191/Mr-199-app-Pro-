import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Eye, 
  Edit, 
  QrCode, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Package, 
  Wrench, 
  FileText, 
  Download,
  Upload,
  Camera,
  Move,
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink,
  History,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StatsCard } from '@/components/ui/stats-card';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Tool {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  unit: string;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  maintenanceInterval?: number;
  nextMaintenanceDate?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  locationType: string;
  locationId?: string;
  specifications?: any;
  images?: string[];
  manuals?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ToolCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface ToolMovement {
  id: string;
  toolId: string;
  movementType: string;
  fromLocation?: string;
  toLocation?: string;
  fromProjectId?: string;
  toProjectId?: string;
  quantity: number;
  reason?: string;
  performedBy?: string;
  gpsLocation?: any;
  createdAt: string;
}

interface ToolStock {
  id: string;
  toolId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  locationId?: string;
  projectId?: string;
  lastUpdated: string;
}

interface ToolDetailsDialogProps {
  toolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

const ToolDetailsDialog: React.FC<ToolDetailsDialogProps> = ({ 
  toolId, 
  open, 
  onOpenChange, 
  onEdit 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [qrCodeSize, setQrCodeSize] = useState(200);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tool details
  const { data: tool, isLoading } = useQuery<Tool>({
    queryKey: ['/api/tools', toolId],
    enabled: !!toolId && open,
  });

  // Fetch all tool categories and find the specific one
  const { data: categories = [] } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
    enabled: open,
  });

  // Find the specific category for this tool
  const category = categories.find(cat => cat.id === tool?.categoryId);

  // Fetch tool stock
  const { data: stock } = useQuery<ToolStock[]>({
    queryKey: ['/api/tool-stock', toolId],
    enabled: !!toolId && open,
  });

  // Fetch tool movements (recent 10)
  const { data: movements = [] } = useQuery<ToolMovement[]>({
    queryKey: ['/api/tool-movements', toolId, 'recent'],
    enabled: !!toolId && open,
  });

  // Handler functions for quick actions
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setUploading(true);
        try {
          // في التطبيق الحقيقي سيتم رفع الصور إلى الخادم
          await new Promise(resolve => setTimeout(resolve, 2000)); // محاكاة الرفع
          toast({
            title: "تم رفع الصور بنجاح",
            description: `تم رفع ${files.length} صورة`,
          });
        } catch (error) {
          toast({
            title: "خطأ في رفع الصور",
            description: "حدث خطأ أثناء رفع الصور",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const handleManualUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setUploading(true);
        try {
          // في التطبيق الحقيقي سيتم رفع الملفات إلى الخادم
          await new Promise(resolve => setTimeout(resolve, 2000)); // محاكاة الرفع
          toast({
            title: "تم رفع الأدلة بنجاح",
            description: `تم رفع ${files.length} ملف`,
          });
        } catch (error) {
          toast({
            title: "خطأ في رفع الأدلة",
            description: "حدث خطأ أثناء رفع الأدلة",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  // Fetch projects for location mapping
  const { data: projects = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/projects'],
    enabled: !!toolId && open,
  });

  if (!tool && !isLoading) {
    return null;
  }

  // Status and condition mappings
  const getStatusInfo = (status: string) => {
    const statusMap = {
      available: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'متاح', icon: CheckCircle },
      in_use: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'قيد الاستخدام', icon: Wrench },
      maintenance: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'صيانة', icon: Settings },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'معطل', icon: AlertTriangle },
      retired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'متقاعد', icon: X },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.available;
  };

  const getConditionInfo = (condition: string) => {
    const conditionMap = {
      excellent: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', text: 'ممتاز' },
      good: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'جيد' },
      fair: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'مقبول' },
      poor: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', text: 'ضعيف' },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'معطل' },
    };
    return conditionMap[condition as keyof typeof conditionMap] || conditionMap.good;
  };

  // Generate QR Code data
  const generateQrCodeUrl = (size: number = 200) => {
    if (!tool) return '';
    const qrData = JSON.stringify({
      type: 'TOOL',
      id: tool.id,
      name: tool.name,
      sku: tool.sku,
      timestamp: Date.now()
    });
    const encodedData = encodeURIComponent(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&ecc=M`;
  };

  // Download QR Code
  const downloadQrCode = () => {
    if (!tool) return;
    const link = document.createElement('a');
    link.href = generateQrCodeUrl(400);
    link.download = `qr-code-${tool.name}-${tool.sku || tool.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'تم تحميل رمز QR',
      description: 'تم تحميل رمز QR للأداة بنجاح',
    });
  };

  // Print QR Code
  const printQrCode = () => {
    if (!tool) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>QR Code - ${tool.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              direction: rtl;
            }
            .qr-container {
              border: 2px solid #ddd;
              padding: 20px;
              margin: 20px auto;
              width: fit-content;
            }
            .tool-info {
              margin-top: 15px;
              font-size: 14px;
              color: #666;
            }
            .tool-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="tool-name">${tool.name}</div>
            <img src="${generateQrCodeUrl(300)}" alt="QR Code" />
            <div class="tool-info">
              <div>SKU: ${tool.sku || 'غير محدد'}</div>
              <div>الفئة: ${category?.name || 'غير محدد'}</div>
              <div>الحالة: ${getStatusInfo(tool.status).text}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast({
      title: 'تم إرسال طباعة رمز QR',
      description: 'تم إرسال رمز QR للطابع يمني',
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل تفاصيل الأداة...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!tool) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>خطأ</DialogTitle>
            <DialogDescription>
              لم يتم العثور على الأداة المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusInfo = getStatusInfo(tool.status);
  const conditionInfo = getConditionInfo(tool.condition);
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Package className="h-6 w-6" />
                {tool.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {tool.description || 'تفاصيل شاملة للأداة ومعلومات التشغيل'}
              </DialogDescription>
            </div>
            <div className="flex gap-2 mr-4">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 ml-1" />
                  تعديل
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 rounded-lg mb-6">
            <TabsTrigger value="overview" className="text-sm font-medium">
              <Eye className="h-4 w-4 ml-1" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="qr-code" className="text-sm font-medium">
              <QrCode className="h-4 w-4 ml-1" />
              رمز QR
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-sm font-medium">
              <Package className="h-4 w-4 ml-1" />
              المخزون
            </TabsTrigger>
            <TabsTrigger value="movements" className="text-sm font-medium">
              <History className="h-4 w-4 ml-1" />
              الحركات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm font-medium">
              <BarChart3 className="h-4 w-4 ml-1" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">الحالة</p>
                      <Badge className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">الجودة</p>
                      <Badge className={`text-xs ${conditionInfo.color}`}>
                        {conditionInfo.text}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">التصنيف</p>
                      <p className="font-medium">{category?.name || 'غير محدد'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">الموقع</p>
                      <p className="font-medium text-sm">
                        {tool.locationType || 'غير محدد'}
                        {tool.locationId && ` - ${tool.locationId}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">اسم الأداة:</span>
                      <p className="font-medium">{tool.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">رقم SKU:</span>
                      <p className="font-medium">{tool.sku || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرقم التسلسلي:</span>
                      <p className="font-medium">{tool.serialNumber || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">وحدة القياس:</span>
                      <p className="font-medium">{tool.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرمز الشريطي:</span>
                      <p className="font-medium text-xs">{tool.barcode || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <p className="font-medium">
                        {new Date(tool.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  {tool.description && (
                    <div>
                      <span className="text-muted-foreground">الوصف:</span>
                      <p className="mt-1 text-sm">{tool.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    المعلومات المالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">سعر الشراء:</span>
                      <p className="font-medium">
                        {tool.purchasePrice && parseFloat(tool.purchasePrice.toString()) > 0 
                          ? `${parseFloat(tool.purchasePrice.toString()).toLocaleString('en-US')} ر.ي` 
                          : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">القيمة الحالية:</span>
                      <p className="font-medium">
                        {tool.currentValue && parseFloat(tool.currentValue.toString()) > 0 
                          ? `${parseFloat(tool.currentValue.toString()).toLocaleString('en-US')} ر.ي` 
                          : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">معدل الإهلاك:</span>
                      <p className="font-medium">
                        {tool.depreciationRate && parseFloat(tool.depreciationRate.toString()) > 0 
                          ? `${parseFloat(tool.depreciationRate.toString())}%` 
                          : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ الشراء:</span>
                      <p className="font-medium">
                        {tool.purchaseDate ? new Date(tool.purchaseDate).toLocaleDateString('en-GB') : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">انتهاء الضمان:</span>
                      <p className="font-medium">
                        {tool.warrantyExpiry ? new Date(tool.warrantyExpiry).toLocaleDateString('en-GB') : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    معلومات الصيانة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">فترة الصيانة:</span>
                      <p className="font-medium">
                        {tool.maintenanceInterval ? `كل ${tool.maintenanceInterval} يوم` : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الصيانة القادمة:</span>
                      <p className="font-medium">
                        {tool.nextMaintenanceDate ? new Date(tool.nextMaintenanceDate).toLocaleDateString('en-GB') : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              {tool.specifications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      المواصفات التقنية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                      {typeof tool.specifications === 'string' 
                        ? tool.specifications 
                        : JSON.stringify(tool.specifications, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr-code" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  رمز QR للأداة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
                    <img 
                      src={generateQrCodeUrl(qrCodeSize)} 
                      alt={`QR Code for ${tool.name}`}
                      className="mx-auto"
                      style={{ width: qrCodeSize, height: qrCodeSize }}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={downloadQrCode}>
                      <Download className="h-4 w-4 ml-1" />
                      تحميل
                    </Button>
                    <Button variant="outline" onClick={printQrCode}>
                      <FileText className="h-4 w-4 ml-1" />
                      طباعة
                    </Button>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      يحتوي رمز QR على معلومات الأداة للمسح السريع
                    </p>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono">
                      ID: {tool.id}<br />
                      SKU: {tool.sku || 'غير محدد'}<br />
                      الحالة: {statusInfo.text}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    حالة المخزون
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stock && stock.length > 0 ? (
                    <div className="space-y-4">
                      {stock.map((stockItem, index) => (
                        <div key={stockItem.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">المخزون الحالي:</span>
                              <p className="font-medium text-lg">{stockItem.currentStock}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">المحجوز:</span>
                              <p className="font-medium text-lg">{stockItem.reservedStock}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">المتاح:</span>
                              <p className="font-medium text-lg text-green-600">{stockItem.availableStock}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">آخر تحديث:</span>
                              <p className="font-medium text-xs">
                                {new Date(stockItem.lastUpdated).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">لا توجد بيانات مخزون</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Move className="h-5 w-5" />
                    إجراءات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowMoveDialog(true)}
                  >
                    <Move className="h-4 w-4 ml-2" />
                    نقل الأداة
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowMaintenanceDialog(true)}
                  >
                    <Calendar className="h-4 w-4 ml-2" />
                    جدولة صيانة
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleImageUpload}
                    disabled={uploading}
                  >
                    <Camera className="h-4 w-4 ml-2" />
                    {uploading ? 'جاري الرفع...' : 'إضافة صورة'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleManualUpload}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    {uploading ? 'جاري الرفع...' : 'رفع دليل'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  سجل الحركات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movements.length > 0 ? (
                  <div className="space-y-3">
                    {movements.map((movement) => (
                      <div key={movement.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{movement.movementType}</p>
                            <p className="text-sm text-muted-foreground">
                              {movement.fromLocation && `من: ${movement.fromLocation}`}
                              {movement.toLocation && ` إلى: ${movement.toLocation}`}
                            </p>
                            {movement.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                السبب: {movement.reason}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">
                              {new Date(movement.createdAt).toLocaleDateString('en-GB')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              الكمية: {movement.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد حركات مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="مرات الاستخدام"
                value={movements.filter(m => m.movementType === 'استخدام').length}
                icon={Wrench}
                color="blue"
              />
              <StatsCard
                title="مرات النقل"
                value={movements.filter(m => m.movementType === 'نقل').length}
                icon={Move}
                color="green"
              />
              <StatsCard
                title="أيام التشغيل"
                value={Math.floor((Date.now() - new Date(tool.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                icon={Calendar}
                color="orange"
              />
              <StatsCard
                title="معدل الاستخدام"
                value={`${Math.round((movements.length / Math.max(1, Math.floor((Date.now() - new Date(tool.createdAt).getTime()) / (1000 * 60 * 60 * 24)))) * 100)}%`}
                icon={BarChart3}
                color="purple"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تحليل الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    التحليلات المفصلة قيد التطوير
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ستتضمن: معدل الاستخدام، كفاءة الصيانة، تحليل التكلفة
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Move Tool Dialog */}
      {showMoveDialog && (
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>نقل الأداة</DialogTitle>
              <DialogDescription>
                تحديد موقع جديد للأداة: {tool?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">المشروع الجديد</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="">اختر المشروع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">سبب النقل</label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md" 
                  rows={3}
                  placeholder="اكتب سبب النقل..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    toast({
                      title: "تم نقل الأداة بنجاح",
                      description: "تم تحديث موقع الأداة",
                    });
                    setShowMoveDialog(false);
                  }}
                  className="flex-1"
                >
                  تأكيد النقل
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMoveDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Maintenance Dialog */}
      {showMaintenanceDialog && (
        <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>جدولة صيانة</DialogTitle>
              <DialogDescription>
                إنشاء جدولة صيانة للأداة: {tool?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">نوع الصيانة</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="preventive">صيانة وقائية</option>
                  <option value="corrective">صيانة تصحيحية</option>
                  <option value="emergency">صيانة طارئة</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">تاريخ الصيانة</label>
                <input 
                  type="date" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الملاحظات</label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md" 
                  rows={3}
                  placeholder="اكتب ملاحظات الصيانة..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    toast({
                      title: "تم جدولة الصيانة بنجاح",
                      description: "تم حفظ جدولة الصيانة",
                    });
                    setShowMaintenanceDialog(false);
                  }}
                  className="flex-1"
                >
                  حفظ الجدولة
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMaintenanceDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default ToolDetailsDialog;