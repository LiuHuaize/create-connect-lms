import { useEffect, useState } from 'react';
import { deleteTrashItemPermanently, getTrashItems, restoreTrashItem, TrashItem } from '@/services/trashService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const items = await getTrashItems();
      setTrashItems(items);
    } catch (error) {
      console.error('获取回收站项目失败', error);
      toast({
        title: '获取回收站项目失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      const success = await restoreTrashItem(id);
      if (success) {
        setTrashItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('恢复项目失败', error);
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要永久删除此项目吗？此操作无法撤销。')) return;
    
    setDeleting(id);
    try {
      const success = await deleteTrashItemPermanently(id);
      if (success) {
        setTrashItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('永久删除项目失败', error);
    } finally {
      setDeleting(null);
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return '课程';
      case 'module': return '模块';
      case 'lesson': return '课时';
      default: return type;
    }
  };

  return (
    <Card className="w-full m-4">
      <CardHeader>
        <CardTitle>回收站</CardTitle>
        <CardDescription>
          已删除的项目将在这里保留7天，之后将被自动永久删除
        </CardDescription>
        <Button 
          variant="outline" 
          onClick={fetchTrashItems} 
          disabled={loading}
          className="ml-auto"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : trashItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            回收站中没有项目
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>删除时间</TableHead>
                <TableHead>过期时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trashItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{getItemTypeLabel(item.item_type)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(item.deleted_at), { 
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(item.expires_at), { 
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      disabled={restoring === item.id}
                    >
                      {restoring === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      恢复
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 