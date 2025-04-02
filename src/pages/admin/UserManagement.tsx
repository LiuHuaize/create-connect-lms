
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

const UserManagement = () => {
  const { role, user, refreshUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-admin users
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/dashboard');
      toast({
        title: "无权限",
        description: "您没有访问此页面的权限",
        variant: "destructive",
      });
    }
  }, [role, navigate, toast]);

  // Fetch all users and their roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // Use raw SQL to get all roles as the TypeScript definitions don't match
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw new Error(rolesError.message);
      }

      // Combine the data
      const combinedData = profiles.map(profile => {
        // Find the role record for this user
        const userRoleRecord = allRoles.find((r: any) => r.user_id === profile.id);
        return {
          id: profile.id,
          username: profile.username,
          currentRole: userRoleRecord?.role || 'student', // Default to student if no role assigned
        };
      });

      setUsers(combinedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "获取用户数据失败",
        description: "请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  // Refresh the role of the current user
  const handleRefreshRole = async () => {
    setRefreshing(true);
    await refreshUserRole();
    toast({
      title: "角色已刷新",
      description: "您的角色权限已更新"
    });
    setRefreshing(false);
  };

  // Update user role using raw SQL to avoid type issues
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Check if user already has a role
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (checkError) {
        throw new Error(checkError.message);
      }

      let result;
      if (existingRole && existingRole.length > 0) {
        // Update existing role using raw SQL
        result = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
      } else {
        // Insert new role
        result = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // If updating the current user's role, refresh the role in context
      if (userId === user?.id) {
        await refreshUserRole();
      }

      toast({
        title: "角色更新成功",
        description: `用户角色已更新为${roleConfig[newRole].label}`,
      });

      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "更新角色失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  // Filter users by search query
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-connect-blue/10 to-connect-purple/10 rounded-t-lg border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-connect-blue" />
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
              className="transition-all duration-200 hover:bg-connect-blue/10"
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              刷新我的角色
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-10 w-10 text-connect-blue animate-spin mb-4" />
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
                <div className="overflow-hidden rounded-lg border border-gray-100">
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
                          <TableRow key={user.id} className="hover:bg-gray-50/50">
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
                                  >
                                    <div className="flex items-center gap-2">
                                      <RoleIcon size={16} className={roleColor.split(' ')[0]} />
                                      <span>{roleLabel}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-white shadow-lg border border-gray-100">
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => updateUserRole(user.id, 'student')}
                                  >
                                    <User size={16} className="text-green-600" />
                                    <span>学生</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => updateUserRole(user.id, 'teacher')}
                                  >
                                    <BookOpen size={16} className="text-blue-600" />
                                    <span>教师</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => updateUserRole(user.id, 'admin')}
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
              <p className="text-sm text-gray-500 mt-4 text-right">共 {filteredUsers.length} 名用户</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
