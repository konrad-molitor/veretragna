import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axiosInstance from '../utils/axiosInstance';

type DashboardLayoutProps = {
  children: ReactNode;
};

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  status: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        // If we have cached user data, use it initially
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch fresh user data from API
        const response = await axiosInstance.get('/users/me');
        const userData = response.data;

        // Update user data in state and localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error (e.g., token expired), navigate to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user as UserData} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
