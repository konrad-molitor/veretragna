import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Tooltip,
  Textarea,
  Switch,
} from '@heroui/react';
import {
  PlusCircleIcon,
  XCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../../app/utils/axiosInstance';
import safeParseFloat from '../../../app/utils/safeParseFloat';
import formatPrice from '../../../app/utils/formatPrice';

interface Location {
  id: string;
  name: string;
  imageUrl?: string;
}

interface RouteStop {
  id?: string;
  locationId: string;
  location?: Location;
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
  price: number;
}

enum RouteType {
  DIRECT = 'direct',
  SEMI_DIRECT = 'semi-direct',
  REGULAR = 'regular'
}

interface RouteFormData {
  name: string;
  description: string;
  isActive: boolean;
  type: RouteType;
  boardingPrice: number;
  stops: RouteStop[];
}

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: RouteFormData) => Promise<void>;
  initialData: {
    id?: string;
    name: string;
    description: string;
    isActive: boolean;
    type: RouteType;
    boardingPrice: number;
    stops: RouteStop[];
  } | null;
  isEditing: boolean;
}

const defaultFormData: RouteFormData = {
  name: '',
  description: '',
  isActive: true,
  type: RouteType.REGULAR,
  boardingPrice: 0,
  stops: [],
};

// Stop display component
interface StopProps {
  stop: RouteStop;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function StopItem({
  stop,
  index,
  onEdit,
  onDelete,
}: StopProps) {
  // Check if this is the first stop
  const isFirstStop = stop.sequenceOrder === 1;

  // Tooltip text with time and price information
  const timeInfo = `Tiempo de llegada: ${stop.timeOffsetMinutesArrival} min desde inicio
Duración de la parada: ${stop.stopDurationMinutes} min
${!isFirstStop ? `Precio: ${formatPrice(stop.price)}` : ''}`;

  return (
    <div className="mb-2">
      <Card className="w-full">
        <CardBody className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                {stop.sequenceOrder}
              </div>
              {stop.location?.imageUrl && (
                <img
                  src={`assets/images/${stop.location.imageUrl}`}
                  alt={stop.location?.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="flex-1">
                <Tooltip content={timeInfo} placement="bottom">
                  <div className="font-medium cursor-help">
                    {stop.location?.name}
                    {!isFirstStop && (
                      <span className="ml-2 text-sm text-gray-500">
                        {formatPrice(stop.price)}
                      </span>
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => onEdit(index)}
                type="button"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onClick={() => onDelete(index)}
                type="button"
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Component for adding/editing a stop
interface StopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stop: RouteStop) => void;
  editStop: RouteStop | null;
  isEditing: boolean;
  locations: Location[];
  currentStops: RouteStop[];
}

function StopFormModal({
  isOpen,
  onClose,
  onSave,
  editStop = null,
  isEditing,
  locations,
  currentStops,
}: StopFormModalProps) {
  const [formData, setFormData] = useState<RouteStop>({
    locationId: '',
    sequenceOrder: 0,
    timeOffsetMinutesArrival: 0,
    stopDurationMinutes: 5,
    price: 0,
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (editStop) {
      setFormData({
        ...editStop,
        // Ensure price is a number
        price: typeof editStop.price === 'number' ? editStop.price : 0,
      });
    } else {
      // Default data for new stop (will be updated by handleAddStop)
      setFormData({
        locationId: '',
        sequenceOrder: 1, // Default to first stop
        timeOffsetMinutesArrival: 0,
        stopDurationMinutes: 5,
        price: 0,
      });
    }
  }, [editStop, isOpen]);

  // Get list of already used location IDs (excluding current editing stop)
  const usedLocationIds = currentStops
    .filter((stop) => !(isEditing && editStop && stop.locationId === editStop.locationId))
    .map((stop) => stop.locationId);

  // Get selected location name for display
  const selectedLocation = locations.find((loc) => loc.id === formData.locationId);

  // Determine if this is the first stop (sequenceOrder = 1)
  // For new stops, check if it would be inserted at position 0
  // For editing stops, check if sequenceOrder is 1
  const wouldBeFirstStop = isEditing
    ? formData.sequenceOrder === 1
    : formData.sequenceOrder === 1;

  const isFirstStop = wouldBeFirstStop;

  // Calculate minimum arrival time based on previous stops
  const calculateMinArrivalTime = (): number => {
    if (isFirstStop) return 0;

    // Get all stops that come before this one in sequence
    const previousStops = currentStops
      .filter((stop) => stop.sequenceOrder < formData.sequenceOrder)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    if (previousStops.length === 0) return 0;

    // Calculate cumulative time: last stop's arrival time + its duration
    const lastStop = previousStops[previousStops.length - 1];
    return lastStop.timeOffsetMinutesArrival + lastStop.stopDurationMinutes;
  };

  const minArrivalTime = calculateMinArrivalTime();

  // Update arrival time when sequence order changes (for new stops)
  useEffect(() => {
    if (!isEditing && !isFirstStop && formData.timeOffsetMinutesArrival < minArrivalTime) {
      setFormData((prev) => ({
        ...prev,
        timeOffsetMinutesArrival: minArrivalTime,
      }));
    }
  }, [formData.sequenceOrder, minArrivalTime, isFirstStop, isEditing]);

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.locationId) {
      alert('Por favor seleccione una ubicación');
      return;
    }

    // For first stop, ensure time and price are 0
    let finalPrice = 0;
    if (!isFirstStop) {
      finalPrice = typeof formData.price === 'number' ? formData.price : 0;
    }
    const finalData = {
      ...formData,
      timeOffsetMinutesArrival: isFirstStop ? 0 : formData.timeOffsetMinutesArrival,
      price: finalPrice,
    };

    onSave(finalData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {isEditing ? 'Editar Parada' : 'Añadir Nueva Parada'}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Select
              label="Ubicación"
              placeholder="Seleccionar ubicación"
              selectedKeys={formData.locationId ? new Set([formData.locationId]) : new Set()}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                setFormData({ ...formData, locationId: selectedKey as string || '' });
              }}
              selectionMode="single"
              renderValue={(items) => {
                if (items.length === 0) return null;
                const item = items[0];
                const location = locations.find((loc) => loc.id === item.key);
                return location ? location.name : String(item.key);
              }}
              isRequired
              isInvalid={!formData.locationId}
              errorMessage={!formData.locationId ? 'La ubicación es obligatoria' : undefined}
            >
              {locations.map((location) => {
                const isAlreadyUsed = usedLocationIds.includes(location.id);
                return (
                  <SelectItem
                    key={location.id}
                    className={isAlreadyUsed ? 'opacity-50' : ''}
                    isDisabled={isAlreadyUsed}
                  >
                    {location.name}
                    {isAlreadyUsed && ' (ya agregada)'}
                  </SelectItem>
                );
              })}
            </Select>

            {/* Show time field only for non-first stops */}
            {!isFirstStop && (
              <Input
                type="number"
                label="Tiempo de llegada (minutos desde inicio)"
                value={formData.timeOffsetMinutesArrival?.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  setFormData({
                    ...formData,
                    timeOffsetMinutesArrival: value,
                  });
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  if (value < minArrivalTime) {
                    setFormData({
                      ...formData,
                      timeOffsetMinutesArrival: minArrivalTime,
                    });
                  }
                }}
                required
                min={minArrivalTime.toString()}
                description={`Tiempo mínimo: ${minArrivalTime} minutos (basado en paradas anteriores)`}
                isInvalid={formData.timeOffsetMinutesArrival < minArrivalTime}
                errorMessage={
                  formData.timeOffsetMinutesArrival < minArrivalTime
                    ? `El tiempo debe ser al menos ${minArrivalTime} minutos`
                    : undefined
                }
              />
            )}

            <Input
              type="number"
              label="Duración de la parada (minutos)"
              value={formData.stopDurationMinutes?.toString()}
              onChange={(e) => setFormData({
                ...formData,
                stopDurationMinutes: parseInt(e.target.value, 10) || 0,
              })}
              required
              min="0"
              description="Tiempo que el autobús permanece en esta parada"
            />

            {/* Show price field only for non-first stops */}
            {!isFirstStop && (
              <Input
                type="number"
                label="Precio del segmento"
                value={typeof formData.price === 'number' ? formData.price.toString() : '0'}
                onChange={(e) => setFormData({
                  ...formData,
                  price: safeParseFloat(e.target.value),
                })}
                required
                min="0"
                step="0.01"
                description="Precio adicional para llegar a esta parada desde la anterior"
              />
            )}

            {/* Info message for first stop */}
            {isFirstStop && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Primera parada:</strong>
                  {' '}
                  El tiempo de llegada es 0 (punto de inicio) y no tiene precio adicional.
                  {' '}
                  El precio base del viaje se configura en la información general de la ruta.
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onClick={handleSubmit}
            isDisabled={
              !formData.locationId
              || (!isFirstStop && formData.timeOffsetMinutesArrival < minArrivalTime)
            }
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Visual route stops editor component
interface StopsEditorProps {
  stops: RouteStop[];
  onStopsChange: (stops: RouteStop[]) => void;
}

function StopsEditor({ stops, onStopsChange }: StopsEditorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState<number | null>(null);
  const [editStopData, setEditStopData] = useState<RouteStop | null>(null);
  const [isEditingStop, setIsEditingStop] = useState(false);

  // Load locations list
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axiosInstance.get('/locations');
        setLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Handle adding a new stop
  const handleAddStop = () => {
    setIsEditingStop(false);

    const insertIndex = stops.length; // Always add at the end

    // Calculate minimum arrival time for the new stop
    const calculateNewStopMinTime = (): number => {
      if (insertIndex === 0) return 0; // First stop

      // Get all current stops and sort by sequence order
      const sortedStops = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

      // Find the stop that will be right before this new stop
      const stopBeforeIndex = insertIndex - 1;
      if (stopBeforeIndex < 0 || stopBeforeIndex >= sortedStops.length) return 0;

      const stopBefore = sortedStops[stopBeforeIndex];
      return stopBefore.timeOffsetMinutesArrival + stopBefore.stopDurationMinutes;
    };

    const defaultArrivalTime = calculateNewStopMinTime();

    // Create new stop data with correct sequence order
    const newStopData: RouteStop = {
      locationId: '',
      sequenceOrder: insertIndex + 1, // This will be the sequence order after insertion
      timeOffsetMinutesArrival: defaultArrivalTime,
      stopDurationMinutes: 5,
      price: 0,
    };

    setEditStopData(newStopData);
    setCurrentStopIndex(insertIndex);
    setIsStopModalOpen(true);
  };

  // Handle saving a stop
  const handleSaveStop = (stopData: RouteStop) => {
    const newStops = [...stops];
    const stop = {
      ...stopData,
      location: locations.find((loc) => loc.id === stopData.locationId),
    };

    if (isEditingStop && currentStopIndex !== null) {
      // Edit existing stop
      newStops[currentStopIndex] = stop;
    } else if (currentStopIndex !== null) {
      // Add new stop
      newStops.splice(currentStopIndex, 0, stop);
    }

    // Update sequence order for all stops
    const updatedStops = newStops.map((item, index) => ({
      ...item,
      sequenceOrder: index + 1,
    }));

    onStopsChange(updatedStops);
    setIsStopModalOpen(false);
    setCurrentStopIndex(null);
  };

  // Handle editing a stop
  const handleEditStop = (index: number) => {
    setIsEditingStop(true);
    setEditStopData(stops[index]);
    setCurrentStopIndex(index);
    setIsStopModalOpen(true);
  };

  // Handle deleting a stop
  const handleDeleteStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);

    // Update sequence order for remaining stops
    const updatedStops = newStops.map((stop, idx) => ({
      ...stop,
      sequenceOrder: idx + 1,
    }));

    onStopsChange(updatedStops);
  };

  // Get location by ID
  const getLocationById = (locationId: string): Location | undefined => (
    locations.find((location) => location.id === locationId)
  );

  // Enrich stops data with location data
  const enrichedStops = stops.map((stop) => ({
    ...stop,
    location: stop.location || getLocationById(stop.locationId),
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Paradas de la Ruta</h3>

      {/* Stops list */}
      <div className="relative">
        {enrichedStops.map((stop, index) => (
          <StopItem
            key={stop.id || `new-${index}`}
            stop={stop}
            index={index}
            onEdit={handleEditStop}
            onDelete={handleDeleteStop}
          />
        ))}

        {/* Empty state */}
        {enrichedStops.length === 0 && (
          <div className="flex justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="flat"
              className="rounded-full"
              onClick={handleAddStop}
              type="button"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Add stop at end button */}
        {enrichedStops.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="flat"
              className="rounded-full"
              onClick={handleAddStop}
              type="button"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal for adding/editing stops */}
      <StopFormModal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setEditStopData(null);
        }}
        onSave={handleSaveStop}
        editStop={editStopData}
        isEditing={isEditingStop}
        locations={locations}
        currentStops={stops}
      />
    </div>
  );
}

// Main route editing modal component
export function RouteModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEditing,
}: RouteModalProps) {
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    description: '',
    isActive: true,
    type: RouteType.REGULAR,
    boardingPrice: 0,
    stops: [],
  });

  // State for creating return route
  const [createReturnRoute, setCreateReturnRoute] = useState<boolean>(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        isActive: initialData.isActive,
        type: initialData.type,
        boardingPrice: safeParseFloat(initialData.boardingPrice),
        stops: initialData.stops || [],
      });
    } else {
      // Reset form data
      setFormData({
        name: '',
        description: '',
        isActive: true,
        type: RouteType.REGULAR,
        boardingPrice: 0,
        stops: [],
      });
      setCreateReturnRoute(false);
    }
  }, [initialData, isOpen]);

  // Handle form data changes
  const handleChange = (
    key: keyof RouteFormData,
    value: string | boolean | RouteType | RouteStop[] | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Calculate total price of the route
  const calculateTotalPrice = (): string => {
    const boardingPrice = formData.boardingPrice || 0;
    const segmentsPrice = formData.stops.reduce(
      (sum, stop, index) => (index === 0 ? sum : sum + (typeof stop.price === 'number' ? stop.price : 0)),
      0,
    );
    const totalPrice = boardingPrice + segmentsPrice;
    return formatPrice(totalPrice);
  };

  // Validate that there are no duplicate locations
  const hasDuplicateLocations = (): boolean => {
    const locationIds = formData.stops.map((stop) => stop.locationId);
    const uniqueLocationIds = new Set(locationIds);
    return locationIds.length !== uniqueLocationIds.size;
  };

  // Create return route data
  const createReturnRouteData = (originalRoute: RouteFormData): RouteFormData => {
    const reversedStops = [...originalRoute.stops].reverse();

    const recalculatedStops = reversedStops.map((stop, index) => {
      if (index === 0) {
        // First stop in return route (was last in original) - arrival time is 0, price is 0
        return {
          ...stop,
          sequenceOrder: 1,
          timeOffsetMinutesArrival: 0,
          price: 0,
        };
      }

      // For subsequent stops, use the duration from the previous stop in the original sequence
      const previousStopInOriginal = reversedStops[index - 1];
      const previousStopInReturn = reversedStops[index - 1];
      const newArrivalTime = previousStopInReturn.timeOffsetMinutesArrival
        + previousStopInOriginal.stopDurationMinutes;

      // Price calculation: get the price from the next stop in the original route
      const originalStopIndex = originalRoute.stops.length - 1 - index;
      const nextStopInOriginal = originalRoute.stops[originalStopIndex + 1];
      const segmentPrice = nextStopInOriginal ? nextStopInOriginal.price : 0;

      return {
        ...stop,
        sequenceOrder: index + 1,
        timeOffsetMinutesArrival: newArrivalTime,
        price: segmentPrice,
      };
    });

    const returnRouteData: RouteFormData = {
      name: `Retorno: ${originalRoute.name}`,
      description: `Ruta de retorno para: ${originalRoute.description || originalRoute.name}`,
      isActive: originalRoute.isActive,
      type: originalRoute.type,
      boardingPrice: originalRoute.boardingPrice,
      stops: recalculatedStops,
    };

    return returnRouteData;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Check for duplicate locations
    if (hasDuplicateLocations()) {
      alert('No se puede guardar la ruta: hay ubicaciones duplicadas');
      return;
    }

    try {
      // Save the main route
      await onSave(formData);

      // If creating return route and this is a new route (not editing)
      if (createReturnRoute && !isEditing) {
        const returnRouteData = createReturnRouteData(formData);
        // Save the return route
        await onSave(returnRouteData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {isEditing ? 'Editar ruta' : 'Crear nueva ruta'}
        </ModalHeader>
        <ModalBody>
          <form>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <Input
                label="Nombre"
                placeholder="Ingrese el nombre de la ruta"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                autoFocus
              />
              <Textarea
                label="Descripción"
                placeholder="Ingrese la descripción de la ruta"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Tipo de ruta"
                  selectedKeys={[formData.type]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    handleChange('type', selectedKey as RouteType);
                  }}
                  selectionMode="single"
                  disallowEmptySelection
                >
                  <SelectItem key="direct">Directa</SelectItem>
                  <SelectItem key="semi-direct">Semi-directa</SelectItem>
                  <SelectItem key="regular">Regular</SelectItem>
                </Select>
                <Switch
                  isSelected={formData.isActive}
                  onValueChange={(value) => handleChange('isActive', value)}
                >
                  Activa
                </Switch>
                <Input
                  type="number"
                  label="Precio base (embarque)"
                  placeholder="0.00"
                  value={formData.boardingPrice.toString()}
                  onChange={(e) => handleChange('boardingPrice', safeParseFloat(e.target.value))}
                  step="0.01"
                  min="0"
                  startContent={(
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  )}
                />
              </div>

              {/* Return route option - only show when creating new route */}
              {!isEditing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Switch
                    isSelected={createReturnRoute}
                    onValueChange={setCreateReturnRoute}
                    size="sm"
                  >
                    <span className="text-sm">
                      Crear ruta de retorno automáticamente
                    </span>
                  </Switch>
                  {createReturnRoute && (
                    <p className="text-xs text-blue-600 mt-2">
                      Se creará automáticamente una ruta de regreso con las paradas en orden
                      inverso y los tiempos de llegada recalculados.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <StopsEditor
                  stops={formData.stops}
                  onStopsChange={(stops) => handleChange('stops', stops)}
                />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onClick={handleSubmit}
            isDisabled={formData.stops.length < 2 || hasDuplicateLocations()}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default RouteModal;
