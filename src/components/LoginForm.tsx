import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { blogAPI } from '@/services/api';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Set credentials
      blogAPI.setCredentials(username, password);
      
      // Test credentials by making an admin request
      // This will throw an error if credentials are wrong
      await blogAPI.verifyAuth();
      
      // If successful, call onSuccess
      onSuccess();
    } catch (err: any) {
      if (err.message === 'Authentication required' || err.message.includes('401')) {
        setError('Неверный логин или пароль');
      } else {
        setError('Ошибка подключения к серверу');
      }
      blogAPI.clearCredentials();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Icon name="Rocket" size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Поехали!</h1>
          <p className="text-gray-600">Админская панель блога</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Вход в систему</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Логин
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  required
                  autoFocus
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <Icon name="AlertCircle" size={16} className="text-red-500" />
                  <AlertDescription className="text-red-700 ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Проверяем доступ...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" size={16} className="mr-2" />
                    Войти
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500">
                Тестовые данные: admin / password
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}