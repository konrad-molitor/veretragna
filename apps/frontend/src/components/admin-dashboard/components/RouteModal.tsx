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
  ArrowsUpDownIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  initialData?: {
    id?: string;
    name: string;
    description: string;
    isActive: boolean;
    type: RouteType;
    boardingPrice: number;
    stops: RouteStop[];
  };
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

// Draggable stop component
interface DraggableStopProps {
  stop: RouteStop;
  index: number;
  moveStop: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function DraggableStop({
  stop,
  index,
  moveStop,
  onEdit,
  onDelete,
}: DraggableStopProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'STOP',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'STOP',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveStop(draggedItem.index, index);
        // This is required by the DnD library

        draggedItem.index = index;
      }
    },
  });

  // Check if this is the first stop
  const isFirstStop = stop.sequenceOrder === 1;

  // Tooltip text with time and price information
  const timeInfo = `Tiempo de llegada: ${stop.timeOffsetMinutesArrival} min desde inicio
Duración de la parada: ${stop.stopDurationMinutes} min
${!isFirstStop ? `Precio: ${formatPrice(stop.price)}` : ''}`;

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="mb-2"
    >
      <Card className="w-full">
        <CardBody className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-400 cursor-move" />
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
  editStop?: RouteStop;
  isEditing: boolean;
  locations: Location[];
}

function StopFormModal({
  isOpen,
  onClose,
  onSave,
  editStop,
  isEditing,
  locations,
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
      setFormData({
        locationId: '',
        sequenceOrder: 0,
        timeOffsetMinutesArrival: 0,
        stopDurationMinutes: 5,
        price: 0,
      });
    }
  }, [editStop, isOpen]);

  const handleSubmit = () => {
    onSave({
      ...formData,
      // Ensure price is a number before saving
      price: typeof formData.price === 'number' ? formData.price : 0,
    });
    onClose();
  };

  // Determine if this is the first stop (sequenceOrder = 1)
  const isFirstStop = formData.sequenceOrder === 1;

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
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              required
            >
              {locations.map((location) => (
                <SelectItem key={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </Select>
            <Input
              type="number"
              label="Tiempo de llegada (minutos desde inicio)"
              value={formData.timeOffsetMinutesArrival?.toString()}
              onChange={(e) => setFormData({
                ...formData,
                timeOffsetMinutesArrival: parseInt(e.target.value, 10) || 0,
              })}
              required
              min="0"
            />
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
            />
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
              isDisabled={isFirstStop}
              description={isFirstStop ? 'El primer segmento no tiene precio' : undefined}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSubmit}>
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
  const [editStopData, setEditStopData] = useState<RouteStop | undefined>(undefined);
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

  // Handle stop drag and drop
  const moveStop = (dragIndex: number, hoverIndex: number) => {
    const newStops = [...stops];
    const draggedStop = newStops[dragIndex];

    // Remove stop from old position
    newStops.splice(dragIndex, 1);

    // Insert into new position
    newStops.splice(hoverIndex, 0, draggedStop);

    // Update sequence order for all stops
    const updatedStops = newStops.map((stop, index) => ({
      ...stop,
      sequenceOrder: index + 1,
    }));

    onStopsChange(updatedStops);
  };

  // Handle adding a new stop
  const handleAddStop = (position: 'start' | 'end' | number) => {
    setIsEditingStop(false);
    setEditStopData(undefined);

    let insertIndex = 0;
    if (position === 'end') {
      insertIndex = stops.length;
    } else if (typeof position === 'number') {
      insertIndex = position + 1;
    }

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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Paradas de la Ruta</h3>

        {/* Add stop at start button */}
        {enrichedStops.length > 0 && (
          <div className="flex justify-center">
            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="flat"
              className="rounded-full"
              onClick={() => handleAddStop('start')}
              type="button"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Stops list */}
        <div className="relative">
          {enrichedStops.map((stop, index) => (
            <React.Fragment key={stop.id || `new-${index}`}>
              <DraggableStop
                stop={stop}
                index={index}
                moveStop={moveStop}
                onEdit={handleEditStop}
                onDelete={handleDeleteStop}
              />

              {/* Add stop between button */}
              {index !== enrichedStops.length - 1 && (
                <div className="flex justify-center my-2 h-8 relative">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="relative z-10 rounded-full"
                    onClick={() => handleAddStop(index)}
                    type="button"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </React.Fragment>
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
                onClick={() => handleAddStop('end')}
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
                onClick={() => handleAddStop('end')}
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
          onClose={() => setIsStopModalOpen(false)}
          onSave={handleSaveStop}
          editStop={editStopData}
          isEditing={isEditingStop}
          locations={locations}
        />
      </div>
    </DndProvider>
  );
}


// Main route editing modal component
export function RouteModal({
  isOpen,
  onClose,
  onSave,
  initialData,
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

  // Handle form submission
  const handleSubmit = async () => {
    try {
      await onSave(formData);
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
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as RouteType)}
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
          <Button color="primary" onClick={handleSubmit} isDisabled={formData.stops.length < 2}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default RouteModal;
