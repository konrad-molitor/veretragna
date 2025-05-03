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

interface AssignTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
}

function AssignTripModal({ isOpen, onClose, trip }: AssignTripModalProps) {
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

  // Fetch buses and drivers when modal opens
  useEffect(() => {
    if (isOpen && trip) {
      fetchData();
      // Pre-select existing values if present
      setSelectedBusId(trip.busId || '');
      setSelectedDriverId(trip.driverId || '');
    }
  }, [isOpen, trip]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!trip) return;

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

      // If both bus and driver are assigned, update status to SCHEDULED
      if (selectedBusId && selectedDriverId && trip.status === 'pending') {
        updateData.status = 'scheduled';
      }

      // Update trip
      await axiosInstance.patch(`/trips/${trip.id}`, updateData);

      toast.success('Viaje actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast.error('Error al actualizar el viaje');
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
              Asignar Autobús y Conductor
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="text-center py-4">Cargando datos...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="bus-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Autobús
                    </label>
                    <Select
                      id="bus-select"
                      placeholder="Seleccionar autobús"
                      selectedKeys={selectedBusId ? [selectedBusId] : []}
                      onChange={(e) => setSelectedBusId(e.target.value)}
                      className="w-full"
                    >
                      {buses.map((bus) => (
                        <SelectItem key={bus.id}>
                          {`${bus.licensePlate} - ${bus.model}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="driver-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Conductor
                    </label>
                    <Select
                      id="driver-select"
                      placeholder="Seleccionar conductor"
                      selectedKeys={selectedDriverId ? [selectedDriverId] : []}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full"
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

export default AssignTripModal; 