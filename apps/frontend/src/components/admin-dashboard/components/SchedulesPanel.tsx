import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
  EventContentArg,
  EventDropArg,
  EventClickArg,
} from '@fullcalendar/core';
import { DayOfWeek } from '../../../types/schedule';
import axiosInstance from '../../../app/utils/axiosInstance';

interface RouteStop {
  id: string;
  locationId: string;
  location: {
    id: string;
    name: string;
  };
  sequenceOrder: number;
  timeOffsetMinutesArrival: number;
  stopDurationMinutes: number;
}

interface Route {
  id: string;
  name: string;
  stops?: RouteStop[];
}

interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  departureTime: string;
  isActive: boolean;
  route: Route;
}

interface StopTime {
  stop: RouteStop;
  arrivalTime: string;
  departureTime: string | null;
}

interface EventDropInfo {
  event: {
    id: string;
    start: Date;
  };
  revert: () => void;
}

interface EventClickInfo {
  event: {
    extendedProps: {
      schedule: Schedule;
    };
  };
}

// Component for rendering event content in the calendar
function EventContent({ event, timeText }: EventContentArg) {
  return (
    <div className="p-1 text-xs">
      <div className="font-semibold">{event.title}</div>
      <div>{timeText}</div>
    </div>
  );
}

export function SchedulesPanel() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [routeFilter, setRouteFilter] = useState<string>('');
  const calendarRef = useRef<FullCalendar>(null);
  const routesContainerRef = useRef<HTMLDivElement>(null);

  // Filter routes by name
  const filteredRoutes = routes.filter(
    (route) => route.name.toLowerCase().includes(routeFilter.toLowerCase()),
  );

  const getDayIndex = (dayOfWeek: DayOfWeek) => {
    const dayMap: Record<DayOfWeek, number> = {
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
      [DayOfWeek.SUNDAY]: 0,
    };
    // Ensure we have a valid mapping
    if (dayMap[dayOfWeek] === undefined) {
      console.error('Invalid day of week:', dayOfWeek);
      return 1; // Default to Monday if invalid
    }
    return dayMap[dayOfWeek];
  };

  const getDayOfWeekFromIndex = (index: number): DayOfWeek => {
    const dayMap: Record<number, DayOfWeek> = {
      0: DayOfWeek.SUNDAY,
      1: DayOfWeek.MONDAY,
      2: DayOfWeek.TUESDAY,
      3: DayOfWeek.WEDNESDAY,
      4: DayOfWeek.THURSDAY,
      5: DayOfWeek.FRIDAY,
      6: DayOfWeek.SATURDAY,
    };
    return dayMap[index];
  };

  const getDayName = (dayOfWeek: DayOfWeek): string => {
    const dayMap: Record<DayOfWeek, string> = {
      [DayOfWeek.MONDAY]: 'Lunes',
      [DayOfWeek.TUESDAY]: 'Martes',
      [DayOfWeek.WEDNESDAY]: 'Miércoles',
      [DayOfWeek.THURSDAY]: 'Jueves',
      [DayOfWeek.FRIDAY]: 'Viernes',
      [DayOfWeek.SATURDAY]: 'Sábado',
      [DayOfWeek.SUNDAY]: 'Domingo',
    };
    return dayMap[dayOfWeek];
  };

  const addMinutesToTime = (timeString: string, minutes: number) => {
    const [hours, mins, secs] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, secs);
    date.setMinutes(date.getMinutes() + minutes);

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const calculateRouteDuration = (route: Route) => {
    if (!route.stops || route.stops.length < 2) return 0;

    let totalDuration = 0;

    route.stops.forEach((stop) => {
      totalDuration += stop.timeOffsetMinutesArrival;
    });

    for (let i = 0; i < route.stops.length - 1; i += 1) {
      totalDuration += route.stops[i].stopDurationMinutes;
    }

    return totalDuration;
  };

  const fetchAllSchedules = async () => {
    try {
      const response = await axiosInstance.get('/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      toast.error('Error al cargar los horarios');
    }
  };

  const fetchSchedulesForRoute = async (routeId: string) => {
    try {
      const response = await axiosInstance.get(`/schedules/route/${routeId}`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Error al cargar los horarios');
    }
  };

  const getCalendarEvents = () => {
    // First ensure schedules array is valid
    if (!Array.isArray(schedules) || schedules.length === 0) {
      console.warn('No schedules available to display in calendar');
      return [];
    }

    // Get current date information for creating events
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    currentWeekStart.setHours(0, 0, 0, 0);

    const validSchedules = schedules.filter((schedule) => (
      schedule && schedule.dayOfWeek && schedule.departureTime && schedule.route
    ));

    return validSchedules.map((schedule) => {
      const route = routes.find((r) => r.id === schedule.route.id);
      const routeDuration = route ? calculateRouteDuration(route) : 15;
      const dayIndex = getDayIndex(schedule.dayOfWeek);
      const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1;
      const eventDate = new Date(currentWeekStart);
      eventDate.setDate(currentWeekStart.getDate() + dayOffset);
      const [hours, minutes, seconds] = schedule.departureTime.split(':').map(Number);
      eventDate.setHours(hours, minutes, seconds);
      const endDate = new Date(eventDate);
      endDate.setMinutes(endDate.getMinutes() + routeDuration);

      return {
        id: schedule.id,
        title: schedule.route.name,
        start: eventDate.toISOString(),
        end: endDate.toISOString(),
        extendedProps: {
          route: schedule.route,
          schedule,
          dayOfWeek: schedule.dayOfWeek,
        },
        color: '#3788d8',
        backgroundColor: '#3788d8',
        borderColor: '#2c6db8',
      };
    });
  };

  const handleEventDrop = async (info: EventDropArg) => {
    try {
      const scheduleId = info.event.id;
      const newDate = info.event.start;

      if (!newDate) {
        toast.error('Error al actualizar el horario: fecha inválida');
        info.revert();
        return;
      }

      const dayOfWeek = getDayOfWeekFromIndex(newDate.getDay());
      const hours = newDate.getHours();
      const minutes = newDate.getMinutes();
      const seconds = newDate.getSeconds();
      const departureTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Update schedule
      await axiosInstance.patch(`/schedules/${scheduleId}`, {
        dayOfWeek,
        departureTime,
      });

      toast.success('Horario actualizado con éxito');

      // Update schedules list
      if (selectedRoute) {
        fetchSchedulesForRoute(selectedRoute);
      } else {
        fetchAllSchedules();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Error al actualizar el horario');
      // Return event to its original position
      info.revert();
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    const { schedule } = info.event.extendedProps;

    // Load detailed route information if needed
    if (schedule) {
      const fullRoute = routes.find((r) => r.id === schedule.route.id);
      if (fullRoute) {
        setSelectedSchedule({
          ...schedule,
          route: fullRoute,
        });
        setShowModal(true);
      }
    }
  };

  const deleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      await axiosInstance.delete(`/schedules/${selectedSchedule.id}`);
      toast.success('Horario eliminado con éxito');

      // Close modal
      setShowModal(false);
      setSelectedSchedule(null);

      // Update schedules list
      if (selectedRoute) {
        fetchSchedulesForRoute(selectedRoute);
      } else {
        fetchAllSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Error al eliminar el horario');
    }
  };

  const handleExternalDrop = async (info: { draggedEl: HTMLElement; date: Date }) => {
    const routeId = info.draggedEl.getAttribute('data-route-id');
    const route = routes.find((r) => r.id === routeId);

    if (!route) return;

    // Get day of week and time from calendar event
    const dropDate = info.date;
    const dayOfWeek = getDayOfWeekFromIndex(dropDate.getDay());
    const hours = dropDate.getHours();
    const minutes = dropDate.getMinutes();
    const seconds = dropDate.getSeconds();
    const departureTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    try {
      // Create new schedule
      await axiosInstance.post('/schedules', {
        routeId: route.id,
        dayOfWeek,
        departureTime,
        isActive: true,
      });

      toast.success('Horario creado con éxito');

      // Update schedules list
      if (selectedRoute) {
        fetchSchedulesForRoute(selectedRoute);
      } else {
        fetchAllSchedules();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Error al crear el horario');
    }
  };

  // Initialize drag capability for routes
  useEffect(() => {
    if (!routesContainerRef.current) return undefined;

    const draggable = new Draggable(routesContainerRef.current, {
      itemSelector: '.route-item',
      eventData: (eventEl) => {
        const routeId = eventEl.getAttribute('data-route-id');
        const routeName = eventEl.querySelector('.route-name')?.textContent || 'Ruta';

        return {
          title: routeName,
          create: false,
        };
      },
    });

    return () => {
      draggable.destroy();
    };
  }, [routes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const routesResponse = await axiosInstance.get('/routes');
        setRoutes(routesResponse.data);

        await fetchAllSchedules();
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchSchedulesForRoute(selectedRoute);
    } else {
      fetchAllSchedules();
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  }, [schedules]);

  // Calculate arrival times at stops for display in the modal window
  const calculateStopTimes = (): StopTime[] => {
    if (
      !selectedSchedule
      || !selectedSchedule.route.stops
      || selectedSchedule.route.stops.length === 0
    ) {
      return [];
    }

    let currentTime = selectedSchedule.departureTime;
    const stopTimes: StopTime[] = [];

    selectedSchedule.route.stops.forEach((stop, index) => {
      // Arrival time = current time + travel time to the stop
      const arrivalTime = addMinutesToTime(currentTime, stop.timeOffsetMinutesArrival);

      // Departure time = arrival time + stop duration (for all stops except the last one)
      const departureTime = index < (selectedSchedule.route.stops?.length || 0) - 1
        ? addMinutesToTime(arrivalTime, stop.stopDurationMinutes)
        : null;

      stopTimes.push({
        stop,
        arrivalTime,
        departureTime,
      });

      // Update current time for the next stop
      if (departureTime) {
        currentTime = departureTime;
      }
    });

    return stopTimes;
  };

  return (
    <div className="flex h-full">
      {/* Side panel with routes */}
      <div className="w-1/4 p-4 border-r border-gray-200 overflow-y-auto" ref={routesContainerRef}>
        <h2 className="text-lg font-semibold mb-4">Rutas</h2>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
          </div>
        ) : (
          <div>
            {/* Route search field */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar rutas..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                />
                {routeFilter && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setRouteFilter('')}
                    aria-label="Limpiar búsqueda"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div
                className={`route-item p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedRoute === null ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRoute(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedRoute(null);
                  }
                }}
              >
                <div className="route-name font-medium">Todos los horarios</div>
              </div>

              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className={`route-item p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedRoute === route.id ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRoute(route.id)}
                    data-route-id={route.id}
                    draggable="true"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedRoute(route.id);
                      }
                    }}
                  >
                    <div className="route-name font-medium">{route.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {route.stops?.length || 0}
                      {' '}
                      paradas
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No se encontraron rutas
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="w-3/4 p-4">
        <h2 className="text-lg font-semibold mb-4">
          {selectedRoute
            ? `Horario de ${routes.find((r) => r.id === selectedRoute)?.name || 'la ruta'}`
            : 'Todos los horarios'}
        </h2>

        <div className="bg-white rounded-lg shadow">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            headerToolbar={false}
            titleFormat={{ year: 'numeric', month: 'long' }}
            allDaySlot={false}
            dayHeaderFormat={{ weekday: 'long' }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotMinTime="00:00:00"
            slotMaxTime="23:59:59"
            height="auto"
            events={getCalendarEvents()}
            droppable
            editable
            drop={handleExternalDrop}
            nowIndicator
            weekends
            firstDay={1} // Start with Monday
            dayHeaderClassNames="text-center py-2 text-sm font-medium"
            contentHeight="auto"
            eventDrop={handleEventDrop}
            eventContent={EventContent}
            eventClick={handleEventClick}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            displayEventEnd
            datesSet={(dateInfo) => {
              if (selectedRoute) {
                fetchSchedulesForRoute(selectedRoute);
              } else {
                fetchAllSchedules();
              }
            }}
          />
        </div>
      </div>

      {/* Modal window with schedule details */}
      {showModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Detalles del horario:
                {' '}
                {selectedSchedule.route.name}
              </h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => { setShowModal(false); setSelectedSchedule(null); }}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Día:</p>
                  <p className="font-medium">{getDayName(selectedSchedule.dayOfWeek)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hora de salida:</p>
                  <p className="font-medium">{selectedSchedule.departureTime}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Paradas y horarios:</h3>
              {selectedSchedule.route.stops && selectedSchedule.route.stops.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parada</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Llegada</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {calculateStopTimes().map((item, index) => (
                      <tr key={item.stop.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm">{item.stop.location.name}</td>
                        <td className="px-4 py-2 text-sm">{item.arrivalTime}</td>
                        <td className="px-4 py-2 text-sm">{item.departureTime || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay paradas configuradas para esta ruta</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { setShowModal(false); setSelectedSchedule(null); }}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
                onClick={deleteSchedule}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulesPanel;
