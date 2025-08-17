import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Building, 
  Package, 
  Search,
  Clock,
  Construction,
  Warehouse,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface Tool {
  id: string;
  name: string;
  locationType: string;
  locationId?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
}

interface ToolMovement {
  id: string;
  toolId: string;
  toolName: string;
  fromLocationId?: string;
  toLocationId: string;
  movementType: 'transfer' | 'checkout' | 'checkin' | 'maintenance' | 'return';
  timestamp: string;
}

const ProjectLocationTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'tools' | 'movements'>('projects');

  // جلب المشاريع من قاعدة البيانات الموجودة
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // جلب الأدوات من قاعدة البيانات
  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ['/api/tools'],
  });

  // جلب سجل حركات الأدوات
  const { data: movements = [] } = useQuery<ToolMovement[]>({
    queryKey: ['/api/tool-movements'],
  });

  // فلترة المشاريع حسب البحث
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // إحصائيات الأدوات لكل مشروع
  const getProjectToolStats = (projectId: string) => {
    const projectTools = tools.filter(tool => tool.locationId === projectId);
    return {
      total: projectTools.length,
      available: projectTools.filter(tool => tool.status === 'available').length,
      inUse: projectTools.filter(tool => tool.status === 'in_use').length,
      maintenance: projectTools.filter(tool => tool.status === 'maintenance').length,
    };
  };

  // الحصول على أيقونة حالة المشروع
  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'on_hold':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // الحصول على نص حالة المشروع
  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'on_hold': return 'متوقف';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            تتبع مواقع المشاريع والأدوات
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            تتبع توزيع الأدوات عبر مواقع المشاريع المختلفة
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={activeTab === 'projects' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('projects')}
          className="rounded-none border-b-2 border-transparent"
        >
          <Construction className="h-4 w-4 ml-1" />
          مواقع المشاريع
        </Button>
        <Button
          variant={activeTab === 'tools' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tools')}
          className="rounded-none border-b-2 border-transparent"
        >
          <Package className="h-4 w-4 ml-1" />
          توزيع الأدوات
        </Button>
        <Button
          variant={activeTab === 'movements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('movements')}
          className="rounded-none border-b-2 border-transparent"
        >
          <Clock className="h-4 w-4 ml-1" />
          سجل النقل
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="ابحث في المشاريع والمواقع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const stats = getProjectToolStats(project.id);
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Construction className="h-5 w-5 text-blue-600" />
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getProjectStatusIcon(project.status)}
                      <Badge variant="outline">
                        {getProjectStatusText(project.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{project.location}</span>
                    </div>
                  )}

                  {/* إحصائيات الأدوات */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      الأدوات في هذا الموقع
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">المجموع:</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">متاح:</span>
                        <span className="font-medium text-green-600">{stats.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">قيد الاستخدام:</span>
                        <span className="font-medium text-blue-600">{stats.inUse}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">صيانة:</span>
                        <span className="font-medium text-yellow-600">{stats.maintenance}</span>
                      </div>
                    </div>
                  </div>

                  {project.startDate && (
                    <div className="text-xs text-gray-500">
                      بدأ في: {new Date(project.startDate).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'tools' && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع الأدوات حسب المواقع</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الأداة</TableHead>
                  <TableHead className="text-right">الموقع الحالي</TableHead>
                  <TableHead className="text-right">نوع الموقع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => {
                  const project = projects.find(p => p.id === tool.locationId);
                  return (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>
                        {project ? project.name : tool.locationType}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {project ? (
                            <Construction className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Warehouse className="h-4 w-4 text-gray-500" />
                          )}
                          {project ? 'موقع مشروع' : tool.locationType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          tool.status === 'available' ? 'default' :
                          tool.status === 'in_use' ? 'secondary' :
                          tool.status === 'maintenance' ? 'destructive' : 'outline'
                        }>
                          {tool.status === 'available' ? 'متاح' :
                           tool.status === 'in_use' ? 'قيد الاستخدام' :
                           tool.status === 'maintenance' ? 'صيانة' :
                           tool.status === 'damaged' ? 'معطل' : 'متقاعد'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>سجل نقل الأدوات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الأداة</TableHead>
                  <TableHead className="text-right">من</TableHead>
                  <TableHead className="text-right">إلى</TableHead>
                  <TableHead className="text-right">نوع الحركة</TableHead>
                  <TableHead className="text-right">التوقيت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const fromProject = projects.find(p => p.id === movement.fromLocationId);
                  const toProject = projects.find(p => p.id === movement.toLocationId);
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.toolName}</TableCell>
                      <TableCell>{fromProject?.name || 'غير محدد'}</TableCell>
                      <TableCell>{toProject?.name || 'غير محدد'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {movement.movementType === 'transfer' ? 'نقل' :
                           movement.movementType === 'checkout' ? 'إخراج' :
                           movement.movementType === 'checkin' ? 'إدخال' :
                           movement.movementType === 'maintenance' ? 'صيانة' : 'إرجاع'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(movement.timestamp), {
                          addSuffix: true,
                          locale: ar
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectLocationTracking;