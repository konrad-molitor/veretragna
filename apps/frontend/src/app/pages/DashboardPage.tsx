import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminDashboard from '../../components/admin-dashboard/AdminDashboard';
import UserDashboard from '../../components/user-dashboard/UserDashboard';
import DriverDashboard from '../../components/driver-dashboard/DriverDashboard';
import UserProfile from '../../components/user-profile/UserProfile';

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  status: string;
};

type DashboardPageProps = {
  contentType?: 'dashboard' | 'profile';
};

export function DashboardPage({ contentType = 'dashboard' }: DashboardPageProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Determine content based on path or contentType prop
  const isProfilePage = contentType === 'profile' || location.pathname === '/dashboard/me';

  // Determine which dashboard to render based on user type
  const renderContent = () => {
    if (isProfilePage) {
      return <UserProfile />;
    }

    if (!user) return null;

    switch (user.type) {
      case 'admin':
        return <AdminDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'user':
      default:
        return <UserDashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}

DashboardPage.defaultProps = {
  contentType: 'dashboard',
};

export default DashboardPage;
