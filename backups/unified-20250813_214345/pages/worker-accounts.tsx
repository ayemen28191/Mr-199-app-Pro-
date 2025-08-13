import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Phone, 
  CreditCard, 
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface WorkerTransfer {
  id: string;
  workerId: string;
  projectId: string;
  amount: number;
  recipientName: string;
  recipientPhone?: string;
  transferMethod: 'cash' | 'bank' | 'hawaleh';
  transferNumber?: string;
  transferDate: string;
  notes?: string;
}

interface TransferFormData {
  workerId: string;
  projectId: string;
  amount: number;
  recipientName: string;
  recipientPhone: string;
  transferMethod: 'cash' | 'bank' | 'hawaleh';
  transferNumber: string;
  notes: string;
}

export default function WorkerAccountsPage() {
  const [, setLocation] = useLocation();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<WorkerTransfer | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL parameters for editing
  const urlParams = new URLSearchParams(window.location.search);
  const editTransferId = urlParams.get('edit');
  const preselectedWorker = urlParams.get('worker');

  // Form state
  const [formData, setFormData] = useState<TransferFormData>({
    workerId: preselectedWorker || '',
    projectId: '',
    amount: 0,
    recipientName: '',
    recipientPhone: '',
    transferMethod: 'hawaleh',
    transferNumber: '',
    notes: ''
  });

  // Fetch data
  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
    select: (data: Worker[]) => data.filter(w => w.isActive)
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects']
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['/api/worker-transfers']
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      return apiRequest('/api/worker-transfers', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worker-transfers'] });
      setShowTransferDialog(false);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم إرسال الحولة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الحولة",
        variant: "destructive"
      });
    }
  });

  // Update transfer mutation
  const updateTransferMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<TransferFormData> }) => {
      return apiRequest(`/api/worker-transfers/${data.id}`, 'PATCH', data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worker-transfers'] });
      setShowTransferDialog(false);
      setEditingTransfer(null);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الحولة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحولة",
        variant: "destructive"
      });
    }
  });

  // Delete transfer mutation
  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/worker-transfers/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worker-transfers'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الحولة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الحولة",
        variant: "destructive"
      });
    }
  });

  // Handle edit from URL parameter
  useEffect(() => {
    if (editTransferId && transfers.length > 0) {
      const transfer = transfers.find(t => t.id === editTransferId);
      if (transfer) {
        setEditingTransfer(transfer);
        setFormData({
          workerId: transfer.workerId,
          projectId: transfer.projectId,
          amount: transfer.amount,
          recipientName: transfer.recipientName,
          recipientPhone: transfer.recipientPhone || '',
          transferMethod: transfer.transferMethod,
          transferNumber: transfer.transferNumber || '',
          notes: transfer.notes || ''
        });
        setShowTransferDialog(true);
      }
    }
  }, [editTransferId, transfers]);

  const resetForm = () => {
    setFormData({
      workerId: '',
      projectId: '',
      amount: 0,
      recipientName: '',
      recipientPhone: '',
      transferMethod: 'hawaleh',
      transferNumber: '',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.workerId || !formData.projectId || !formData.amount || !formData.recipientName) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (editingTransfer) {
      updateTransferMutation.mutate({
        id: editingTransfer.id,
        updates: formData
      });
    } else {
      createTransferMutation.mutate(formData);
    }
  };

  const handleEdit = (transfer: WorkerTransfer) => {
    setEditingTransfer(transfer);
    setFormData({
      workerId: transfer.workerId,
      projectId: transfer.projectId,
      amount: transfer.amount,
      recipientName: transfer.recipientName,
      recipientPhone: transfer.recipientPhone || '',
      transferMethod: transfer.transferMethod,
      transferNumber: transfer.transferNumber || '',
      notes: transfer.notes || ''
    });
    setShowTransferDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} ر.ي`;
  };

  const getTransferMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً';
      case 'bank': return 'تحويل بنكي';
      case 'hawaleh': return 'حولة';
      default: return method;
    }
  };

  const filteredTransfers = selectedProject && selectedProject !== 'all' 
    ? transfers.filter(t => t.projectId === selectedProject)
    : transfers;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/daily-expenses')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">حسابات العمال</h1>
            <p className="text-muted-foreground">إدارة حوالات وتحويلات العمال</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingTransfer(null);
            resetForm();
            setShowTransferDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          حولة جديدة
        </Button>
      </div>

      {/* Project Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">تصفية بالمشروع:</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="جميع المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                {projects.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transfers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">الحوالات المرسلة</h2>
          <Badge variant="secondary">
            {filteredTransfers.length} حولة
          </Badge>
        </div>

        {filteredTransfers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد حوالات</h3>
              <p className="text-muted-foreground mb-4">
                {selectedProject && selectedProject !== 'all' ? 'لا توجد حوالات في هذا المشروع' : 'لم يتم إرسال أي حوالات بعد'}
              </p>
              <Button 
                onClick={() => {
                  setEditingTransfer(null);
                  resetForm();
                  setShowTransferDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                إرسال حولة جديدة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTransfers.map((transfer) => {
              const worker = workers.find(w => w.id === transfer.workerId);
              const project = projects.find(p => p.id === transfer.projectId);
              
              return (
                <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{worker?.name || 'عامل غير معروف'}</span>
                          <Badge variant="outline" className="text-xs">
                            {worker?.type || 'غير محدد'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {project?.name || 'مشروع غير معروف'}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="font-bold text-green-600">
                              {formatCurrency(transfer.amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-purple-600" />
                            <span>{getTransferMethodLabel(transfer.transferMethod)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-600" />
                            <span>{new Date(transfer.transferDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transfer)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTransferMutation.mutate(transfer.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">المستلم: </span>
                          <span className="font-medium">{transfer.recipientName}</span>
                          {transfer.recipientPhone && (
                            <>
                              <span className="text-muted-foreground mx-2">•</span>
                              <Phone className="h-3 w-3 inline mr-1" />
                              <span>{transfer.recipientPhone}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {transfer.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>ملاحظات: {transfer.notes}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransfer ? 'تعديل الحولة' : 'حولة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>العامل *</Label>
                <Select
                  value={formData.workerId}
                  onValueChange={(value) => setFormData({...formData, workerId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العامل" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} ({worker.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المشروع *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({...formData, projectId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>المبلغ (ر.ي) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <Label>اسم المستلم *</Label>
              <Input
                value={formData.recipientName}
                onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                placeholder="اسم الشخص المستلم للحولة"
              />
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.recipientPhone}
                onChange={(e) => setFormData({...formData, recipientPhone: e.target.value})}
                placeholder="رقم هاتف المستلم (اختياري)"
              />
            </div>

            <div>
              <Label>طريقة التحويل</Label>
              <Select
                value={formData.transferMethod}
                onValueChange={(value: 'cash' | 'bank' | 'hawaleh') => 
                  setFormData({...formData, transferMethod: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hawaleh">حولة</SelectItem>
                  <SelectItem value="bank">تحويل بنكي</SelectItem>
                  <SelectItem value="cash">نقداً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>رقم الحولة</Label>
              <Input
                value={formData.transferNumber}
                onChange={(e) => setFormData({...formData, transferNumber: e.target.value})}
                placeholder="رقم الحولة أو المرجع"
              />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="ملاحظات إضافية (اختياري)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={createTransferMutation.isPending || updateTransferMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {editingTransfer ? 'تحديث' : 'إرسال'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  setEditingTransfer(null);
                  resetForm();
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}