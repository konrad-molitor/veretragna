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
  Checkbox,
  Card,
  CardBody,
  Tooltip,
} from '@heroui/react';
import { PlusCircleIcon, XCircleIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

// Import DND library
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axiosInstance from '../../../app/utils/axiosInstance';

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
    stops: RouteStop[];
  };
  isEditing: boolean;
}

const defaultFormData: RouteFormData = {
  name: '',
  description: '',
  isActive: true,
  type: RouteType.REGULAR,
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

  // Tooltip text with time information
  const timeInfo = `Tiempo de llegada: ${stop.timeOffsetMinutesArrival} min desde inicio\nDuración de la parada: ${stop.stopDurationMinutes} min`;

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
                  <div className="font-medium cursor-help">{stop.location?.name}</div>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
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
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (editStop) {
      setFormData({
        ...editStop,
      });
    } else {
      setFormData({
        locationId: '',
        sequenceOrder: 0,
        timeOffsetMinutesArrival: 0,
        stopDurationMinutes: 5,
      });
    }
  }, [editStop, isOpen]);

  const handleSubmit = () => {
    onSave(formData);
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
              value={formData.timeOffsetMinutesArrival.toString()}
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
              value={formData.stopDurationMinutes.toString()}
              onChange={(e) => setFormData({
                ...formData,
                stopDurationMinutes: parseInt(e.target.value, 10) || 0,
              })}
              required
              min="0"
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
function RouteModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditing,
}: RouteModalProps) {
  const [formData, setFormData] = useState<RouteFormData>(defaultFormData);

  // Initialize form data when modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        isActive: initialData.isActive,
        type: initialData.type,
        stops: initialData.stops || [],
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, isOpen]);

  // Handle form field changes
  const handleInputChange = (
    field: keyof RouteFormData,
    value: string | boolean | RouteType | RouteStop[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        <ModalHeader>
          {isEditing ? 'Editar Ruta' : 'Crear Nueva Ruta'}
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Nombre de la ruta"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
              <Input
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              <Select
                label="Tipo de ruta"
                selectedKeys={[formData.type]}
                onChange={(e) => handleInputChange('type', e.target.value as RouteType)}
                required
              >
                <SelectItem key={RouteType.DIRECT}>
                  Directo
                </SelectItem>
                <SelectItem key={RouteType.SEMI_DIRECT}>
                  Semi-Directo
                </SelectItem>
                <SelectItem key={RouteType.REGULAR}>
                  Regular
                </SelectItem>
              </Select>
              <div className="flex items-center">
                <Checkbox
                  isSelected={formData.isActive}
                  onValueChange={(value) => handleInputChange('isActive', value)}
                  id="route-active"
                >
                  Ruta activa
                </Checkbox>
              </div>
            </div>

            <div className="space-y-4">
              <StopsEditor
                stops={formData.stops}
                onStopsChange={(stops) => handleInputChange('stops', stops)}
              />
            </div>
          </div>
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

export { RouteModal };
export default RouteModal;
