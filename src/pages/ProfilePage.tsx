import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Camera,
  Shield,
  Key,
  Bell
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    address: '123 Admin Street, Dashboard City, DC 12345',
    bio: 'Administrator with extensive experience in managing digital platforms and user systems.',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handlePasswordChange = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Password Updated",
      description: "Your password has been successfully changed.",
    });
    
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || 'A'
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-slate-900">{user?.name || 'Admin User'}</h3>
              <p className="text-slate-600">{user?.role || 'Administrator'}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{user?.email || 'admin@dashboard.com'}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formData.phone}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{formData.address}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
              
              <Button onClick={handleSave} className="btn-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input
                      id="new"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handlePasswordChange} variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-slate-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, email: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-slate-600">Receive push notifications in browser</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications.push}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, push: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-slate-600">Receive notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications.sms}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, sms: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                </div>
              </div>
              
              <Button onClick={handleSave} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}