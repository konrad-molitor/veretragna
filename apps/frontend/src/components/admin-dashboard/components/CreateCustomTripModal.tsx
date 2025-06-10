import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  DatePicker,
  Chip,
  Card,
  CardBody,
  Divider,
  Alert,
} from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../../app/utils/axiosInstance';

interface CreateCustomTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTrip?: CustomTrip | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Bus {
  id: string;
  licensePlate: string;
  model: string;
  type: string;
  totalSeats: Record<string, number>;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
}

interface RouteStop {
  location: Location | null;
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
}

interface CustomTrip {
  id: string;
  name: string;
  description?: string;
  route: RouteStop[];
  buses: Bus[];
  drivers: Driver[];
  startDateTime: string;
  price: number;
  maxSeats: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status: string;
}

interface FormData {
  name: string;
  description: string;
  route: RouteStop[];
  busIds: string[];
  driverIds: string[];
  startDateTime: string;
  price: number;
  maxSeats: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  route: [
    {
      location: null,
      sequenceOrder: 1,
      timeOffsetMinutesArrival: 0,
      stopDurationMinutes: 5,
    },
  ],
  busIds: [],
  driverIds: [],
  startDateTime: '',
  price: 0,
  maxSeats: 1,
  customerEmail: '',
  customerName: '',
  customerPhone: '',
};

