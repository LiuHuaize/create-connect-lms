
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          type="email" 
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input 
          type="password" 
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
      </div>
      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
};

export default Login;
