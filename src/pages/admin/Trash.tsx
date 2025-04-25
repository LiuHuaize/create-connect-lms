import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { courseService } from '@/services/courseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrashItem {
  id: string;
  item_id: string;
  item_type: 'course' | 'module' | 'lesson';
  item_name: string;
  deleted_at: string;
  deleted_by: string;
  course_id: string;
  expires_at: string;
  metadata: any;
}

const TypeColors = {
  course: 'bg-red-100 text-red-800',
  module: 'bg-blue-100 text-blue-800',
  lesson: 'bg-green-100 text-green-800'
};

const TypeLabels = {
  course: '课程',
  module: '模块',
  lesson: '课时'
};

export default function TrashPage() {
  const router = useRouter();
  const { user } = useUser();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 获取回收站项目
  useEffect(() => {
    const fetchTrashItems = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const items = await courseService.getTrashItems(user.id);
        setTrashItems(items);
      } catch (error) {
        console.error('获取回收站项目失败:', error);
        toast.error('获取回收站项目失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrashItems();
  }, [user?.id]);
  
  // 筛选项目
  const filteredItems = trashItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.item_type === activeTab;
  });
  
  // 恢复项目
  const handleRestore = async (itemId: string) => {
    try {
      setIsRestoring(true);
      await courseService.restoreItem(itemId);
      
      // 移除恢复的项目
      setTrashItems(trashItems.filter(item => item.item_id !== itemId));
      toast.success('项目已成功恢复');
    } catch (error) {
      console.error('恢复项目失败:', error);
      toast.error('恢复项目失败');
    } finally {
      setIsRestoring(false);
    }
  };
  
  // 永久删除项目
  const handlePermanentDelete = async (itemId: string) => {
    try {
      setIsDeleting(true);
      await courseService.permanentlyDeleteItem(itemId);
      
      // 移除删除的项目
      setTrashItems(trashItems.filter(item => item.item_id !== itemId));
      toast.success('项目已永久删除');
    } catch (error) {
      console.error('永久删除项目失败:', error);
      toast.error('永久删除项目失败');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 格式化过期时间
  const formatExpiryTime = (expiryDate: string) => {
    try {
      const expiryTime = new Date(expiryDate);
      return formatDistanceToNow(expiryTime, { addSuffix: true, locale: zhCN });
    } catch (e) {
      return '未知';
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>请先登录</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">回收站</h1>
          <p className="text-sm text-gray-500">删除的内容将保留 30 天，之后会被自动清理</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          返回
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="course">课程</TabsTrigger>
          <TabsTrigger value="module">模块</TabsTrigger>
          <TabsTrigger value="lesson">课时</TabsTrigger>
        </TabsList>
        
        <div className="my-4">
          {selectedItems.size > 0 && (
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedItems(new Set())}
              >
                取消选择 ({selectedItems.size})
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Spinner className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    永久删除选中项
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认永久删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      您确定要永久删除这 {selectedItems.size} 个项目吗？此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          setIsDeleting(true);
                          for (const itemId of selectedItems) {
                            await courseService.permanentlyDeleteItem(itemId);
                          }
                          setTrashItems(trashItems.filter(item => !selectedItems.has(item.item_id)));
                          setSelectedItems(new Set());
                          toast.success('所选项目已永久删除');
                        } catch (error) {
                          console.error('批量删除失败:', error);
                          toast.error('批量删除失败');
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="default" 
                size="sm"
                disabled={isRestoring}
                onClick={async () => {
                  try {
                    setIsRestoring(true);
                    for (const itemId of selectedItems) {
                      await courseService.restoreItem(itemId);
                    }
                    setTrashItems(trashItems.filter(item => !selectedItems.has(item.item_id)));
                    setSelectedItems(new Set());
                    toast.success('所选项目已恢复');
                  } catch (error) {
                    console.error('批量恢复失败:', error);
                    toast.error('批量恢复失败');
                  } finally {
                    setIsRestoring(false);
                  }
                }}
              >
                {isRestoring ? <Spinner className="mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                恢复选中项
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">回收站为空</h3>
              <p className="text-sm text-gray-500 mt-2">
                {activeTab === 'all' 
                  ? '回收站中没有任何已删除的项目' 
                  : `回收站中没有已删除的${TypeLabels[activeTab as keyof typeof TypeLabels]}`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <input 
                      type="checkbox" 
                      className="h-5 w-5 rounded border-gray-300"
                      checked={selectedItems.has(item.item_id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems);
                        if (e.target.checked) {
                          newSelected.add(item.item_id);
                        } else {
                          newSelected.delete(item.item_id);
                        }
                        setSelectedItems(newSelected);
                      }}
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge className={TypeColors[item.item_type]}>
                        {TypeLabels[item.item_type]}
                      </Badge>
                      <CardTitle className="text-base line-clamp-1">{item.item_name}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      删除于 {new Date(item.deleted_at).toLocaleString('zh-CN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      {item.item_type === 'module' && item.metadata?.lessons_count > 0 && (
                        <p>包含 {item.metadata.lessons_count} 个课时</p>
                      )}
                      {item.item_type === 'lesson' && item.metadata?.module_title && (
                        <p>所属模块: {item.metadata.module_title}</p>
                      )}
                      <p className="text-amber-600">
                        {item.expires_at && `将在${formatExpiryTime(item.expires_at)}后永久删除`}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isDeleting}
                        >
                          永久删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认永久删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定要永久删除「{item.item_name}」吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(item.item_id)}
                          >
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      variant="default" 
                      size="sm"
                      disabled={isRestoring}
                      onClick={() => handleRestore(item.item_id)}
                    >
                      恢复
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 