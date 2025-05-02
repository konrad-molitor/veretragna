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
  Select,
  SelectItem,
  Tooltip,
} from '@heroui/react';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../../../app/utils/axiosInstance';
import RouteModal from './RouteModal';

// Defining interfaces for routes and stops
interface Location {
  id: string;
  name: string;
}

interface RouteStop {
  id: string;
  location: Location;
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
}

// Route type
enum RouteType {
  DIRECT = 'direct',
  SEMI_DIRECT = 'semi-direct',
  REGULAR = 'regular'
}

interface Route {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  type: RouteType;
  stops: RouteStop[];
  createdAt: string;
  updatedAt: string;
}

// Interface for route form data
interface RouteFormData {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  type: RouteType;
  stops: Array<{
    id?: string;
    locationId: string;
    location?: Location;
    sequenceOrder: number;
    timeOffsetMinutesArrival: number;
    stopDurationMinutes: number;
  }>;
}

export function RoutesPanel() {
  // Routes list state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['direct', 'semi-direct', 'regular']));

  // List of all locations for filtering
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  // Modal window state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RouteFormData | undefined>(undefined);

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/routes');
      setRoutes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Error al cargar la lista de rutas');
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations for filter
  const fetchLocations = async () => {
    try {
      const response = await axiosInstance.get('/locations');
      setAllLocations(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchRoutes();
    fetchLocations();
  }, []);

  // Format route type for display
  const formatRouteType = (type: string): string => {
    const types = {
      direct: 'Directo',
      'semi-direct': 'Semi-Directo',
      regular: 'Regular',
    };
    return types[type as keyof typeof types] || type;
  };

  // Filter routes based on filters
  const filteredRoutes = useMemo(() => routes.filter((route) => {
    if (!route) return false;

    // Filter by name
    const matchesName = route.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by activity
    const matchesActive = activeFilter === null
      || (activeFilter === 'active' && route.isActive)
      || (activeFilter === 'inactive' && !route.isActive);

    // Filter by type
    const matchesType = selectedTypes.has(route.type);

    // Filter by locations
    const matchesLocations = selectedLocationIds.size === 0
      || route.stops.some((stop) => selectedLocationIds.has(stop.location.id));

    return matchesName && matchesActive && matchesType && matchesLocations;
  }), [routes, searchQuery, activeFilter, selectedTypes, selectedLocationIds]);

  // Filter change handlers
  const handleTypeFilterChange = (types: string[]) => {
    setSelectedTypes(new Set(types));
  };

  const handleLocationFilterChange = (locationIds: string[]) => {
    setSelectedLocationIds(new Set(locationIds));
  };

  // Route edit handler
  const handleEditRoute = (id: string) => {
    const routeToEdit = routes.find((route) => route.id === id);

    if (routeToEdit) {
      // Convert data to the required format
      const routeFormData: RouteFormData = {
        id: routeToEdit.id,
        name: routeToEdit.name,
        description: routeToEdit.description || '',
        isActive: routeToEdit.isActive,
        type: routeToEdit.type,
        stops: routeToEdit.stops.map((stop) => ({
          id: stop.id,
          locationId: stop.location.id,
          location: stop.location,
          sequenceOrder: stop.sequenceOrder,
          timeOffsetMinutesArrival: stop.timeOffsetMinutesArrival,
          stopDurationMinutes: stop.stopDurationMinutes,
        })),
      };

      setFormData(routeFormData);
      setCurrentRouteId(id);
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  // Add new route handler
  const handleAddRoute = () => {
    setFormData(undefined);
    setCurrentRouteId(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Save route handler
  const handleSaveRoute = async (data: RouteFormData) => {
    try {
      if (isEditing && currentRouteId) {
        // Update existing route
        await axiosInstance.patch(`/routes/${currentRouteId}`, {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          type: data.type,
        });

        // Update stops separately for each route
        // This is a simplified approach - in a real application
        // more complex logic might be needed for adding/removing/updating stops
        const stopPromises = data.stops.map(async (stop) => {
          if (stop.id) {
            // Existing stop - update
            return axiosInstance.patch(`/routes/${currentRouteId}/stops/${stop.id}`, {
              locationId: stop.locationId,
              sequenceOrder: stop.sequenceOrder,
              timeOffsetMinutesArrival: stop.timeOffsetMinutesArrival,
              stopDurationMinutes: stop.stopDurationMinutes,
            });
          }
          // New stop - add
          return axiosInstance.post(`/routes/${currentRouteId}/stops`, {
            locationId: stop.locationId,
            sequenceOrder: stop.sequenceOrder,
            timeOffsetMinutesArrival: stop.timeOffsetMinutesArrival,
            stopDurationMinutes: stop.stopDurationMinutes,
          });
        });

        await Promise.all(stopPromises);
      } else {
        // Create new route
        await axiosInstance.post('/routes', {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          type: data.type,
          stops: data.stops.map((stop) => ({
            locationId: stop.locationId,
            sequenceOrder: stop.sequenceOrder,
            timeOffsetMinutesArrival: stop.timeOffsetMinutesArrival,
            stopDurationMinutes: stop.stopDurationMinutes,
          })),
        });
      }

      // Update routes list
      fetchRoutes();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving route:', err);
      // Error handling can be added here
    }
  };

  // Delete route handler
  const handleDeleteRoute = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta ruta?')) {
      try {
        await axiosInstance.delete(`/routes/${id}`);
        // Update routes list
        fetchRoutes();
      } catch (err) {
        console.error('Error deleting route:', err);
        // Error handling can be added here
      }
    }
  };

  // Render table cells
  const renderCell = (route: Route, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <Tooltip
            content={route.description || 'Sin descripción'}
            placement="bottom"
          >
            <div className="cursor-help font-medium">{route.name}</div>
          </Tooltip>
        );
      case 'isActive':
        return route.isActive
          ? <Chip color="success">Activo</Chip>
          : <Chip color="danger">Inactivo</Chip>;
      case 'type':
        return <Chip>{formatRouteType(route.type)}</Chip>;
      case 'stops': {
        const sortedStops = route.stops.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const firstStop = sortedStops[0];
        const lastStop = sortedStops[sortedStops.length - 1];

        return (
          <div className="flex flex-col space-y-1">
            {sortedStops.length > 2 ? (
              <>
                <div className="text-sm">
                  <span>{firstStop.location.name}</span>
                </div>
                <Tooltip
                  content={(
                    <div className="p-1">
                      {sortedStops.slice(1, -1).map((stop) => (
                        <div key={stop.id} className="mb-1">
                          <div>{stop.location.name}</div>
                          <div className="text-xs text-gray-400">
                            T+
                            {stop.timeOffsetMinutesArrival}
                            min /
                            {stop.stopDurationMinutes}
                            min
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  placement="bottom"
                >
                  <div className="text-sm text-center cursor-help">
                    <span className="text-gray-500">
                      +
                      {sortedStops.length - 2}
                      paradas
                    </span>
                  </div>
                </Tooltip>
                <div className="text-sm">
                  <span>{lastStop.location.name}</span>
                </div>
              </>
            ) : (
              sortedStops.map((stop) => (
                <Tooltip
                  key={stop.id}
                  content={`T+${stop.timeOffsetMinutesArrival} min / ${stop.stopDurationMinutes} min`}
                  placement="bottom"
                >
                  <div className="text-sm cursor-help">
                    <span>{stop.location.name}</span>
                  </div>
                </Tooltip>
              ))
            )}
          </div>
        );
      }
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => handleEditRoute(route.id)}
              type="button"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onClick={() => handleDeleteRoute(route.id)}
              type="button"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-6">Cargando rutas...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Rutas</h2>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          startContent={<PlusIcon className="h-4 w-4" />}
          onClick={handleAddRoute}
          type="button"
        >
          Añadir Nueva Ruta
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <Table
            aria-label="Tabla de rutas"
            removeWrapper
            isStriped
            classNames={{
              wrapper: 'max-w-full',
            }}
          >
            <TableHeader>
              <TableColumn key="name">Nombre</TableColumn>
              <TableColumn key="isActive">Estado</TableColumn>
              <TableColumn key="type">Tipo</TableColumn>
              <TableColumn key="stops">Paradas</TableColumn>
              <TableColumn key="actions" className="w-20">Acciones</TableColumn>
            </TableHeader>
            <TableBody items={filteredRoutes} emptyContent="No hay rutas disponibles">
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{renderCell(item, columnKey.toString())}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Filter panel */}
        <div className="w-full md:w-80 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>

          {/* Name search */}
          <div className="mb-4">
            <Input
              type="text"
              label="Buscar por nombre"
              placeholder="Nombre de ruta"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
              isClearable
              id="route-search"
              labelPlacement="outside"
            />
          </div>

          {/* Active status filter */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2" id="active-filter-label">
              Estado
            </div>
            <div className="flex items-center space-x-4" aria-labelledby="active-filter-label">
              <label className="inline-flex items-center" htmlFor="filter-all">
                <input
                  type="radio"
                  className="form-radio"
                  name="activeFilter"
                  value="all"
                  checked={activeFilter === null}
                  onChange={() => setActiveFilter(null)}
                  id="filter-all"
                />
                <span className="ml-2">Todos</span>
              </label>
              <label className="inline-flex items-center" htmlFor="filter-active">
                <input
                  type="radio"
                  className="form-radio"
                  name="activeFilter"
                  value="active"
                  checked={activeFilter === 'active'}
                  onChange={() => setActiveFilter('active')}
                  id="filter-active"
                />
                <span className="ml-2">Activos</span>
              </label>
              <label className="inline-flex items-center" htmlFor="filter-inactive">
                <input
                  type="radio"
                  className="form-radio"
                  name="activeFilter"
                  value="inactive"
                  checked={activeFilter === 'inactive'}
                  onChange={() => setActiveFilter('inactive')}
                  id="filter-inactive"
                />
                <span className="ml-2">Inactivos</span>
              </label>
            </div>
          </div>

          {/* Locations filter */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2" id="locations-filter-label">
              Paradas incluidas
            </div>
            <Select
              label="Ubicaciones"
              placeholder="Seleccionar ubicaciones"
              selectionMode="multiple"
              className="max-w-full"
              onChange={(e) => handleLocationFilterChange(e.target.value.split(','))}
              aria-labelledby="locations-filter-label"
              id="locations-filter"
            >
              {allLocations.map((location) => (
                <SelectItem key={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Route type filter */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2" id="route-type-filter-label">
              Tipo de ruta
            </div>
            <CheckboxGroup
              value={Array.from(selectedTypes)}
              onChange={handleTypeFilterChange}
              aria-labelledby="route-type-filter-label"
            >
              <Checkbox value="direct" id="filter-direct">Directo</Checkbox>
              <Checkbox value="semi-direct" id="filter-semi-direct">Semi-Directo</Checkbox>
              <Checkbox value="regular" id="filter-regular">Regular</Checkbox>
            </CheckboxGroup>
          </div>
        </div>
      </div>

      {/* Modal window for adding/editing route */}
      <RouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRoute}
        initialData={formData}
        isEditing={isEditing}
      />
    </div>
  );
}

export default RoutesPanel;
