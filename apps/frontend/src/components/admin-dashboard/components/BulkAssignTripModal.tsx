import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../app/utils/axiosInstance';

// Interfaces
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
}

interface Trip {
  id: string;
  status: string;
  busId?: string;
  driverId?: string;
}

interface BulkAssignTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrips: Trip[];
}

function BulkAssignTripModal({ isOpen, onClose, selectedTrips }: BulkAssignTripModalProps) {
  // State
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch buses and drivers from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch buses
      const busesResponse = await axiosInstance.get('/buses');
      setBuses(busesResponse.data);

      // Fetch drivers (users with type=driver)
      const driversResponse = await axiosInstance.get('/users?type=driver');
      setDrivers(driversResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar la información de autobuses y conductores');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedBusId('');
      setSelectedDriverId('');
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedTrips.length === 0) return;

    // Validate input
    if (!selectedBusId && !selectedDriverId) {
      toast.error('Por favor, seleccione un autobús o un conductor');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare data for update
      const updateData: Record<string, string> = {};
      if (selectedBusId) updateData.busId = selectedBusId;
      if (selectedDriverId) updateData.driverId = selectedDriverId;

      // If both bus and driver are assigned, update status to SCHEDULED for pending trips
      if (selectedBusId && selectedDriverId) {
        updateData.updateStatus = 'true'; // This will let backend know to update status if needed
      }

      // Get all trip IDs
      const tripIds = selectedTrips.map((trip) => trip.id);

      // Send bulk update request
      await axiosInstance.patch('/trips/bulk', {
        tripIds,
        updateData,
      });

      toast.success(`${selectedTrips.length} viajes actualizados correctamente`);
      onClose();
    } catch (error) {
      console.error('Error updating trips:', error);
      toast.error('Error al actualizar los viajes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="md"
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Asignación Masiva -
              {' '}
              {selectedTrips.length}
              {' '}
              viaje
              {selectedTrips.length !== 1 ? 's' : ''}
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Está a punto de actualizar
                    {' '}
                    {selectedTrips.length}
                    {' '}
                    viaje
                    {selectedTrips.length !== 1 ? 's' : ''}
                    .
                    Esta operación reemplazará la asignación actual de autobús y/o
                    conductor para todos los viajes seleccionados.
                  </p>
                  <div>
                    <label
                      htmlFor="bulk-bus-select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Autobús
                    </label>
                    <Select
                      id="bulk-bus-select"
                      placeholder="Seleccionar autobús"
                      selectedKeys={selectedBusId ? [selectedBusId] : []}
                      onChange={(e) => setSelectedBusId(e.target.value)}
                      className="w-full"
                      aria-labelledby="bulk-bus-label"
                    >
                      {buses.map((bus) => (
                        <SelectItem key={bus.id}>
                          {`${bus.licensePlate} - ${bus.model}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="bulk-driver-select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                      id="bulk-driver-label"
                    >
                      Conductor
                    </label>
                    <Select
                      id="bulk-driver-select"
                      placeholder="Seleccionar conductor"
                      selectedKeys={selectedDriverId ? [selectedDriverId] : []}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full"
                      aria-labelledby="bulk-driver-label"
                    >
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id}>
                          {`${driver.firstName} ${driver.lastName}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={closeModal}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onClick={handleSubmit}
                isDisabled={isSubmitting || loading}
                isLoading={isSubmitting}
              >
                Guardar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default BulkAssignTripModal;
