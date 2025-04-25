import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import indexedDBCache from '@/lib/indexedDBCache';
import { UserAuthWrapper } from '@/components/auth/UserAuthWrapper';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';

interface CacheStats {
  courseCount: number;
  enrollmentCount: number;
  estimatedSizeKB: number;
  timestamp: number;
}

export default function CacheManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);

  // 加载缓存统计信息
  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const cacheStats = await indexedDBCache.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('加载缓存统计失败:', error);
      toast({
        title: '加载失败',
        description: '无法获取缓存统计信息',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 清除过期缓存
  const handleClearExpired = async () => {
    try {
      setRefreshing(true);
      await indexedDBCache.clearExpiredCache();
      toast({
        title: '清理完成',
        description: '已成功清理过期缓存',
      });
      await loadCacheStats();
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      toast({
        title: '操作失败',
        description: '清理过期缓存时发生错误',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 清除所有缓存
  const handleClearAll = async () => {
    try {
      setRefreshing(true);
      await indexedDBCache.clearAllCache();
      toast({
        title: '清理完成',
        description: '已成功清理所有缓存',
      });
      await loadCacheStats();
    } catch (error) {
      console.error('清理所有缓存失败:', error);
      toast({
        title: '操作失败',
        description: '清理所有缓存时发生错误',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 刷新统计信息
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCacheStats();
      toast({
        title: '刷新完成',
        description: '缓存统计信息已更新',
      });
    } catch (error) {
      console.error('刷新缓存统计失败:', error);
      toast({
        title: '刷新失败',
        description: '无法更新缓存统计信息',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 组件加载时获取统计信息
  useEffect(() => {
    loadCacheStats();
  }, []);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <UserAuthWrapper requiredRole="admin">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">应用缓存管理</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>缓存统计</CardTitle>
              <CardDescription>
                IndexedDB 缓存使用情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">课程缓存数</p>
                      <h3 className="text-2xl font-bold">{stats?.courseCount || 0}</h3>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">注册信息缓存数</p>
                      <h3 className="text-2xl font-bold">{stats?.enrollmentCount || 0}</h3>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">估计缓存大小</p>
                      <h3 className="text-2xl font-bold">{stats?.estimatedSizeKB || 0} KB</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-6">
                    上次更新时间: {stats ? formatTime(stats.timestamp) : '未知'}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      刷新统计
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={handleClearExpired}
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      清除过期缓存
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleClearAll}
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      清除所有缓存
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>IndexedDB缓存说明</CardTitle>
              <CardDescription>
                优化课程加载和离线访问
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <ul>
                <li>系统使用IndexedDB存储课程和注册信息，相比localStorage有更大的存储空间和更好的性能</li>
                <li>课程详情缓存有效期为5分钟，过期后将自动从服务器获取新数据</li>
                <li>系统会每10分钟自动清理过期缓存</li>
                <li>缓存大小限制为10MB，超过此限制的数据不会被缓存</li>
                <li>课程更新后可能需要手动清除缓存以获取最新内容</li>
              </ul>
              <p>
                <strong>注意:</strong> 清除所有缓存后，用户将需要重新从服务器加载课程数据，可能导致短暂的加载延迟。建议在非高峰时段执行此操作。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthWrapper>
  );
} 