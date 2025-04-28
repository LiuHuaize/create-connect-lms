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
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="space-y-2 text-center pb-2">
        <CardTitle className="text-3xl font-bold text-ghibli-brown font-serif tracking-wide">创建账户</CardTitle>
        <CardDescription className="text-ghibli-lightBrown italic">
          输入您的用户名和密码注册新账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-ghibli-darkBrown font-medium">用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-ghibli-teal" />
                <Input
                  id="username"
                  placeholder="选择一个用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-ghibli-sand bg-ghibli-cream focus:border-ghibli-teal focus:ring focus:ring-ghibli-lightTeal transition-all rounded-md"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ghibli-darkBrown font-medium">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-ghibli-teal" />
                <Input
                  id="password"
                  type="password"
                  placeholder="设置一个安全的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-ghibli-sand bg-ghibli-cream focus:border-ghibli-teal focus:ring focus:ring-ghibli-lightTeal transition-all rounded-md"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-ghibli-lavender hover:bg-ghibli-deepTeal text-white transition-colors duration-300 rounded-md shadow-md hover:shadow-lg transform hover:-translate-y-1 font-medium border-2 border-ghibli-lightTeal" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                创建账户中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                注册
                <UserPlus className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <div className="text-center text-sm text-ghibli-brown">
          已有账户？{" "}
          <button 
            onClick={onToggle} 
            className="text-ghibli-deepTeal hover:text-ghibli-teal underline font-medium transition-colors" 
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
