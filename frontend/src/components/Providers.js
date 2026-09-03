'use client';
import { AuthProvider } from '@/utils/AuthContext';

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
