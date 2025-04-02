
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserWithRole = {
  id: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
}

const UserManagement = () => {
  const { userRole, loading: authLoading, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      toast({
        title: "访问被拒绝",
        description: "您没有权限访问此页面",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [userRole, authLoading, navigate, toast]);

  // Fetch users and their roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get profiles (which has usernames)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username');

        if (profilesError) throw profilesError;

        // Get user_roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        // Combine data
        const combinedUsers = profiles.map(profile => {
          const userRole = roles.find(r => r.user_id === profile.id)?.role || 'student';
          return {
            id: profile.id,
            username: profile.username,
            role: userRole
          };
        });

        setUsers(combinedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "获取用户失败",
          description: "加载用户数据时发生错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole, toast]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    try {
      setUpdatingUser(userId);
      
      // First check if entry exists already
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', newRole)
        .single();

      if (existingRole) {
        toast({
          title: "无需更新",
          description: "用户已经拥有该角色",
        });
        return;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: "角色已更新",
        description: `用户角色已更改为${
          newRole === 'admin' ? '管理员' : 
          newRole === 'teacher' ? '教师' : '学生'
        }`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "更新失败",
        description: "无法更新用户角色",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">正在加载...</span>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null; // Redirect happens in useEffect
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">用户管理</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>所有用户</CardTitle>
          <CardDescription>管理用户角色和权限</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">加载用户中...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>当前角色</TableHead>
                  <TableHead>更改角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                          <User size={16} />
                        </div>
                        <span>{user.username}</span>
                        {currentUser?.id === user.id && <span className="ml-2 text-xs text-muted-foreground">(当前用户)</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Shield size={16} className="mr-2" />
                        {user.role === 'admin' && "管理员"}
                        {user.role === 'teacher' && "教师"}
                        {user.role === 'student' && "学生"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {updatingUser === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value: 'student' | 'teacher' | 'admin') => {
                            if (value !== user.role) {
                              updateUserRole(user.id, value);
                            }
                          }}
                          disabled={currentUser?.id === user.id} // Prevent changing own role
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">学生</SelectItem>
                            <SelectItem value="teacher">教师</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
