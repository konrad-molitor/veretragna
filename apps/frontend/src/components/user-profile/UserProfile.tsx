import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
  User,
} from '@heroui/react';
import { ArrowLeftCircleIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../app/utils/axiosInstance';
import UserTickets from './UserTickets';

type UserProfileProps = {
  userId?: string;
};

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  status: string;
};

const userTypeMap = {
  admin: 'Administrador',
  driver: 'Conductor',
  user: 'Usuario',
};

export function UserProfile({ userId }: UserProfileProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    // Try to get user data from localStorage first for quick display
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
      });
    }

    // Then fetch the latest data from API
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get('/users/me');
        const userData = response.data;

        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
        });

        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error al cargar los datos del perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.patch('/users/me', formData);
      const updatedUser = response.data.user;

      // Update local user state
      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = (): string => {
    if (!user?.firstName || !user?.lastName) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex flex-col justify-center items-center py-4 px-6 overflow-y-auto">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Perfil de Usuario</h1>

        <Card>
          <CardHeader className="flex gap-3 p-4">
            <User
              name={`${user?.firstName} ${user?.lastName}`}
              description={user?.email}
              avatarProps={{
                src: undefined,
                name: getInitials(),
                color: 'danger',
                showFallback: true,
                isBordered: false,
              }}
            />
          </CardHeader>
          <Divider />
          <CardBody className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-6">
                <Input
                  id="firstName"
                  name="firstName"
                  label="Nombre"
                  labelPlacement="outside"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Nombre"
                />
                <Input
                  id="lastName"
                  name="lastName"
                  label="Apellido"
                  labelPlacement="outside"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Apellido"
                />
              </div>

              <div className="flex flex-col gap-6">
                {/* <p>
                  Tipo de cuenta:
                  <span className="ml-1 font-medium">
                    {user?.type === 'admin' && 'Administrador'}
                    {user?.type === 'driver' && 'Conductor'}
                    {user?.type === 'user' && 'Usuario'}
                    {!['admin', 'driver', 'user'].includes(user?.type || '') && 'Usuario'}
                  </span>
                </p> */}
                <Input
                  id="type"
                  name="type"
                  label="Tipo de cuenta"
                  labelPlacement="outside"
                  value={userTypeMap[user?.type as keyof typeof userTypeMap]}
                  disabled
                  readOnly
                />
                <span className="flex items-center gap-2 text-sm">
                  Confirmación:
                  {user?.status === 'confirmed' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                  {user?.status === 'pending' && <ExclamationCircleIcon className="w-5 h-5 text-red-500" />}
                </span>
              </div>
            </form>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-between p-4">
            <Button
              variant="faded"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeftCircleIcon className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button
              color="danger"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>

        <UserTickets />
      </div>
    </div>
  );
}

UserProfile.defaultProps = {
  userId: undefined,
};

export default UserProfile;
