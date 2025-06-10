import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  Button,
} from '@heroui/react';
import { CreditCardIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../app/utils/axiosInstance';

// Custom Trip interface
interface CustomTrip {
  id: string;
  name: string;
  description?: string;
  startDateTime: string;
  price: number;
  maxSeats: number;
  bookedSeats: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status: 'pending_payment' | 'paid' | 'cancelled' | 'completed';
  paymentToken: string;
  route: Array<{
    location: {
      name: string;
      address: string;
    };
    sequenceOrder: number;
    timeOffsetMinutesArrival: number;
    stopDurationMinutes: number;
  }>;
}

export function UserCustomTrips() {
  const navigate = useNavigate();
  const [customTrips, setCustomTrips] = useState<CustomTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCustomTrips = async () => {
      try {
        const response = await axiosInstance.get('/custom-trips/user/me');
        setCustomTrips(response.data);
      } catch (error) {
        console.error('Error loading custom trips:', error);
        toast.error('Error al cargar las reservas grupales');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCustomTrips();
  }, []);

  // Function for date formatting
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get trip status in Spanish
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Pendiente de Pago';
      case 'paid': return 'Pagado';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  // Get color for status
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'pending_payment': return 'warning';
      case 'paid': return 'success';
      case 'cancelled': return 'danger';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const handlePayment = (paymentToken: string) => {
    navigate(`/payment/${paymentToken}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (customTrips.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
          <h2 className="text-xl font-bold">Mis Reservas Grupales</h2>
        </CardHeader>
        <Divider />
        <CardBody className="py-6 px-4">
          <p className="text-center text-gray-600">No tienes reservas grupales.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Mis Reservas</h2>
      <div className="space-y-4">
        {customTrips.map((trip) => (
          <Card key={trip.id} className="w-full">
            <CardHeader className="flex gap-3 p-4">
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{trip.name}</h3>
                    {trip.description && (
                      <p className="text-gray-600 text-sm mt-1">{trip.description}</p>
                    )}
                  </div>
                  <Chip
                    color={getStatusColor(trip.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusLabel(trip.status)}
                  </Chip>
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{formatDate(trip.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">
                    {trip.maxSeats}
                    {' '}
                    asientos
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-red-600">
                    $
                    {trip.price}
                  </span>
                </div>
                {trip.status === 'pending_payment' && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => handlePayment(trip.paymentToken)}
                  >
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    Pagar Ahora
                  </Button>
                )}
              </div>
              
              {trip.route && trip.route.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Ruta:</p>
                  <div className="space-y-1">
                    {trip.route
                      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                      .map((stop) => (
                        <div key={`${trip.id}-${stop.sequenceOrder}`} className="flex items-center text-sm text-gray-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          {stop.location.name}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default UserCustomTrips; 