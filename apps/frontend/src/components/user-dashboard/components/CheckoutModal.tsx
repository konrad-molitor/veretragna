import React, { useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Input,
  Divider,
  Alert,
  Textarea,
} from '@heroui/react';
import { ExclamationTriangleIcon, CreditCardIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TripResult, TripRoute } from '../types';
import axiosInstance from '../../../app/utils/axiosInstance';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrips: string[];
  tripsDetails: Record<string, TripRoute>;
  tripResults: TripResult[];
  getTotalPrice: () => number;
}

interface CardFormState {
  cardNumber: string;
  cardName: string;
  expireDate: string;
  cvv: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedTrips,
  tripsDetails,
  tripResults,
  getTotalPrice,
}: CheckoutModalProps) {
  const [formData, setFormData] = React.useState<CardFormState>({
    cardNumber: '',
    cardName: '',
    expireDate: '',
    cvv: '',
  });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cardNumber: '',
        cardName: '',
        expireDate: '',
        cvv: '',
      });
      setIsProcessing(false);
      setShowSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Card number formatting (adding spaces every 4 digits)
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData({
        ...formData,
        [name]: formatted.substring(0, 19), // Limit to 16 digits + 3 spaces
      });
    }
    // Expiration date formatting (MM/YY)
    else if (name === 'expireDate') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;

      if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
      }

      setFormData({
        ...formData,
        [name]: formatted.substring(0, 5), // Limit to MM/YY format
      });
    }
    // CVV formatting (digits only, max 3)
    else if (name === 'cvv') {
      const cleaned = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: cleaned.substring(0, 3),
      });
    }
    // No formatting for other fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const getSelectedTripDetails = () => selectedTrips.map((tripId) => {
    const trip = tripResults.find((result) => result.id === tripId);
    const details = tripsDetails[tripId];

    return {
      id: tripId,
      departureLocation: trip?.departureLocation,
      arrivalLocation: trip?.arrivalLocation,
      departureTime: trip?.departureTime,
      arrivalTime: trip?.arrivalTime,
      price: trip?.price || 0,
      type: details?.type,
      segments: details?.segments || [],
    };
  });

  const selectedTripDetails = getSelectedTripDetails();

  const createTickets = async () => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Usuario no autenticado');
      }
      
      const userData = JSON.parse(userStr);

      // Создаем билеты для каждого сегмента каждой поездки
      const ticketCreationPromises = [];
      
      for (const trip of selectedTripDetails) {
        if (trip.segments.length === 0) {
          throw new Error(`No se encontraron segmentos para el viaje ${trip.id}`);
        }
        
        // Для каждого сегмента поездки создаем отдельный билет
        for (const segment of trip.segments) {
          try {
            // Запрашиваем данные о поездке для текущего сегмента
            const { tripId } = segment;
            
            // Запрашиваем данные о поездке и её маршрутных остановках
            const tripResponse = await axiosInstance.get(`/trips/${tripId}`);
            const tripData = tripResponse.data;
            
            if (
              !tripData
              || !tripData.schedule
              || !tripData.schedule.route
              || !tripData.schedule.route.stops
            ) {
              throw new Error(`No se pudo obtener información detallada del viaje ${tripId}`);
            }
            
            // Получаем название локаций отправления и прибытия для текущего сегмента
            const departureLocationName = segment.from;
            const arrivalLocationName = segment.to;
            
            // Находим соответствующие остановки маршрута
            const routeStops = tripData.schedule.route.stops;
            
            // Сортируем остановки по порядку следования
            routeStops.sort((
              a: { sequenceOrder: number; },
              b: { sequenceOrder: number; },
            ) => a.sequenceOrder - b.sequenceOrder);
            
            const startRouteStop = routeStops.find(
              (stop: { location: { name: string; }; }) => 
                stop.location.name === departureLocationName
            );
            
            const endRouteStop = routeStops.find(
              (stop: { location: { name: string; }; }) => 
                stop.location.name === arrivalLocationName
            );
            
            // If stops not found, look for alternatives
            if (!startRouteStop || !endRouteStop) {
              console.error(`Stops not found for segment ${departureLocationName} -> ${arrivalLocationName}`);
              
              let useStartStop = startRouteStop;
              let useEndStop = endRouteStop;
              
              // If starting stop not found, use the first stop on the route
              if (!useStartStop && routeStops.length > 0) {
                useStartStop = routeStops[0];
              }
              
              // If ending stop not found, use the last stop on the route
              if (!useEndStop && routeStops.length > 0) {
                useEndStop = routeStops[routeStops.length - 1];
              }
              
              // If we have both stops, create a ticket
              if (useStartStop && useEndStop) {
                const segmentPromise = axiosInstance.post('/tickets', {
                  tripId,
                  userId: userData.id,
                  startRouteStopId: useStartStop.id,
                  endRouteStopId: useEndStop.id,
                  price: segment.price,
                });
                ticketCreationPromises.push(segmentPromise);
                continue;
              }
              
              // If we still can't create a ticket, throw an error
              throw new Error(
                `No se pudieron encontrar las paradas de ruta para las ubicaciones ${departureLocationName} y ${arrivalLocationName}`
              );
            }
            
            // Create a ticket through API with the found stops
            const segmentPromise = axiosInstance.post('/tickets', {
              tripId,
              userId: userData.id,
              startRouteStopId: startRouteStop.id,
              endRouteStopId: endRouteStop.id,
              price: segment.price,
            });
            
            ticketCreationPromises.push(segmentPromise);
          } catch (segmentErr) {
            console.error('Error al procesar el segmento:', segmentErr);
            throw segmentErr;
          }
        }
      }
      
      // Wait for all tickets to be created
      await Promise.all(ticketCreationPromises);
      
      return true;
    } catch (err: any) {
      console.error('Error creating tickets:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.errors) {
        // Display validation errors
        const validationErrors = err.response.data.errors;
        setError(`Error de validación: ${JSON.stringify(validationErrors[0]?.constraints)}`);
      } else {
        setError('Error al crear los boletos. Por favor intente de nuevo.');
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create tickets in the database
      const ticketsCreated = await createTickets();

      if (ticketsCreated) {
        setShowSuccess(true);
      } else {
        // If there was an error creating tickets, it will be set in the createTickets function
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Error in checkout process:', err);
      setError('Ha ocurrido un error en el proceso de pago. Por favor intente de nuevo.');
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={!isProcessing}
      isKeyboardDismissDisabled={isProcessing}
      backdrop="blur"
    >
      <ModalContent>
        {showSuccess ? (
          // Successful payment - show confirmation
          <ModalBody className="py-10 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600">¡Compra exitosa!</h2>
              <p className="text-lg text-gray-600">Sus billetes han sido reservados correctamente.</p>
              <p className="text-sm text-gray-500">Recibirá un correo electrónico con los detalles de su compra.</p>
              <Button color="primary" size="lg" onClick={onClose} className="mt-6">
                Volver al dashboard
              </Button>
            </div>
          </ModalBody>
        ) : (
          // Payment form
          <>
            <ModalHeader className="border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Finalizar Compra</h2>
            </ModalHeader>
            <ModalBody className="p-0">
              <Alert
                color="warning"
                className="rounded-none"
              >
                <p>
                  <strong>¡Advertencia!</strong>
                  {' '}
                  Este es un proyecto de demostración. No introduzca información real de tarjetas de crédito.
                </p>
              </Alert>

              {error && (
                <Alert
                  color="danger"
                  className="rounded-none"
                >
                  <p>
                    <strong>Error:</strong>
                    {' '}
                    {error}
                  </p>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Purchase information - left side */}
                <div className="p-6 bg-gray-50">
                  <h3 className="text-lg font-bold mb-4">Detalles de la compra</h3>
                  <div className="space-y-4">
                    {selectedTripDetails.map((trip) => (
                      <Card key={trip.id} className="shadow-sm">
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {trip.departureLocation}
                                {' '}
                                →
                                {trip.arrivalLocation}
                              </p>
                              <p className="text-sm text-gray-600">
                                {trip.departureTime}
                                {' '}
                                -
                                {trip.arrivalTime}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {trip.type === 'outbound' ? 'Viaje de ida' : 'Viaje de vuelta'}
                              </p>
                            </div>
                            <p className="font-bold text-red-600">
                              $
                              {trip.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>

                          {trip.segments.length > 1 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Conexiones:
                                {trip.segments.length - 1}
                              </p>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  <Divider className="my-4" />

                  <div className="flex justify-between items-center">
                    <p className="font-medium">Total:</p>
                    <p className="text-xl font-bold text-red-600">
                      $
                      {getTotalPrice().toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Payment form - right side */}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Información de pago</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <Input
                        label="Número de tarjeta"
                        placeholder="1234 5678 9012 3456"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        startContent={<CreditCardIcon className="h-5 w-5 text-gray-400" />}
                        maxLength={19}
                        isDisabled={isProcessing}
                      />

                      <Input
                        label="Nombre en la tarjeta"
                        placeholder="NOMBRE APELLIDO"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        required
                        isDisabled={isProcessing}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Fecha de expiración"
                          placeholder="MM/YY"
                          name="expireDate"
                          value={formData.expireDate}
                          onChange={handleInputChange}
                          required
                          isDisabled={isProcessing}
                        />

                        <Input
                          label="Código de seguridad"
                          placeholder="123"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          type="password"
                          isDisabled={isProcessing}
                        />
                      </div>

                      <Textarea
                        label="Dirección de facturación"
                        placeholder="Ingrese su dirección completa"
                        isDisabled={isProcessing}
                      />
                    </div>

                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      className="w-full mt-6"
                      style={{ backgroundColor: 'rgb(255, 0, 22)' }}
                      isLoading={isProcessing}
                      isDisabled={isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : 'Pagar ahora'}
                    </Button>
                  </form>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default CheckoutModal;