export function CreateCustomTripModal({ isOpen, onClose, onSuccess, editingTrip }: CreateCustomTripModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [locations, setLocations] = useState<Location[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editingTrip) {
        // Populate form with editing trip data
        setFormData({
          name: editingTrip.name,
          description: editingTrip.description || '',
          route: editingTrip.route,
          busIds: editingTrip.buses.map(bus => bus.id),
          driverIds: editingTrip.drivers.map(driver => driver.id),
          startDateTime: editingTrip.startDateTime.slice(0, 16), // Format for datetime-local
          price: editingTrip.price,
          maxSeats: editingTrip.maxSeats,
          customerEmail: editingTrip.customerEmail,
          customerName: editingTrip.customerName,
          customerPhone: editingTrip.customerPhone || '',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, editingTrip]);

  const fetchData = async () => {
    try {
      const [locationsRes, busesRes, driversRes] = await Promise.all([
        axiosInstance.get('/locations'),
        axiosInstance.get('/buses'),
        axiosInstance.get('/users?type=driver'),
      ]);

      setLocations(locationsRes.data);
      setBuses(busesRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleRouteStopChange = (index: number, field: keyof RouteStop, value: unknown) => {
    const newRoute = [...formData.route];
    
    // Ensure first stop always has arrival time 0
    if (index === 0 && field === 'timeOffsetMinutesArrival') {
      value = 0;
    }
    
    newRoute[index] = {
      ...newRoute[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      route: newRoute,
    }));
  };

  const addRouteStop = () => {
    const newStop: RouteStop = {
      location: null,
      sequenceOrder: formData.route.length + 1,
      timeOffsetMinutesArrival: 0,
      stopDurationMinutes: 5,
    };
    setFormData((prev) => ({
      ...prev,
      route: [...prev.route, newStop],
    }));
  };

  const removeRouteStop = (index: number) => {
    if (formData.route.length > 1) {
      const newRoute = formData.route.filter((_, i) => i !== index);
      // Reorder sequence numbers
      newRoute.forEach((stop, i) => {
        stop.sequenceOrder = i + 1;
      });
      setFormData((prev) => ({
        ...prev,
        route: newRoute,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre del cliente es requerido';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email del cliente es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'El email no es válido';
    }

    if (!formData.startDateTime) {
      newErrors.startDateTime = 'La fecha y hora son requeridas';
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    if (formData.maxSeats <= 0) {
      newErrors.maxSeats = 'El número de asientos debe ser mayor a 0';
    }

    if (formData.busIds.length === 0) {
      newErrors.busIds = 'Debe seleccionar al menos un vehículo';
    }

    if (formData.driverIds.length === 0) {
      newErrors.driverIds = 'Debe seleccionar al menos un conductor';
    }

    // Validate drivers >= buses
    if (formData.driverIds.length < formData.busIds.length) {
      const busCount = formData.busIds.length;
      newErrors.driverIds = `Debe seleccionar al menos ${busCount} conductor(es) para ${busCount} vehículo(s)`;
    }

    // Validate route stops
    formData.route.forEach((stop, index) => {
      if (!stop.location) {
        newErrors[`route_${index}_location`] = 'Debe seleccionar una ubicación';
      }

                      // Validate arrival time progression
        if (index > 0) {
          const previousStops = formData.route.slice(0, index);
          const minRequiredTime = previousStops.reduce((total, prevStop) =>
            total + prevStop.timeOffsetMinutesArrival + prevStop.stopDurationMinutes,
            0);

          if (stop.timeOffsetMinutesArrival <= minRequiredTime) {
            newErrors[`route_${index}_time`] = `El tiempo debe ser mayor a ${minRequiredTime} minutos`;
          }
        }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        route: formData.route.map((stop) => ({
          location: {
            id: stop.location!.id,
            name: stop.location!.name,
            address: stop.location!.address,
            coordinates: stop.location!.coordinates,
          },
          sequenceOrder: stop.sequenceOrder,
          timeOffsetMinutesArrival: stop.timeOffsetMinutesArrival,
          stopDurationMinutes: stop.stopDurationMinutes,
        })),
      };

      if (editingTrip) {
        // Update existing trip
        await axiosInstance.put(`/custom-trips/${editingTrip.id}`, submitData);
      } else {
        // Create new trip
        await axiosInstance.post('/custom-trips', submitData);
      }
      
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error('Error creating custom trip:', error);
      
      // Handle server errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; errors?: unknown[] } } };
        
        if (axiosError.response?.data?.error) {
          // Single error message from server
          setErrors({ server: axiosError.response.data.error });
        } else if (axiosError.response?.data?.errors) {
          // Validation errors from backend
          const backendErrors: Record<string, string> = {};
          axiosError.response.data.errors.forEach((validationError: unknown) => {
            if (validationError && typeof validationError === 'object' && 'property' in validationError) {
              const ve = validationError as { property?: string; constraints?: Record<string, string> };
              if (ve.property) {
                backendErrors[ve.property] = Object.values(ve.constraints || {}).join(', ');
              }
            }
          });
          setErrors(backendErrors);
        } else {
          setErrors({ server: 'Error desconocido del servidor' });
        }
      } else {
        setErrors({ server: 'Error de conexión. Intente nuevamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const getTotalCapacity = () => formData.busIds.reduce((total, busId) => {
    const bus = buses.find((b) => b.id === busId);
    if (bus) {
      return total + Object.values(bus.totalSeats).reduce((sum, seats) => sum + seats, 0);
    }
    return total;
  }, 0);

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{editingTrip ? 'Editar Reserva' : 'Nueva Reserva'}</ModalHeader>
        <ModalBody>
          {/* Server errors display */}
          {Object.keys(errors).length > 0 && (
            <Alert
              color="danger"
              variant="flat"
              className="mb-4"
            >
              <div>
                <p className="font-semibold mb-2">Se encontraron errores:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field} className="text-sm">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
          
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre de la reserva"
                    placeholder="Ej: Excursión a la playa"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    isRequired
                  />
                  <Input
                    label="Precio total"
                    type="number"
                    placeholder="0.00"
                    value={formData.price.toString()}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    isInvalid={!!errors.price}
                    errorMessage={errors.price}
                    startContent="$"
                    isRequired
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    label="Descripción"
                    placeholder="Descripción opcional de la reserva"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del cliente"
                    placeholder="Nombre completo"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    isInvalid={!!errors.customerName}
                    errorMessage={errors.customerName}
                    isRequired
                  />
                  <Input
                    label="Email del cliente"
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    isInvalid={!!errors.customerEmail}
                    errorMessage={errors.customerEmail}
                    isRequired
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Teléfono (opcional)"
                    placeholder="+1234567890"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Date and Capacity */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Fecha y Capacidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Fecha y hora de inicio"
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                    isInvalid={!!errors.startDateTime}
                    errorMessage={errors.startDateTime}
                    isRequired
                    placeholder="YYYY-MM-DDTHH:MM"
                  />
                  <Input
                    label="Número máximo de asientos"
                    type="number"
                    placeholder="1"
                    value={formData.maxSeats.toString()}
                    onChange={(e) => handleInputChange('maxSeats', parseInt(e.target.value, 10) || 1)}
                    isInvalid={!!errors.maxSeats}
                    errorMessage={errors.maxSeats}
                    description={`Capacidad total de vehículos: ${getTotalCapacity()}`}
                    isRequired
                  />
                </div>
              </CardBody>
            </Card>

            {/* Vehicles and Drivers */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Vehículos y Conductores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Vehículos"
                      placeholder="Seleccionar vehículos"
                      selectionMode="multiple"
                      selectedKeys={formData.busIds}
                      onSelectionChange={(keys) => handleInputChange('busIds', Array.from(keys))}
                      isInvalid={!!errors.busIds}
                      errorMessage={errors.busIds}
                      isRequired
                    >
                      {buses.map((bus) => (
                        <SelectItem key={bus.id}>
                          {bus.licensePlate}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Select
                      label="Conductores"
                      placeholder="Seleccionar conductores"
                      selectionMode="multiple"
                      selectedKeys={formData.driverIds}
                      onSelectionChange={(keys) => handleInputChange('driverIds', Array.from(keys))}
                      isInvalid={!!errors.driverIds}
                      errorMessage={errors.driverIds}
                      isRequired
                    >
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id}>
                          {`${driver.firstName} ${driver.lastName}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Route */}
            <Card>
              <CardBody>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Ruta</h3>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={addRouteStop}
                  >
                    Agregar Parada
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.route.map((stop, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-red-600">{index + 1}</span>
                          </div>
                          <h4 className="font-medium">
                            {stop.location ? stop.location.name : 'Parada sin seleccionar'}
                          </h4>
                        </div>
                        {formData.route.length > 1 && (
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => removeRouteStop(index)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                                             {/* Real time display */}
                       {formData.startDateTime && (
                         <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                           <p className="text-sm text-blue-800">
                             <strong>Horario:</strong>{' '}
                             {formatTimeRange(
                               stop.timeOffsetMinutesArrival,
                               stop.stopDurationMinutes,
                               formData.startDateTime
                             )}
                           </p>
                         </div>
                       )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select
                          label="Ubicación"
                          placeholder="Seleccionar ubicación"
                          selectedKeys={stop.location ? [stop.location.id] : []}
                          onSelectionChange={(keys) => {
                            const locationId = Array.from(keys)[0] as string;
                            const location = locations.find((l) => l.id === locationId) || null;
                            handleRouteStopChange(index, 'location', location);
                          }}
                          isInvalid={!!errors[`route_${index}_location`]}
                          errorMessage={errors[`route_${index}_location`]}
                        >
                          {locations.map((location) => (
                            <SelectItem key={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          label="Tiempo llegada (min)"
                          type="number"
                          value={stop.timeOffsetMinutesArrival.toString()}
                          onChange={(e) => handleRouteStopChange(
                            index,
                            'timeOffsetMinutesArrival',
                            parseInt(e.target.value, 10) || 0,
                          )}
                          isInvalid={!!errors[`route_${index}_time`]}
                          errorMessage={errors[`route_${index}_time`]}
                          description={index === 0 ? "Tiempo desde el inicio" : "Tiempo total acumulado"}
                          isDisabled={index === 0}
                        />
                        <Input
                          label="Duración parada (min)"
                          type="number"
                          value={stop.stopDurationMinutes.toString()}
                          onChange={(e) => handleRouteStopChange(
                            index,
                            'stopDurationMinutes',
                            parseInt(e.target.value, 10) || 0,
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            Crear Reserva
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateCustomTripModal;
