
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type User = {
  id: string;
  username: string;
  currentRole: string;
};

const UserManagement = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Update user role using raw SQL to avoid type issues
  const updateUserRole = async (userId: string, newRole: string) => {
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
        // Insert new role using raw SQL
        result = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole }]);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "角色更新成功",
        description: "用户角色已成功更新",
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>管理用户角色和权限</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>当前角色</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.currentRole === 'student' ? '学生' : user.currentRole === 'teacher' ? '教师' : '管理员'}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.currentRole}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="student">学生</SelectItem>
                            <SelectItem value="teacher">教师</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
