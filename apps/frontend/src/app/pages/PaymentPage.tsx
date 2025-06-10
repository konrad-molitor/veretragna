import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Spinner,
} from '@heroui/react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../utils/axiosInstance';
import SimpleCheckoutModal from '../../components/CheckoutModal/SimpleCheckoutModal';

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

const statusColorMap = {
  pending_payment: 'warning',
  paid: 'success',
  cancelled: 'danger',
  completed: 'primary',
} as const;

const statusLabels = {
  pending_payment: 'Pendiente de Pago',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

export function PaymentPage() {
  const { paymentToken } = useParams<{ paymentToken: string }>();
  const [customTrip, setCustomTrip] = useState<CustomTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const fetchCustomTrip = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/custom-trips/payment/${paymentToken}`);
      setCustomTrip(response.data);
    } catch (err: unknown) {
      console.error('Error fetching custom trip:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        && err.response && typeof err.response === 'object' && 'data' in err.response
        && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data
        && typeof err.response.data.error === 'string'
        ? err.response.data.error
        : 'No se pudo cargar la información de la reserva';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentToken) {
      fetchCustomTrip();
    }
  }, [paymentToken]);

  const handlePayment = async () => {
    try {
      await axiosInstance.post(`/custom-trips/payment/${paymentToken}/pay`);
      await fetchCustomTrip(); // Refresh data
    } catch (err: unknown) {
      console.error('Error marking as paid:', err);
    }
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getTotalCapacity = (buses: Bus[]) => buses.reduce((total, bus) => total + Object.values(bus.totalSeats).reduce((sum, seats) => sum + seats, 0), 0);

  const formatTime = (minutes: number, startDateTime: string): string => {
    if (!startDateTime) return '--:--';

    const startTime = new Date(startDateTime);
    const targetTime = new Date(startTime.getTime() + minutes * 60000);

    return targetTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeRange = (arrivalMinutes: number, durationMinutes: number, startDateTime: string): string => {
    if (!startDateTime) return '--:-- - --:--';

    const arrivalTime = formatTime(arrivalMinutes, startDateTime);
    const departureTime = formatTime(arrivalMinutes + durationMinutes, startDateTime);

    return `${arrivalTime} - ${departureTime}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando información de la reserva...</p>
        </div>
      </div>
    );
  }

  if (error || !customTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">
              {error || 'No se pudo encontrar la reserva'}
            </p>
            <Button
              color="primary"
              onPress={() => { window.location.href = '/'; }}
            >
              Volver al Inicio
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isPaid = customTrip.status === 'paid' || customTrip.status === 'completed';
  const isCancelled = customTrip.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reserva
          </h1>
          <p className="text-gray-600">
            Detalles de su reserva y proceso de pago
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{customTrip.name}</h2>
                    {customTrip.description && (
                      <p className="text-gray-600 mt-1">{customTrip.description}</p>
                    )}
                  </div>
                  <Chip
                    color={statusColorMap[customTrip.status]}
                    variant="flat"
                  >
                    {statusLabels[customTrip.status]}
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Fecha y Hora</h3>
                    <p className="text-gray-600">{formatDateTime(customTrip.startDateTime)}</p>
                  </div>

                  <Divider />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Información del Cliente</h3>
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Nombre:</span>
                        {' '}
                        {customTrip.customerName}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>
                        {' '}
                        {customTrip.customerEmail}
                      </p>
                      {customTrip.customerPhone && (
                        <p>
                          <span className="font-medium">Teléfono:</span>
                          {' '}
                          {customTrip.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Capacidad</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Asientos Reservados</p>
                        <p className="font-medium">{customTrip.maxSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Capacidad Total</p>
                        <p className="font-medium">{getTotalCapacity(customTrip.buses)}</p>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Vehículos</h3>
                    <div className="space-y-2">
                      {customTrip.buses.map((bus) => (
                        <div key={bus.id} className="flex justify-between items-center">
                          <span>
                            {bus.licensePlate}
                            {' '}
                            -
                            {' '}
                            {bus.model}
                          </span>
                          <span className="text-sm text-gray-500">{bus.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Conductores</h3>
                    <div className="space-y-1">
                      {customTrip.drivers.map((driver) => (
                        <p key={driver.id}>
                          {driver.firstName}
                          {' '}
                          {driver.lastName}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Route Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Itinerario</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {customTrip.route
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((stop, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-red-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{stop.location.name}</h4>
                          <p className="text-sm text-gray-500">{stop.location.address}</p>
                          <div className="flex flex-col space-y-1 mt-2">
                            <div className="flex space-x-4 text-xs text-gray-400">
                              <span>
                                Llegada: +
                                {stop.timeOffsetMinutesArrival}
                                {' '}
                                min
                              </span>
                              <span>
                                Parada:
                                {stop.stopDurationMinutes}
                                {' '}
                                min
                              </span>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Horario:
                              {' '}
                              {formatTimeRange(stop.timeOffsetMinutesArrival, stop.stopDurationMinutes, customTrip.startDateTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <h2 className="text-xl font-semibold">Resumen de Pago</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Precio Total</span>
                    <span className="text-2xl font-bold">
                      $
                      {customTrip.price}
                    </span>
                  </div>

                  <Divider />

                  {isPaid ? (
                    <div className="text-center">
                      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-600 mb-2">
                        ¡Pago Completado!
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Su reserva ha sido confirmada. Recibirá más detalles por email.
                      </p>
                    </div>
                  ) : isCancelled ? (
                    <div className="text-center">
                      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-600 mb-2">
                        Reserva Cancelada
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Esta reserva ha sido cancelada y no se puede procesar el pago.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        color="primary"
                        size="lg"
                        className="w-full"
                        onPress={() => setShowCheckout(true)}
                      >
                        Pagar
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Procesamiento seguro de pagos.
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Checkout Modal */}
        <SimpleCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          tripName={customTrip.name}
          price={customTrip.price}
          onPaymentComplete={handlePayment}
        />
      </div>
    </div>
  );
}

export default PaymentPage;
