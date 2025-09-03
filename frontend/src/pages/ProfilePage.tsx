import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Mail, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { TelegramPageWrapper } from '@/components/ui/telegram-page-wrapper';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { createApiUrl } from '@/lib/config';

interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
  email?: string;
  language?: string;
}

export function ProfilePage() {
  const { t } = useAppTranslation();
  const { navigateTo } = useTelegramNavigation();
  const { telegramUser, setTelegramUser, userId, setUserId } = useAppStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Загружаем профиль пользователя
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(createApiUrl(`/api/user/${userId}`));
        if (response.ok) {
          const userData = await response.json();
          setProfile(userData);
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            email: userData.email || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(createApiUrl(`/api/user/${userId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Очищаем все данные пользователя
    setTelegramUser(null);
    setUserId(0);
    setProfile(null);
    
    // Очищаем данные из localStorage
    localStorage.removeItem('Super Mock-storage');
    localStorage.removeItem('telegram_user');
    
    // Устанавливаем флаги выхода
    sessionStorage.setItem('just_logged_out', 'true');
    sessionStorage.setItem('logout_timestamp', Date.now().toString());
    
    // Перенаправляем на главную
    navigateTo('/');
  };

  const displayName = profile?.firstName || telegramUser?.first_name || '';
  const displayUsername = profile?.username || telegramUser?.username || '';
  const displayPhoto = telegramUser?.photo_url;

  if (isLoading) {
    return (
      <TelegramPageWrapper title="Профиль">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      </TelegramPageWrapper>
    );
  }

  return (
    <TelegramPageWrapper title="Профиль" showBackButton={true}>
      <div className="p-4 space-y-6">
        {/* Заголовок профиля */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={displayPhoto} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{displayName || 'Пользователь'}</CardTitle>
            {displayUsername && (
              <CardDescription>@{displayUsername}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Форма редактирования */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isEditing ? 'Редактировать профиль' : 'Информация профиля'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Введите имя"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Введите фамилию"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {profile?.firstName} {profile?.lastName}
                    </span>
                  </div>
                  
                  {profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{profile.email}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  Редактировать
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Кнопка выхода */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </CardContent>
        </Card>
      </div>
    </TelegramPageWrapper>
  );
}
