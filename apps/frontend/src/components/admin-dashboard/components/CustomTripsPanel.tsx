import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../../app/utils/axiosInstance';
import CreateCustomTripModal from './CreateCustomTripModal';

interface CustomTrip {
  id: string;
  name: string;
  description?: string;
  route: RouteStopData[];
  buses: Bus[];
  drivers: User[];
  startDateTime: string;
  price: number;
  maxSeats: number;
  bookedSeats: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status: 'pending_payment' | 'paid' | 'cancelled' | 'completed';
  paymentToken: string;
  createdAt: string;
}

interface RouteStopData {
  location: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
  price: number;
}

interface Bus {
  id: string;
  licensePlate: string;
  model: string;
  type: string;
  totalSeats: Record<string, number>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

const statusColorMap = {
  pending_payment: 'warning',
  paid: 'success',
  cancelled: 'danger',
  completed: 'primary',
} as const;

const statusLabels = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

export function CustomTripsPanel() {
  const [customTrips, setCustomTrips] = useState<CustomTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<CustomTrip | null>(null);
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<CustomTrip | null>(null);

  const fetchCustomTrips = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/custom-trips');
      setCustomTrips(response.data);
    } catch (error) {
      console.error('Error fetching custom trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomTrips();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      try {
        await axiosInstance.delete(`/custom-trips/${id}`);
        await fetchCustomTrips();
      } catch (error) {
        console.error('Error deleting custom trip:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/custom-trips/${id}/status`, { status: newStatus });
      await fetchCustomTrips();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const copyPaymentLink = (paymentToken: string) => {
    const link = `${window.location.origin}/payment/${paymentToken}`;
    navigator.clipboard.writeText(link);
    // You might want to show a toast notification here
  };

  const handleView = (trip: CustomTrip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  const handleEdit = (trip: CustomTrip) => {
    setEditingTrip(trip);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getTotalCapacity = (buses: Bus[]) => {
    return buses.reduce((total, bus) => {
      return total + Object.values(bus.totalSeats).reduce((sum, seats) => sum + seats, 0);
    }, 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => setShowCreateModal(true)}
        >
          Nueva Reserva
        </Button>
      </div>

      <Table aria-label="Custom trips table">
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>CLIENTE</TableColumn>
          <TableColumn>FECHA</TableColumn>
          <TableColumn>PRECIO</TableColumn>
          <TableColumn>OCUPACIÓN</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={customTrips}
          isLoading={loading}
          emptyContent="No hay reservas"
        >
          {(trip) => (
            <TableRow key={trip.id}>
              <TableCell>
                <div>
                  <div className="font-semibold">{trip.name}</div>
                  {trip.description && (
                    <div className="text-sm text-gray-500">{trip.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{trip.customerName}</div>
                  <div className="text-sm text-gray-500">{trip.customerEmail}</div>
                </div>
              </TableCell>
              <TableCell>{formatDateTime(trip.startDateTime)}</TableCell>
              <TableCell>${trip?.price}</TableCell>
              <TableCell>
                {trip.bookedSeats}/{trip.maxSeats}
                <div className="text-xs text-gray-500">
                  Capacidad total: {getTotalCapacity(trip.buses)}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  color={statusColorMap[trip.status]}
                  variant="flat"
                  size="sm"
                >
                  {statusLabels[trip.status]}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Ver detalles">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleView(trip)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  {trip.status === 'pending_payment' && (
                    <Tooltip content="Editar reserva">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEdit(trip)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip content="Copiar enlace de pago">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => copyPaymentLink(trip.paymentToken)}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="paid"
                        onPress={() => handleStatusChange(trip.id, 'paid')}
                      >
                        Marcar como pagado
                      </DropdownItem>
                      <DropdownItem
                        key="completed"
                        onPress={() => handleStatusChange(trip.id, 'completed')}
                      >
                        Marcar como completado
                      </DropdownItem>
                      <DropdownItem
                        key="cancelled"
                        onPress={() => handleStatusChange(trip.id, 'cancelled')}
                      >
                        Cancelar
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => handleDelete(trip.id)}
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create Custom Trip Modal */}
      <CreateCustomTripModal
        isOpen={showCreateModal || !!editingTrip}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTrip(null);
        }}
        onSuccess={() => {
          fetchCustomTrips();
          setShowCreateModal(false);
          setEditingTrip(null);
        }}
        editingTrip={editingTrip}
      />

      {/* View Custom Trip Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>Detalles de la Reserva</ModalHeader>
          <ModalBody>
            {selectedTrip && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTrip.name}</h3>
                  {selectedTrip.description && (
                    <p className="text-gray-600">{selectedTrip.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Cliente</h4>
                    <p>{selectedTrip.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedTrip.customerEmail}</p>
                    {selectedTrip.customerPhone && (
                      <p className="text-sm text-gray-500">{selectedTrip.customerPhone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">Fecha y Hora</h4>
                    <p>{formatDateTime(selectedTrip.startDateTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium">Precio</h4>
                    <p>${selectedTrip.price}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Ocupación</h4>
                    <p>{selectedTrip.bookedSeats}/{selectedTrip.maxSeats}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Estado</h4>
                    <Chip
                      color={statusColorMap[selectedTrip.status]}
                      variant="flat"
                      size="sm"
                    >
                      {statusLabels[selectedTrip.status]}
                    </Chip>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Vehículos</h4>
                  <div className="space-y-1">
                    {selectedTrip.buses.map((bus) => (
                      <div key={bus.id} className="text-sm">
                        {bus.licensePlate} - {bus.model} ({bus.type})
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Conductores</h4>
                  <div className="space-y-1">
                    {selectedTrip.drivers.map((driver) => (
                      <div key={driver.id} className="text-sm">
                        {driver.firstName} {driver.lastName} ({driver.email})
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Ruta</h4>
                  <div className="space-y-2">
                    {selectedTrip.route
                      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                      .map((stop, index) => (
                        <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                          <div>
                            <span className="font-medium">{stop.location.name}</span>
                            <div className="text-xs text-gray-500">{stop.location.address}</div>
                          </div>
                          <div className="text-right">
                            <div>+{stop.timeOffsetMinutesArrival} min</div>
                            <div className="text-xs text-gray-500">
                              Parada: {stop.stopDurationMinutes} min
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Enlace de Pago</h4>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-1">
                      {window.location.origin}/payment/{selectedTrip.paymentToken}
                    </code>
                    <Button
                      size="sm"
                      onPress={() => copyPaymentLink(selectedTrip.paymentToken)}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onViewClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default CustomTripsPanel; 