import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../app/utils/axiosInstance';

// Define Location interface based on backend model
interface Location {
  id: string;
  name: string;
  address?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Define error response interface для типизации ошибок
interface ApiValidationError {
  property: string;
  constraints: Record<string, string>;
}

// Default empty location for the form
const emptyLocation: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  address: '',
  imageUrl: '',
  description: '',
};

export function LocationsPanel() {
  // State for locations data
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State for the form
  const [formData, setFormData] = useState<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>({ ...emptyLocation });
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Handle modal close and reset form
  const handleCloseModal = () => {
    onClose();
    setCurrentId(null);
    setFormData({ ...emptyLocation });
    setFormErrors({});
  };

  // Fetch all locations from the API
  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/locations');
      setLocations(response.data);
      setFilteredLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Error al cargar las ubicaciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Filter locations when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations
        .filter((location) => location.name.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredLocations(filtered);
    }
  }, [searchQuery, locations]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let parsedValue: string | number | undefined = value;
    if (name === 'latitude' || name === 'longitude') {
      parsedValue = value === '' ? undefined : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }

    if (formData.imageUrl && !/^https?:\/\/.+/.test(formData.imageUrl)) {
      errors.imageUrl = 'La URL de la imagen debe ser válida';
    }

    if (formData.latitude !== undefined
        && (Number.isNaN(Number(formData.latitude))
            || Number(formData.latitude) < -90
            || Number(formData.latitude) > 90)) {
      errors.latitude = 'La latitud debe estar entre -90 y 90';
    }

    if (formData.longitude !== undefined
        && (Number.isNaN(Number(formData.longitude))
            || Number(formData.longitude) < -180
            || Number(formData.longitude) > 180)) {
      errors.longitude = 'La longitud debe estar entre -180 y 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/edit form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Создаем копию данных формы для преобразования значений
      const formDataToSubmit = {
        ...formData,
        // Преобразуем строковые значения в числа, если они определены
        latitude: formData.latitude !== undefined ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== undefined ? Number(formData.longitude) : undefined,
      };

      if (currentId) {
        // Update existing location
        await axiosInstance.patch(`/locations/${currentId}`, formDataToSubmit);
        toast.success('Ubicación actualizada con éxito');
      } else {
        // Create new location
        await axiosInstance.post('/locations', formDataToSubmit);
        toast.success('Ubicación creada con éxito');
      }

      // Refresh the locations list and close the modal
      fetchLocations();
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Error saving location:', error);
      // Показываем более детальную ошибку, если доступно
      if (error && typeof error === 'object' && 'response' in error
          && error.response && typeof error.response === 'object'
          && 'data' in error.response && error.response.data
          && typeof error.response.data === 'object' && 'errors' in error.response.data
          && Array.isArray(error.response.data.errors)) {
        const errorMessages = (error.response.data.errors as ApiValidationError[]).map((err) => (
          `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`
        )).join('; ');
        toast.error(errorMessages || 'Error al procesar los datos');
      } else {
        toast.error(currentId ? 'Error al actualizar la ubicación' : 'Error al crear la ubicación');
      }
    }
  };

  // Восстановим handleDelete для модального окна
  const handleDelete = async () => {
    if (!currentId) return;

    try {
      await axiosInstance.delete(`/locations/${currentId}`);
      toast.success('Ubicación eliminada con éxito');

      // Refresh the locations list and close the modal
      fetchLocations();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Error al eliminar la ubicación');
    }
  };

  // Функция прямого удаления локации из карточки
  const handleDirectDelete = (locationId: string) => {
    // Используем отдельную функцию без состояния компонента
    const deleteLocation = async () => {
      try {
        await axiosInstance.delete(`/locations/${locationId}`);
        toast.success('Ubicación eliminada con éxito');
        fetchLocations();
      } catch (error) {
        console.error('Error deleting location:', error);
        toast.error('Error al eliminar la ubicación');
      }
    };

    deleteLocation();
  };

  // Open modal for creating a new location
  const handleCreateNew = () => {
    setCurrentId(null);
    setFormData({ ...emptyLocation });
    setFormErrors({});
    onOpen();
  };

  // Open modal for editing an existing location
  const handleEdit = (location: Location) => {
    setCurrentId(location.id);
    setFormData({
      name: location.name,
      address: location.address || '',
      imageUrl: location.imageUrl || '',
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description || '',
    });
    setFormErrors({});
    onOpen();
  };

  // Render loading state
  const renderLoading = () => (
    <div className="text-center py-10">Cargando ubicaciones...</div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex items-center justify-center min-h-[400px] text-gray-500">
      {searchQuery
        ? 'No se encontraron ubicaciones con ese nombre.'
        : 'No hay ubicaciones disponibles.'}
    </div>
  );

  // Render locations grid
  const renderLocationsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredLocations.map((location) => (
        <Card
          key={location.id}
          className="group relative overflow-hidden aspect-square hover:shadow-lg transition-shadow duration-300"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: location.imageUrl
                ? `url(assets/images/${location.imageUrl})`
                : 'url(https://via.placeholder.com/400x400?text=Sin+Imagen)',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <h3 className="text-xl font-bold text-white">{location.name}</h3>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-white h-full flex flex-col p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{location.name}</h3>

            {location.description && (
              <p className="text-sm text-gray-600 mb-4 flex-grow overflow-auto">
                {location.description}
              </p>
            )}

            {!location.description && <div className="flex-grow" />}

            <div className="flex gap-2 mt-auto">
              <Button
                size="sm"
                color="primary"
                className="flex-1"
                startContent={<PencilIcon className="h-4 w-4" />}
                onClick={() => handleEdit(location)}
              >
                Editar
              </Button>

              <Button
                size="sm"
                color="danger"
                variant="light"
                className="flex-1"
                startContent={<TrashIcon className="h-4 w-4" />}
                onClick={() => handleDirectDelete(location.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search and Create button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-80">
          <Input
            type="text"
            placeholder="Buscar ubicaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          />
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onClick={handleCreateNew}
        >
          Nueva Ubicación
        </Button>
      </div>

      {/* Locations grid */}
      {isLoading && renderLoading()}
      {!isLoading && filteredLocations.length === 0 && renderEmptyState()}
      {!isLoading && filteredLocations.length > 0 && renderLocationsGrid()}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="3xl">
        <ModalContent>
          {(modalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {currentId ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </ModalHeader>
              <form onSubmit={handleSubmit}>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Nombre"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.name}
                        errorMessage={formErrors.name}
                        isRequired
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Dirección"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="URL de Imagen"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.imageUrl}
                        errorMessage={formErrors.imageUrl}
                      />
                    </div>

                    <div>
                      <Input
                        label="Latitud"
                        name="latitude"
                        type="number"
                        value={formData.latitude === undefined ? '' : String(formData.latitude)}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.latitude}
                        errorMessage={formErrors.latitude}
                      />
                    </div>

                    <div>
                      <Input
                        label="Longitud"
                        name="longitude"
                        type="number"
                        value={formData.longitude === undefined ? '' : String(formData.longitude)}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.longitude}
                        errorMessage={formErrors.longitude}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  {currentId && (
                    <Button
                      color="danger"
                      variant="light"
                      startContent={<TrashIcon className="h-4 w-4" />}
                      onClick={handleDelete}
                      className="mr-auto"
                    >
                      Eliminar
                    </Button>
                  )}
                  <Button variant="light" onPress={modalClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    {currentId ? 'Actualizar' : 'Crear'}
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default LocationsPanel;
