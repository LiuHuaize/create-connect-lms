
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserProfile: React.FC = () => {
  const { user, signOut, role } = useAuth();
  
  // 从邮箱中提取用户名
  const username = user?.email?.split('@')[0] || '用户';
  
  // 基于用户名生成头像的背景颜色和文本
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
  };

  // 角色的中文标签
  const roleLabel = {
    'admin': '管理员',
    'teacher': '教师',
    'student': '学生'
  }[role || 'student'];

  return (
    <div className="p-4 border-t border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors w-full">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={username} />
              <AvatarFallback className="bg-blue-100 text-blue-800">{getInitials(username)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">{username}</span>
              <span className="text-gray-500 text-xs">{roleLabel}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>我的账户</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
