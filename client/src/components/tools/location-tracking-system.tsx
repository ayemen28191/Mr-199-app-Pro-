import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, 
  Building, 
  Home, 
  Truck, 
  Package, 
  Search,
  Plus,
  Edit,
  Trash,
  Navigation,
  Clock,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'project_site' | 'vehicle' | 'office' | 'external';
  description?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactPerson?: string;
  phone?: string;
  capacity?: number;
  currentCount?: number;
  isActive: boolean;
  createdAt: string;
}

interface ToolMovement {
  id: string;
  toolId: string;
  toolName: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId: string;
  toLocationName: string;
  movementType: 'transfer' | 'checkout' | 'checkin' | 'maintenance' | 'return';
  reason?: string;
  movedBy: string;
  movedByName?: string;
  plannedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
  timestamp: string;
}

const LocationTrackingSystem: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('transfer');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'locations' | 'movements' | 'map'>('locations');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب المواقع
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      // محاكاة البيانات - في التطبيق الحقيقي سيتم جلبها من الخادم
      return [
        {
          id: '1',
          name: 'المستودع الرئيسي',
          type: 'warehouse' as const,
          description: 'مستودع تخزين الأدوات الرئيسي',
          address: 'الرياض، المملكة العربية السعودية',
          contactPerson: 'أحمد محمد',
          phone: '+966501234567',
          capacity: 1000,
          currentCount: 850,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'موقع مشروع الأبراج',
          type: 'project_site' as const,
          description: 'موقع العمل لمشروع الأبراج السكنية',
          address: 'جدة، المملكة العربية السعودية',
          contactPerson: 'محمد أحمد',
          phone: '+966507654321',
          capacity: 200,
          currentCount: 150,
          isActive: true,
          createdAt: '2024-02-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'شاحنة النقل #001',
          type: 'vehicle' as const,
          description: 'شاحنة نقل الأدوات والمعدات',
          contactPerson: 'عبدالله سالم',
          phone: '+966509876543',
          capacity: 50,
          currentCount: 25,
          isActive: true,
          createdAt: '2024-01-15T00:00:00Z'
        }
      ];
    }
  });

  // جلب الأدوات
  const { data: tools = [] } = useQuery({
    queryKey: ['/api/tools'],
    queryFn: () => apiRequest('/api/tools', 'GET')
  });

  // جلب سجل الحركات
  const { data: movements = [] } = useQuery({
    queryKey: ['/api/tool-movements/history'],
    queryFn: async () => {
      // محاكاة البيانات
      return [
        {
          id: '1',
          toolId: '35ae07b1-f54e-405a-b435-1029101b5e6d',
          toolName: 'مطرقة كهربائية تجريبية',
          fromLocationId: '1',
          fromLocationName: 'المستودع الرئيسي',
          toLocationId: '2',
          toLocationName: 'موقع مشروع الأبراج',
          movementType: 'checkout' as const,
          reason: 'نقل للاستخدام في الموقع',
          movedBy: 'user1',
          movedByName: 'أحمد محمد',
          notes: 'تم النقل بحالة جيدة',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ] as ToolMovement[];
    }
  });

  // إنشاء حركة جديدة للأداة
  const moveMutation = useMutation({
    mutationFn: async (moveData: {
      toolId: string;
      toLocationId: string;
      movementType: string;
      reason?: string;
      notes?: string;
    }) => {
      // في التطبيق الحقيقي، سيتم إرسال البيانات للخادم
      console.log('Moving tool:', moveData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tool-movements/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      setIsDialogOpen(false);
      toast({
        title: 'تم نقل الأداة',
        description: 'تم تسجيل حركة الأداة بنجاح',
      });
    }
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Package className="h-4 w-4" />;
      case 'project_site': return <Building className="h-4 w-4" />;
      case 'vehicle': return <Truck className="h-4 w-4" />;
      case 'office': return <Home className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer': return 'نقل';
      case 'checkout': return 'إخراج';
      case 'checkin': return 'إدخال';
      case 'maintenance': return 'صيانة';
      case 'return': return 'إرجاع';
      default: return type;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'warehouse': return 'مستودع';
      case 'project_site': return 'موقع مشروع';
      case 'vehicle': return 'مركبة';
      case 'office': return 'مكتب';
      case 'external': return 'خارجي';
      default: return type;
    }
  };

  const handleMove = () => {
    if (!selectedToolId || !selectedLocationId) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى اختيار الأداة والموقع المطلوب',
        variant: 'destructive',
      });
      return;
    }

    moveMutation.mutate({
      toolId: selectedToolId,
      toLocationId: selectedLocationId,
      movementType,
    });
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">تتبع مواقع الأدوات</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة وتتبع مواقع الأدوات والمعدات
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              نقل أداة
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                نقل أداة إلى موقع جديد
              </DialogTitle>
              <DialogDescription>
                اختر الأداة والموقع المطلوب نقلها إليه
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* اختيار الأداة */}
              <div>
                <Label>الأداة المراد نقلها</Label>
                <Select value={selectedToolId} onValueChange={setSelectedToolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأداة" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((tool: any) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اختيار الموقع الجديد */}
              <div>
                <Label>الموقع الجديد</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموقع" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          {getLocationIcon(location.type)}
                          {location.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* نوع الحركة */}
              <div>
                <Label>نوع الحركة</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">نقل داخلي</SelectItem>
                    <SelectItem value="checkout">إخراج للاستخدام</SelectItem>
                    <SelectItem value="checkin">إدخال من الاستخدام</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="return">إرجاع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleMove} disabled={moveMutation.isPending} className="flex-1">
                  {moveMutation.isPending ? 'جاري النقل...' : 'نقل الأداة'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={activeTab === 'locations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('locations')}
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-blue-500"
        >
          <MapPin className="h-4 w-4 ml-1" />
          المواقع
        </Button>
        <Button
          variant={activeTab === 'movements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('movements')}
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-blue-500"
        >
          <Clock className="h-4 w-4 ml-1" />
          سجل الحركات
        </Button>
      </div>

      {activeTab === 'locations' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="ابحث عن المواقع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getLocationIcon(location.type)}
                      {location.name}
                    </CardTitle>
                    <Badge variant="outline">
                      {getLocationTypeLabel(location.type)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {location.description}
                  </p>
                  
                  {location.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {location.address}
                    </div>
                  )}
                  
                  {location.contactPerson && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-gray-400" />
                      {location.contactPerson}
                      {location.phone && ` • ${location.phone}`}
                    </div>
                  )}
                  
                  {location.capacity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        السعة:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{
                              width: `${((location.currentCount || 0) / location.capacity) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {location.currentCount}/{location.capacity}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      {location.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {location.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              سجل حركات الأدوات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الأداة</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>نوع الحركة</TableHead>
                  <TableHead>المسؤول</TableHead>
                  <TableHead>التوقيت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {movement.toolName}
                    </TableCell>
                    <TableCell>
                      {movement.fromLocationName || '-'}
                    </TableCell>
                    <TableCell>
                      {movement.toLocationName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getMovementTypeLabel(movement.movementType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.movedByName || movement.movedBy}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(movement.timestamp), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationTrackingSystem;