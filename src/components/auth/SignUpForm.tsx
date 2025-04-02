
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, UserPlus } from 'lucide-react';

const SignUpForm = ({ onToggle }: { onToggle: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "错误",
        description: "请输入用户名和密码",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(username, password);
      if (error) {
        toast({
          title: "注册失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "注册成功",
          description: "您的账户已成功创建",
        });
        navigate('/dashboard');
      }
    } catch (err) {
      toast({
        title: "注册失败",
        description: "发生了意外错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-3xl font-bold text-gray-800">创建账户</CardTitle>
        <CardDescription className="text-gray-500">
          输入您的用户名和密码注册新账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  placeholder="选择一个用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="设置一个安全的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300" 
            disabled={isLoading}
          >
            {isLoading ? "创建账户中..." : "注册"}
            <UserPlus className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm text-gray-600">
          已有账户？{" "}
          <button 
            onClick={onToggle} 
            className="text-blue-600 hover:underline font-medium" 
            disabled={isLoading}
          >
            立即登录
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignUpForm;
