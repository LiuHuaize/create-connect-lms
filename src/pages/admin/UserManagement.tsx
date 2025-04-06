import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Shield, 
  BookOpen, 
  Users, 
  ChevronDown, 
  User, 
  Search,
  UserCog
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type User = {
  id: string;
  username: string;
  currentRole: string;
};

// Define role type to match the database enum
type UserRole = 'student' | 'teacher' | 'admin';

// Define role configuration for visual elements
const roleConfig = {
  admin: { icon: Shield, color: 'text-red-600 bg-red-100', label: '管理员' },
  teacher: { icon: BookOpen, color: 'text-blue-600 bg-blue-100', label: '教师' },
  student: { icon: User, color: 'text-green-600 bg-green-100', label: '学生' },
};

// 获取所有用户数据
const fetchUsers = async () => {
  // 获取所有用户资料
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  // 获取所有角色数据
  const { data: allRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  // 合并数据
  return profiles.map(profile => {
    const userRoleRecord = allRoles.find((r: any) => r.user_id === profile.id);
    return {
      id: profile.id,
      username: profile.username,
      currentRole: userRoleRecord?.role || 'student', // 如果没有分配角色，默认为学生
    };
  });
};

// 更新用户角色
const updateUserRoleAPI = async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
  // 检查用户是否已有角色
  const { data: existingRole, error: checkError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (checkError) {
    throw new Error(checkError.message);
  }

  let result;
  if (existingRole && existingRole.length > 0) {
    // 更新现有角色
    result = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);
  } else {
    // 插入新角色
    result = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { userId, newRole };
};

const UserManagement = () => {
  const { role, user, refreshUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast: useToastNotify } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // 重定向非管理员用户
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/dashboard');
      useToastNotify({
        title: "无权限",
        description: "您没有访问此页面的权限",
        variant: "destructive",
      });
    }
  }, [role, navigate, useToastNotify]);

  // 使用React Query获取用户数据
  const { 
    data: users = [], 
    isLoading: loading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: role === 'admin',
    staleTime: 5 * 60 * 1000, // 5分钟内数据保持新鲜
    retry: 1,
  });

  // 刷新当前用户角色的mutation
  const refreshRoleMutation = useMutation({
    mutationFn: refreshUserRole,
    onSuccess: () => {
      toast.success("角色已刷新", {
        description: "您的角色权限已更新"
      });
    },
  });

  // 更新用户角色的mutation
  const updateRoleMutation = useMutation({
    mutationFn: updateUserRoleAPI,
    onSuccess: (data) => {
      toast.success("角色更新成功", {
        description: `用户角色已更新为${roleConfig[data.newRole].label}`
      });
      
      // 更新查询缓存
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      
      // 如果更新的是当前用户的角色，刷新角色
      if (data.userId === user?.id) {
        refreshUserRole();
      }
    },
    onError: (error) => {
      toast.error("更新角色失败", {
        description: error instanceof Error ? error.message : "请重试"
      });
    },
  });

  // 处理刷新角色按钮点击
  const handleRefreshRole = () => {
    refreshRoleMutation.mutate();
  };

  // 处理更新用户角色
  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  // 过滤用户列表
  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="bg-white shadow-md border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl md:text-2xl font-bold">用户管理</CardTitle>
            </div>
            <CardDescription className="mt-1 text-gray-600">管理平台用户的角色和权限</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="搜索用户..." 
                className="pl-9 w-full sm:w-64 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleRefreshRole} 
              variant="outline" 
              size="sm"
              className="transition-all duration-200 hover:bg-blue-50"
              disabled={refreshRoleMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshRoleMutation.isPending ? "animate-spin" : ""}`} />
              刷新我的角色
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">正在加载用户数据...</p>
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">没有找到匹配的用户</p>
                  {searchQuery && (
                    <p className="text-gray-400 text-sm mt-1">尝试使用其他搜索词</p>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table className="w-full">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-1/3 font-semibold">用户名</TableHead>
                        <TableHead className="w-1/3 font-semibold">当前角色</TableHead>
                        <TableHead className="w-1/3 font-semibold">角色管理</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const RoleIcon = roleConfig[user.currentRole as keyof typeof roleConfig]?.icon || User;
                        const roleColor = roleConfig[user.currentRole as keyof typeof roleConfig]?.color || 'text-gray-500 bg-gray-100';
                        const roleLabel = roleConfig[user.currentRole as keyof typeof roleConfig]?.label || user.currentRole;
                        
                        return (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${roleColor}`}>
                                  <RoleIcon size={14} />
                                </div>
                                <span>{roleLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    className="flex items-center justify-between w-40 bg-white hover:bg-gray-50"
                                    disabled={updateRoleMutation.isPending}
                                  >
                                    <div className="flex items-center gap-2">
                                      <RoleIcon size={16} className={roleColor.split(' ')[0]} />
                                      <span>{roleLabel}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 border border-gray-100">
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => handleUpdateUserRole(user.id, 'student')}
                                  >
                                    <User size={16} className="text-green-600" />
                                    <span>学生</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => handleUpdateUserRole(user.id, 'teacher')}
                                  >
                                    <BookOpen size={16} className="text-blue-600" />
                                    <span>教师</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => handleUpdateUserRole(user.id, 'admin')}
                                  >
                                    <Shield size={16} className="text-red-600" />
                                    <span>管理员</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:bg-blue-50"
                  onClick={() => refetchUsers()}
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  刷新用户列表
                </Button>
                <p className="text-sm text-gray-500">共 {filteredUsers.length} 名用户</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
