import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Select,
  SelectItem,
  Input,
  Chip,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../app/utils/axiosInstance';
import CreateTrips, { ScheduleData, DayOfWeek } from './CreateTrips';
import AssignTripModal from './AssignTripModal';

// Interface definitions
interface Route {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  dayOfWeek: string;
  departureTime: string;
  route: Route;
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
}

enum TripStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface Trip {
  id: string;
  scheduleId: string;
  schedule: Schedule;
  departureDateTime: string;
  arrivalDateTime: string;
  status: TripStatus;
  bus?: Bus;
  busId?: string;
  driver?: Driver;
  driverId?: string;
}

export function TripsPanel() {
  // Trip list state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Create trips modal state
  const [isCreateTripsOpen, setIsCreateTripsOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  // Add state for the assign modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Load data from server
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/trips');
      setTrips(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Error al cargar la lista de viajes');
      toast.error('Error al cargar la lista de viajes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axiosInstance.get('/routes');
      setRoutes(response.data);
    } catch (err) {
      console.error('Error fetching routes:', err);
      toast.error('Error al cargar las rutas');
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axiosInstance.get('/schedules');
      setSchedules(response.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      toast.error('Error al cargar los horarios');
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchRoutes();
    fetchSchedules();
  }, []);

  // Routes list for filtering
  const uniqueRoutes = useMemo(() => {
    const uniqueRoutesMap = new Map<string, Route>();

    // Add routes from trips
    trips.forEach((trip) => {
      if (trip.schedule?.route && !uniqueRoutesMap.has(trip.schedule.route.id)) {
        uniqueRoutesMap.set(trip.schedule.route.id, trip.schedule.route);
      }
    });

    // Add routes from the general routes list
    routes.forEach((route) => {
      if (!uniqueRoutesMap.has(route.id)) {
        uniqueRoutesMap.set(route.id, route);
      }
    });

    return Array.from(uniqueRoutesMap.values());
  }, [trips, routes]);

  // Format status for display
  const formatTripStatus = (status: TripStatus): string => {
    const statuses = {
      [TripStatus.PENDING]: 'Pendiente',
      [TripStatus.SCHEDULED]: 'Programado',
      [TripStatus.BOARDING]: 'Embarque',
      [TripStatus.ONGOING]: 'En progreso',
      [TripStatus.COMPLETED]: 'Completado',
      [TripStatus.CANCELLED]: 'Cancelado',
    };
    return statuses[status];
  };

  // Status color for display
  const getStatusColor = (status: TripStatus): string => {
    const colors = {
      [TripStatus.PENDING]: 'bg-gray-100 text-gray-800',
      [TripStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
      [TripStatus.BOARDING]: 'bg-purple-100 text-purple-800',
      [TripStatus.ONGOING]: 'bg-yellow-100 text-yellow-800',
      [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [TripStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '-';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (formattingError) {
      console.error('Error formatting date:', formattingError);
      return '-';
    }
  };

  // Filter trips based on filters
  const filteredTrips = useMemo(() => trips.filter((trip) => {
    if (!trip) return false;

    // Filter by route
    const matchesRoute = routeFilter === 'all'
      || (trip.schedule?.route && trip.schedule.route.id === routeFilter);

    // Filter by status
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    // Filter by search (search by route name)
    const matchesSearch = !searchQuery || (trip.schedule?.route?.name
      ? trip.schedule.route.name.toLowerCase().includes(searchQuery.toLowerCase())
      : false);

    return matchesRoute && matchesStatus && matchesSearch;
  }), [trips, routeFilter, statusFilter, searchQuery]);

  // Handler for creating a new trip
  const handleAddTrip = () => {
    setIsCreateTripsOpen(true);
  };

  // Handler for closing the modal
  const handleCloseCreateTrips = () => {
    setIsCreateTripsOpen(false);
    // Update the trip list after creating new ones
    fetchTrips();
  };

  // New handler for opening the assign modal
  const handleAssignTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsAssignModalOpen(true);
  };

  // Handler for closing the assign modal
  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    // Refresh trips after assignment
    fetchTrips();
  };

  // Check if trip can be edited (not in progress, completed, or cancelled)
  const canEditTrip = (status: TripStatus): boolean => {
    return ![
      TripStatus.ONGOING, 
      TripStatus.COMPLETED, 
      TripStatus.CANCELLED
    ].includes(status);
  };

  // Get total number of seats in the bus
  const getTotalSeats = (bus?: Bus): number => {
    if (!bus || !bus.totalSeats) return 0;
    return Object.values(bus.totalSeats).reduce((sum, count) => sum + count, 0);
  };

  // Render table cells
  const renderCell = (trip: Trip, columnKey: string) => {
    if (!trip) return <span>-</span>;

    switch (columnKey) {
      case 'route':
        return <span>{trip.schedule?.route?.name || '-'}</span>;
      case 'departure':
        return <span>{formatDateTime(trip.departureDateTime)}</span>;
      case 'arrival':
        return <span>{formatDateTime(trip.arrivalDateTime)}</span>;
      case 'status':
        return trip.status ? (
          <Chip className={getStatusColor(trip.status)}>
            {formatTripStatus(trip.status)}
          </Chip>
        ) : <span>-</span>;
      case 'bus':
        return <span>{trip.bus ? `${trip.bus.licensePlate} (${trip.bus.model})` : '-'}</span>;
      case 'driver':
        return <span>{trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '-'}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => handleAssignTrip(trip)}
              isDisabled={!canEditTrip(trip.status)}
              type="button"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return <span>-</span>;
    }
  };

  // Prepare list of items for route select
  const renderRouteItems = () => (
    <>
      <SelectItem key="all">Todas las rutas</SelectItem>
      {uniqueRoutes.map((route) => (
        <SelectItem key={route.id}>
          {route.name}
        </SelectItem>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Viajes</h1>
        <Button color="primary" startContent={<PlusIcon className="h-5 w-5" />} onClick={handleAddTrip}>
          Crear Viajes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main trips table */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar viajes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table
            aria-label="Tabla de viajes"
            isHeaderSticky
            selectionMode="single"
          >
            <TableHeader>
              <TableColumn key="route">Ruta</TableColumn>
              <TableColumn key="departure">Salida</TableColumn>
              <TableColumn key="arrival">Llegada</TableColumn>
              <TableColumn key="status">Estado</TableColumn>
              <TableColumn key="bus">Autobús</TableColumn>
              <TableColumn key="driver">Conductor</TableColumn>
              <TableColumn key="actions" className="text-right">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredTrips}
              isLoading={loading}
              loadingContent="Cargando viajes..."
              emptyContent={error ? `Error: ${error}` : 'No hay viajes disponibles'}
            >
              {(trip) => (
                <TableRow key={trip.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(trip, columnKey.toString())}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Filters panel */}
        <div className="w-full lg:w-72 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">Filtros</h2>
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2" id="status-filter-label">
              Estado
            </div>
            <Select
              placeholder="Todos los estados"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
              aria-labelledby="status-filter-label"
            >
              <SelectItem key="all">Todos los estados</SelectItem>
              <SelectItem key={TripStatus.PENDING}>
                {formatTripStatus(TripStatus.PENDING)}
              </SelectItem>
              <SelectItem key={TripStatus.SCHEDULED}>
                {formatTripStatus(TripStatus.SCHEDULED)}
              </SelectItem>
              <SelectItem key={TripStatus.BOARDING}>
                {formatTripStatus(TripStatus.BOARDING)}
              </SelectItem>
              <SelectItem key={TripStatus.ONGOING}>
                {formatTripStatus(TripStatus.ONGOING)}
              </SelectItem>
              <SelectItem key={TripStatus.COMPLETED}>
                {formatTripStatus(TripStatus.COMPLETED)}
              </SelectItem>
              <SelectItem key={TripStatus.CANCELLED}>
                {formatTripStatus(TripStatus.CANCELLED)}
              </SelectItem>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2" id="route-filter-label">
              Ruta
            </div>
            <Select
              placeholder="Todas las rutas"
              selectedKeys={[routeFilter]}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full"
              aria-labelledby="route-filter-label"
            >
              {renderRouteItems()}
            </Select>
          </div>

          <div className="pt-4">
            <Button
              color="default"
              variant="flat"
              className="w-full"
              onClick={() => {
                setStatusFilter('all');
                setRouteFilter('all');
                setSearchQuery('');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Create trips modal */}
      <CreateTrips
        isOpen={isCreateTripsOpen}
        onClose={handleCloseCreateTrips}
        schedules={schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek as unknown as DayOfWeek,
          departureTime: s.departureTime,
          route: s.route,
          isActive: true, // Assume all loaded schedules are active
        }))}
      />

      {/* Assign bus and driver modal */}
      <AssignTripModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        trip={selectedTrip}
      />
    </div>
  );
}

export default TripsPanel;
