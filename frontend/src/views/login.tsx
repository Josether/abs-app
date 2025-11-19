"use client";

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

interface LoginPageProps {
  onLogin: (username: string, role: "admin" | "viewer") => void;
}

interface LoginResponse {
  access_token: string;
  username: string;
  role: "admin" | "viewer";
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPost<{ username: string; password: string }, LoginResponse>(
        '/login',
        { username, password },
        false // no auth needed for login
      );
      
      // Store token and user info for API calls and protected routes
      localStorage.setItem('abs_token', response.access_token);
      localStorage.setItem('abs_user', JSON.stringify({ username: response.username, role: response.role }));
      
      // Notify parent component
      onLogin(response.username, response.role);
      
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-center text-gray-900 mb-2">🔒 Login</h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            Automated Backup System
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Default credentials:</p>
            <p className="text-xs text-gray-500">Admin: admin / admin123</p>
            <p className="text-xs text-gray-500">Viewer: viewer / viewer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
