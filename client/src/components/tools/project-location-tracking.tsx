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
  projectId?: string;
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
    // البحث عن الأدوات المرتبطة بالمشروع باستخدام projectId أو locationId عندما locationType = 'project'
    const projectTools = tools.filter(tool => 
      tool.projectId === projectId || 
      (tool.locationType === 'project' && tool.locationId === projectId) ||
      (tool.locationType === 'مشروع' && tool.locationId === projectId)
    );
    
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
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1">
        <Button
          variant={activeTab === 'projects' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('projects')}
          className="rounded-none border-b-2 border-transparent flex-shrink-0 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4"
          data-testid="tab-projects"
        >
          <Construction className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          مواقع المشاريع
        </Button>
        <Button
          variant={activeTab === 'tools' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tools')}
          className="rounded-none border-b-2 border-transparent flex-shrink-0 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4"
          data-testid="tab-tools"
        >
          <Package className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          توزيع الأدوات
        </Button>
        <Button
          variant={activeTab === 'movements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('movements')}
          className="rounded-none border-b-2 border-transparent flex-shrink-0 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4"
          data-testid="tab-movements"
        >
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          سجل النقل
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="ابحث في المشاريع والمواقع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 text-sm"
          data-testid="search-input"
        />
      </div>

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredProjects.map((project) => {
            const stats = getProjectToolStats(project.id);
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`project-card-${project.id}`}>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Construction className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                      {project.description && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getProjectStatusIcon(project.status)}
                      <Badge variant="outline" className="text-xs">
                        {getProjectStatusText(project.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  {project.location && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}

                  {/* إحصائيات الأدوات - عرض محسن للهاتف المحمول */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                      الأدوات في هذا الموقع
                    </h4>
                    
                    {/* Mobile: 2x2 Grid for better visibility */}
                    <div className="grid grid-cols-2 gap-2 sm:hidden">
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">المجموع</div>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.available}</div>
                        <div className="text-xs text-green-600/70 dark:text-green-400/70">متاح</div>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.inUse}</div>
                        <div className="text-xs text-orange-600/70 dark:text-orange-400/70">مستخدم</div>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-700">
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.maintenance}</div>
                        <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70">صيانة</div>
                      </div>
                    </div>
                    
                    {/* Desktop: Row layout */}
                    <div className="hidden sm:grid sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">المجموع:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">متاح:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">مستخدم:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.inUse}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">صيانة:</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.maintenance}</span>
                      </div>
                    </div>
                  </div>

                  {project.startDate && (
                    <div className="text-xs text-gray-500">
                      بدأ في: {new Date(project.startDate).toLocaleDateString('en-US')}
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
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">توزيع الأدوات حسب المواقع</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-xs sm:text-sm min-w-[120px]">اسم الأداة</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm min-w-[100px] hidden sm:table-cell">الموقع الحالي</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm min-w-[80px] hidden md:table-cell">نوع الموقع</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm min-w-[60px]">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => {
                    const project = projects.find(p => p.id === tool.locationId);
                    return (
                      <TableRow key={tool.id} data-testid={`tool-row-${tool.id}`}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="truncate max-w-[120px]">{tool.name}</div>
                          <div className="sm:hidden text-xs text-gray-500 truncate max-w-[120px]">
                            {project ? project.name : tool.locationType}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                          <div className="truncate max-w-[100px]">
                            {project ? project.name : tool.locationType}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {project ? (
                              <Construction className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            ) : (
                              <Warehouse className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            )}
                            <span className="truncate">{project ? 'موقع مشروع' : tool.locationType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            tool.status === 'available' ? 'default' :
                            tool.status === 'in_use' ? 'secondary' :
                            tool.status === 'maintenance' ? 'destructive' : 'outline'
                          } className="text-xs">
                            {tool.status === 'available' ? 'متاح' :
                             tool.status === 'in_use' ? 'مستخدم' :
                             tool.status === 'maintenance' ? 'صيانة' :
                             tool.status === 'damaged' ? 'معطل' : 'متقاعد'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">سجل نقل الأدوات</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد عمليات نقل مسجلة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs sm:text-sm min-w-[100px]">الأداة</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm min-w-[80px] hidden sm:table-cell">من</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm min-w-[80px] hidden sm:table-cell">إلى</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm min-w-[60px]">الحركة</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm min-w-[80px] hidden md:table-cell">التوقيت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const fromProject = projects.find(p => p.id === movement.fromLocationId);
                      const toProject = projects.find(p => p.id === movement.toLocationId);
                      
                      return (
                        <TableRow key={movement.id} data-testid={`movement-row-${movement.id}`}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="truncate max-w-[100px]">{movement.toolName}</div>
                            <div className="sm:hidden text-xs text-gray-500">
                              {fromProject?.name || 'غير محدد'} → {toProject?.name || 'غير محدد'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                            <div className="truncate max-w-[80px]">{fromProject?.name || 'غير محدد'}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                            <div className="truncate max-w-[80px]">{toProject?.name || 'غير محدد'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {movement.movementType === 'transfer' ? 'نقل' :
                               movement.movementType === 'checkout' ? 'إخراج' :
                               movement.movementType === 'checkin' ? 'إدخال' :
                               movement.movementType === 'maintenance' ? 'صيانة' : 'إرجاع'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-gray-500">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectLocationTracking;