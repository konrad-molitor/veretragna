import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../../app/utils/axiosInstance';
import { BusLicensePlateInput } from './BusLicensePlateInput';

interface Bus {
  id: string;
  licensePlate: string;
  model: string;
  type: 'microbus' | 'omnibus' | 'minibus';
  totalSeats: {
    regular?: number;
    comfort?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface BusFormData {
  licensePlate: string;
  model: string;
  type: 'microbus' | 'omnibus' | 'minibus';
  totalSeats: {
    regular?: number;
    comfort?: number;
  };
}

const defaultBusFormData: BusFormData = {
  licensePlate: '',
  model: '',
  type: 'minibus',
  totalSeats: {
    regular: 36,
    comfort: 4,
  },
};

export function BusesPanel() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BusFormData>(defaultBusFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBusId, setCurrentBusId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['microbus', 'omnibus', 'minibus']));

  const handleInputChange = (field: keyof BusFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSeatsChange = (type: 'regular' | 'comfort', value: string) => {
    const seatsCount = parseInt(value, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      totalSeats: {
        ...prev.totalSeats,
        [type]: seatsCount,
      },
    }));
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/buses');
      setBuses(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError('Error al cargar la lista de omnibus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const getTotalSeatsCount = (totalSeats: Record<string, number>): number => Object
    .values(totalSeats)
    .reduce((sum, count) => sum + count, 0);

  const formatSeatsDisplay = (totalSeats: Record<string, number>): string => {
    const parts = [];
    if (totalSeats.regular) {
      parts.push(`Regular: ${totalSeats.regular}`);
    }
    if (totalSeats.comfort) {
      parts.push(`Confort: ${totalSeats.comfort}`);
    }
    return parts.join(' + ');
  };

  const formatBusType = (type: string): string => {
    const types = {
      microbus: 'Microbus',
      omnibus: 'Ómnibus',
      minibus: 'Minibus',
    };
    return types[type as keyof typeof types] || type;
  };

  // Filter buses based on search and type filters
  const filteredBuses = useMemo(() => buses.filter((bus) => {
    if (!bus || !bus.licensePlate) return false;

    const matchesSearch = bus.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.has(bus?.type);

    return matchesSearch && matchesType;
  }), [buses, searchQuery, selectedTypes]);

  const handleTypeFilterChange = (types: string[]) => {
    setSelectedTypes(new Set(types));
  };

  const handleEditBus = (id: string) => {
    const busToEdit = buses.find((bus) => bus.id === id);
    if (busToEdit) {
      setFormData({
        licensePlate: busToEdit.licensePlate,
        model: busToEdit.model,
        type: busToEdit.type,
        totalSeats: busToEdit.totalSeats,
      });
      setIsEditing(true);
      setCurrentBusId(id);
      setIsModalOpen(true);
    }
  };

  const handleAddBus = () => {
    setFormData(defaultBusFormData);
    setIsEditing(false);
    setCurrentBusId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
      };

      if (isEditing && currentBusId) {
        // Update existing bus
        await axiosInstance.patch(`/buses/${currentBusId}`, submitData);

        // Refresh buses list
        await fetchBuses();
      } else {
        // Create new bus
        await axiosInstance.post('/buses', submitData);

        // Refresh buses list
        await fetchBuses();
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving bus:', err);
      // Here you might want to show an error message to the user
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este vehículo?')) {
      try {
        await axiosInstance.delete(`/buses/${id}`);
        // Refresh buses list
        await fetchBuses();
      } catch (err) {
        console.error('Error deleting bus:', err);
        // Show error message
      }
    }
  };

  const renderCell = (bus: Bus, columnKey: string) => {
    switch (columnKey) {
      case 'licensePlate':
        return <div>{bus.licensePlate}</div>;
      case 'model':
        return <div>{bus.model}</div>;
      case 'type':
        return <Chip>{formatBusType(bus.type)}</Chip>;
      case 'totalSeats':
        return (
          <div>
            <div>{getTotalSeatsCount(bus.totalSeats)}</div>
            <div className="text-xs text-gray-500">{formatSeatsDisplay(bus.totalSeats)}</div>
          </div>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => handleEditBus(bus.id)}
              type="button"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onClick={() => handleDeleteBus(bus.id)}
              type="button"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return <div>{String(bus[columnKey as keyof Bus])}</div>;
    }
  };

  const columns = [
    { name: 'Matrícula', uid: 'licensePlate' },
    { name: 'Modelo', uid: 'model' },
    { name: 'Tipo', uid: 'type' },
    { name: 'Total Asientos', uid: 'totalSeats' },
    { name: 'Acciones', uid: 'actions' },
  ];

  if (loading) {
    return <div className="p-6">Cargando omnibus...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Vehículos</h2>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          startContent={<PlusIcon className="h-4 w-4" />}
          onClick={handleAddBus}
          type="button"
        >
          Añadir Nuevo Vehículo
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Table */}
        <div className="flex-1">
          <Table
            aria-label="Tabla de omnibus"
            isStriped
            removeWrapper
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={filteredBuses}
              emptyContent="No hay omnibus registrados"
            >
              {(bus) => (
                <TableRow key={bus.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(bus, columnKey.toString())}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Filter panel */}
        <div className="w-full md:w-80 p-4 bg-gray-50 rounded-lg">
          {/* License plate search */}
          <div className="mb-6">
            <Input
              label="Buscar por matrícula"
              labelPlacement="outside"
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Matrícula del omnibus"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Bus type filter */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Tipo de vehículo</div>
            <CheckboxGroup
              value={Array.from(selectedTypes)}
              onValueChange={handleTypeFilterChange}
            >
              <Checkbox value="microbus">Microbus</Checkbox>
              <Checkbox value="omnibus">Ómnibus</Checkbox>
              <Checkbox value="minibus">Minibus</Checkbox>
            </CheckboxGroup>
          </div>
        </div>
      </div>

      {/* Modal for adding/editing bus */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Editar Omnibus' : 'Añadir Nuevo Omnibus'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <BusLicensePlateInput
                  value={formData.licensePlate}
                  onChange={(value) => handleInputChange('licensePlate', value)}
                />
              </div>

              <Input
                label="Modelo"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
              />
              <Select
                label="Tipo"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                <SelectItem key="microbus">Microbus</SelectItem>
                <SelectItem key="omnibus">Ómnibus</SelectItem>
                <SelectItem key="minibus">Minibus</SelectItem>
              </Select>
              <div>
                <p className="text-sm mb-2">Número de asientos</p>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    label="Regular"
                    value={formData.totalSeats.regular?.toString() || '0'}
                    onChange={(e) => handleSeatsChange('regular', e.target.value)}
                    required
                    min="0"
                  />
                  <Input
                    type="number"
                    label="Confort"
                    value={formData.totalSeats.comfort?.toString() || '0'}
                    onChange={(e) => handleSeatsChange('comfort', e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleSubmit}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
