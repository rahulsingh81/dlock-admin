import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
}