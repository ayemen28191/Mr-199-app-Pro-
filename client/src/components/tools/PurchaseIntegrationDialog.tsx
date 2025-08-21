import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatsGrid } from "@/components/ui/stats-grid";
import { Loader2, Package, Wrench, CheckCircle, XCircle, Brain, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseIntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  purchaseName?: string;
}

interface ToolPurchaseItem {
  id: string;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isToolItem: boolean;
  suggestedCategoryId?: string;
  conversionStatus: 'pending' | 'converted' | 'skipped' | 'failed';
  toolId?: string;
  aiConfidence?: number;
  aiSuggestions?: {
    category?: string;
    confidence: number;
    reason: string;
  };
}

interface ToolCategory {
  id: string;
  name: string;
  description?: string;
}

export function PurchaseIntegrationDialog({ 
  isOpen, 
  onClose, 
  purchaseId,
  purchaseName = "فاتورة المشتريات"
}: PurchaseIntegrationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ToolPurchaseItem | null>(null);
  const [convertingItemId, setConvertingItemId] = useState<string | null>(null);

  // جلب بنود الشراء
  const { data: purchaseItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['tool-purchase-items', purchaseId],
    queryFn: async () => {
      const response = await fetch(`/api/tool-purchase-items/${purchaseId}`);
      if (!response.ok) throw new Error('خطأ في جلب بنود الشراء');
      return response.json();
    },
    enabled: isOpen && !!purchaseId,
  });

  // جلب تصنيفات الأدوات
  const { data: categories = [] } = useQuery({
    queryKey: ['tool-categories'],
    queryFn: async () => {
      const response = await fetch('/api/tool-categories');
      if (!response.ok) throw new Error('خطأ في جلب التصنيفات');
      return response.json();
    },
  });

  // تصنيف البنود باستخدام الذكاء الاصطناعي
  const classifyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tool-purchase-items/classify/${purchaseId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('خطأ في تصنيف البنود');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التصنيف بنجاح",
        description: "تم تصنيف بنود الشراء باستخدام الذكاء الاصطناعي",
      });
      queryClient.invalidateQueries({ queryKey: ['tool-purchase-items', purchaseId] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التصنيف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // تحويل البند إلى أداة
  const convertMutation = useMutation({
    mutationFn: async ({ itemId, toolData }: { itemId: string; toolData: any }) => {
      const response = await fetch(`/api/tool-purchase-items/${itemId}/convert-to-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toolData),
      });
      if (!response.ok) throw new Error('خطأ في تحويل البند إلى أداة');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل "${data.item.itemName}" إلى أداة بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['tool-purchase-items', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedItem(null);
      setConvertingItemId(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحويل",
        description: error.message,
        variant: "destructive",
      });
      setConvertingItemId(null);
    },
  });

  const handleConvertItem = (item: ToolPurchaseItem) => {
    setConvertingItemId(item.id);
    
    const toolData = {
      name: item.itemName,
      description: item.itemDescription || '',
      categoryId: item.suggestedCategoryId || categories[0]?.id,
      unit: 'قطعة',
      purchasePrice: item.unitPrice,
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'available',
      condition: 'excellent',
      isActive: true,
    };

    convertMutation.mutate({ itemId: item.id, toolData });
  };

  const renderItemCard = (item: ToolPurchaseItem) => (
    <Card key={item.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.itemName}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={item.isToolItem ? "default" : "secondary"}>
              {item.isToolItem ? "أداة" : "مادة"}
            </Badge>
            <Badge
              variant={
                item.conversionStatus === 'converted' ? 'default' :
                item.conversionStatus === 'failed' ? 'destructive' :
                item.conversionStatus === 'skipped' ? 'outline' : 'secondary'
              }
            >
              {item.conversionStatus === 'converted' ? 'تم التحويل' :
               item.conversionStatus === 'failed' ? 'فشل' :
               item.conversionStatus === 'skipped' ? 'تم التخطي' : 'في الانتظار'}
            </Badge>
          </div>
        </div>
        {item.itemDescription && (
          <CardDescription>{item.itemDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-sm text-muted-foreground">الكمية</Label>
            <p className="font-medium">{item.quantity}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">السعر للوحدة</Label>
            <p className="font-medium">{item.unitPrice.toLocaleString('en-US')} ر.ي</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">المجموع</Label>
            <p className="font-medium">{item.totalPrice.toLocaleString('en-US')} ر.ي</p>
          </div>
        </div>

        {item.aiSuggestions && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                تحليل الذكاء الاصطناعي
              </span>
              <Badge variant="outline" className="text-xs">
                {item.aiSuggestions.confidence}% ثقة
              </Badge>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              {item.aiSuggestions.reason}
            </p>
            {item.aiSuggestions.category && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                التصنيف المقترح: {item.aiSuggestions.category}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {item.conversionStatus === 'pending' && item.isToolItem && (
            <Button
              onClick={() => handleConvertItem(item)}
              disabled={convertingItemId === item.id}
              size="sm"
            >
              {convertingItemId === item.id ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحويل...
                </>
              ) : (
                <>
                  <ArrowRight className="ml-2 h-4 w-4" />
                  تحويل إلى أداة
                </>
              )}
            </Button>
          )}
          
          {item.conversionStatus === 'converted' && (
            <Button variant="outline" size="sm" disabled>
              <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
              تم التحويل بنجاح
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(item)}
          >
            عرض التفاصيل
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const toolItems = purchaseItems.filter((item: ToolPurchaseItem) => item.isToolItem);
  const materialItems = purchaseItems.filter((item: ToolPurchaseItem) => !item.isToolItem);
  const convertedItems = purchaseItems.filter((item: ToolPurchaseItem) => item.conversionStatus === 'converted');

  if (itemsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              تكامل المشتريات - {purchaseName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-3">جاري تحميل بنود الشراء...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            تكامل المشتريات - {purchaseName}
          </DialogTitle>
        </DialogHeader>

        <StatsGrid 
          stats={[
            {
              title: "إجمالي البنود",
              value: purchaseItems.length,
              icon: Package,
              color: "purple"
            },
            {
              title: "الأدوات المكتشفة", 
              value: toolItems.length,
              icon: Wrench,
              color: "blue"
            },
            {
              title: "تم التحويل",
              value: convertedItems.length,
              icon: CheckCircle,
              color: "green"
            }
          ]}
        />

        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => classifyMutation.mutate()}
            disabled={classifyMutation.isPending}
            variant="outline"
          >
            {classifyMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التصنيف...
              </>
            ) : (
              <>
                <Brain className="ml-2 h-4 w-4" />
                تصنيف تلقائي بالذكاء الاصطناعي
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="tools" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">
              الأدوات المكتشفة ({toolItems.length})
            </TabsTrigger>
            <TabsTrigger value="materials">
              المواد ({materialItems.length})
            </TabsTrigger>
            <TabsTrigger value="converted">
              تم التحويل ({convertedItems.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[400px] overflow-y-auto">
            <TabsContent value="tools" className="mt-0">
              {toolItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم العثور على أدوات في هذه الفاتورة</p>
                  <p className="text-sm">استخدم التصنيف التلقائي لاكتشاف الأدوات</p>
                </div>
              ) : (
                <div>
                  {toolItems.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-0">
              {materialItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد مواد في هذه الفاتورة</p>
                </div>
              ) : (
                <div>
                  {materialItems.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="converted" className="mt-0">
              {convertedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم تحويل أي بنود بعد</p>
                </div>
              ) : (
                <div>
                  {convertedItems.map(renderItemCard)}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}