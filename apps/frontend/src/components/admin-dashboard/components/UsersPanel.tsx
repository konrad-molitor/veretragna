import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../app/utils/axiosInstance';

// Interfaces based on backend model
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'unconfirmed' | 'confirmed' | 'blocked';
  type: 'user' | 'admin' | 'driver';
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  status: 'unconfirmed' | 'confirmed' | 'blocked';
  type: 'user' | 'admin' | 'driver';
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    }
  };
  message?: string;
}

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['user', 'admin', 'driver']));
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['unconfirmed', 'confirmed', 'blocked']));

  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    status: 'confirmed',
    type: 'user',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      status: 'confirmed',
      type: 'user',
    });
    setEditingUserId(null);
    setIsEditing(false);
  };

  // Fetch users list
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || 'Error al cargar los usuarios');
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and selected filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase())
      || user.firstName.toLowerCase().includes(searchQuery.toLowerCase())
      || user.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedTypes.has(user.type);
    const matchesStatus = selectedStatuses.has(user.status);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle user type filter changes
  const handleTypeFilterChange = (types: string[]) => {
    setSelectedTypes(new Set(types));
  };

  // Handle user status filter changes
  const handleStatusFilterChange = (statuses: string[]) => {
    setSelectedStatuses(new Set(statuses));
  };

  // Handle user edit
  const handleEditUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        type: user.type,
      });
      setEditingUserId(id);
      setIsEditing(true);
      openModal();
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (isEditing && editingUserId) {
        const response = await axiosInstance.patch(`/users/${editingUserId}`, formData);

        // Update users list
        setUsers((prev) => prev.map((user) => (
          user.id === editingUserId ? { ...user, ...response.data.user } : user
        )));

        toast.success('Usuario actualizado correctamente');
      }

      closeModal();
      resetForm();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      toast.error(apiError.response?.data?.error || 'Error al actualizar el usuario');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await axiosInstance.delete(`/users/${id}`);

        // Remove user from list
        setUsers((prev) => prev.filter((user) => user.id !== id));

        toast.success('Usuario eliminado correctamente');
      } catch (err: unknown) {
        const apiError = err as ApiError;
        toast.error(apiError.response?.data?.error || 'Error al eliminar el usuario');
      }
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    resetForm();
    closeModal();
  };

  // Format user status
  const formatUserStatus = (status: string): string => {
    switch (status) {
      case 'unconfirmed':
        return 'No Confirmado';
      case 'confirmed':
        return 'Confirmado';
      case 'blocked':
        return 'Bloqueado';
      default:
        return status;
    }
  };

  // Format user type
  const formatUserType = (type: string): string => {
    switch (type) {
      case 'user':
        return 'Usuario';
      case 'admin':
        return 'Administrador';
      case 'driver':
        return 'Conductor';
      default:
        return type;
    }
  };

  // Get status color
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'unconfirmed':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'blocked':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Get user type color
  const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (type) {
      case 'user':
        return 'default';
      case 'admin':
        return 'primary';
      case 'driver':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Render table cells
  const renderCell = (user: User, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <div>{`${user.firstName} ${user.lastName}`}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        );
      case 'status':
        return (
          <Chip color={getStatusColor(user.status)}>
            {formatUserStatus(user.status)}
          </Chip>
        );
      case 'type':
        return (
          <Chip color={getTypeColor(user.type)}>
            {formatUserType(user.type)}
          </Chip>
        );
      case 'createdAt':
        return <div>{new Date(user.createdAt).toLocaleDateString()}</div>;
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => handleEditUser(user.id)}
              type="button"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onClick={() => handleDeleteUser(user.id)}
              type="button"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return <div>{String(user[columnKey as keyof User])}</div>;
    }
  };

  // Table columns
  const columns = [
    { name: 'Nombre / Email', uid: 'name' },
    { name: 'Estado', uid: 'status' },
    { name: 'Tipo', uid: 'type' },
    { name: 'Fecha de Registro', uid: 'createdAt' },
    { name: 'Acciones', uid: 'actions' },
  ];

  if (loading) {
    return <div className="p-6">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
      </div>

      {/* Filter panel - horizontal layout */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <Input
              label="Buscar usuario"
              labelPlacement="outside"
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Nombre o email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* User type filter */}
          <div>
            <div className="text-sm font-medium mb-2">Tipo de usuario</div>
            <Select
              selectionMode="multiple"
              placeholder="Seleccionar tipos"
              selectedKeys={selectedTypes}
              onSelectionChange={(keys) => handleTypeFilterChange(Array.from(keys) as string[])}
              className="w-full"
            >
              <SelectItem key="user">Usuario</SelectItem>
              <SelectItem key="admin">Administrador</SelectItem>
              <SelectItem key="driver">Conductor</SelectItem>
            </Select>
          </div>

          {/* User status filter */}
          <div>
            <div className="text-sm font-medium mb-2">Estado</div>
            <Select
              selectionMode="multiple"
              placeholder="Seleccionar estados"
              selectedKeys={selectedStatuses}
              onSelectionChange={(keys) => handleStatusFilterChange(Array.from(keys) as string[])}
              className="w-full"
            >
              <SelectItem key="unconfirmed">No Confirmado</SelectItem>
              <SelectItem key="confirmed">Confirmado</SelectItem>
              <SelectItem key="blocked">Bloqueado</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <Table
          aria-label="Tabla de usuarios"
          isStriped
          removeWrapper
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={filteredUsers}
            emptyContent="No hay usuarios registrados"
          >
            {(user) => (
              <TableRow key={user.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(user, columnKey.toString())}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal for editing user */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>
            Editar Usuario
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <Input
                label="Nombre"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
              <Input
                label="Apellido"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
              <Select
                label="Estado"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                required
              >
                <SelectItem key="unconfirmed">No Confirmado</SelectItem>
                <SelectItem key="confirmed">Confirmado</SelectItem>
                <SelectItem key="blocked">Bloqueado</SelectItem>
              </Select>
              <Select
                label="Tipo"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                <SelectItem key="user">Usuario</SelectItem>
                <SelectItem key="admin">Administrador</SelectItem>
                <SelectItem key="driver">Conductor</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleSubmit}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default UsersPanel;
