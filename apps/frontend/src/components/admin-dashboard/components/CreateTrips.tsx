import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  DateRangePicker,
  Accordion,
  AccordionItem,
  Checkbox,
  Chip,
} from '@heroui/react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  CalendarDate, today, getLocalTimeZone,
} from '@internationalized/date';
import { I18nProvider } from '@react-aria/i18n';
import axiosInstance from '../../../app/utils/axiosInstance';

// Days of week enum
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

// Data interfaces
export interface ScheduleRoute {
  id: string;
  name: string;
}

export interface ScheduleData {
  id: string;
  dayOfWeek: DayOfWeek;
  departureTime: string;
  route: ScheduleRoute;
  isActive: boolean;
}

interface DateSchedules {
  date: Date;
  dayName: string;
  schedules: ScheduleData[];
  selectedScheduleIds: Set<string>;
  allSelected: boolean;
}

interface CreateTripsProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleData[];
}

// Date range type
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Convert Date to CalendarDate
const dateToCalendarDate = (date: Date): CalendarDate => new CalendarDate(
  date.getFullYear(),
  date.getMonth() + 1, // CalendarDate months start from 1
  date.getDate(),
);

const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  return days[date.getDay()];
};

const formatDate = (date: Date): string => date.toLocaleDateString('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getDayName = (date: Date): string => date.toLocaleDateString('es-ES', { weekday: 'long' });

function CreateTrips({ isOpen, onClose, schedules }: CreateTripsProps) {
  // States
  const [selectedTab, setSelectedTab] = useState<string>('dates');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [calendarValue, setCalendarValue] = useState({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()),
  });
  const [dateSchedules, setDateSchedules] = useState<DateSchedules[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creatingTrips, setCreatingTrips] = useState<boolean>(false);

  // Get dates in range
  const getDatesInRange = (): Date[] => {
    if (!dateRange) return [];

    const dates: Date[] = [];
    const start = dateRange.startDate;
    const end = dateRange.endDate;

    // Clone date to avoid modifying the original
    const current = new Date(start);

    // Set time to start of day
    current.setHours(0, 0, 0, 0);

    // Add dates to array
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Quick date selection functions
  const selectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(23, 59, 59, 999);

    setDateRange({
      startDate: tomorrow,
      endDate: endTomorrow,
    });

    // Update value for DateRangePicker using CalendarDate
    setCalendarValue({
      start: dateToCalendarDate(tomorrow),
      end: dateToCalendarDate(endTomorrow),
    });
  };

  const selectNextWeek = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Determine start of next week (Monday)
    const startNextWeek = new Date(currentDate);
    const daysUntilNextMonday = (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
    startNextWeek.setDate(currentDate.getDate() + daysUntilNextMonday);
    startNextWeek.setHours(0, 0, 0, 0);

    // Determine end of next week (Sunday)
    const endNextWeek = new Date(startNextWeek);
    endNextWeek.setDate(startNextWeek.getDate() + 6);
    endNextWeek.setHours(23, 59, 59, 999);

    setDateRange({
      startDate: startNextWeek,
      endDate: endNextWeek,
    });

    // Update value for DateRangePicker using CalendarDate
    setCalendarValue({
      start: dateToCalendarDate(startNextWeek),
      end: dateToCalendarDate(endNextWeek),
    });
  };

  // Select dates for current month
  const selectCurrentMonth = () => {
    const currentDate = new Date();

    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startMonth.setHours(0, 0, 0, 0);

    const endMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    endMonth.setHours(23, 59, 59, 999);

    setDateRange({
      startDate: startMonth,
      endDate: endMonth,
    });

    // Update value for DateRangePicker using CalendarDate
    setCalendarValue({
      start: dateToCalendarDate(startMonth),
      end: dateToCalendarDate(endMonth),
    });
  };

  // Prepare schedules for selected dates
  const prepareSchedulesForDates = () => {
    const dates = getDatesInRange();
    if (dates.length === 0) return;

    const newDateSchedules: DateSchedules[] = dates.map((date) => {
      const dayOfWeek = getDayOfWeek(date);
      const dayName = getDayName(date);

      // Filter schedules for this day of week
      const daySchedules = schedules.filter(
        (schedule) => schedule.dayOfWeek === dayOfWeek && schedule.isActive,
      );

      return {
        date,
        dayName: `${formatDate(date)} - ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
        schedules: daySchedules,
        selectedScheduleIds: new Set(),
        allSelected: false,
      };
    });

    setDateSchedules(newDateSchedules);
    // If there are schedules for the dates, switch to the next step
    if (newDateSchedules.some((ds) => ds.schedules.length > 0)) {
      setSelectedTab('schedules');
    } else {
      toast.error('No hay horarios activos para las fechas seleccionadas');
    }
  };

  // Date range selection handler
  const handleDateRangeChange = (value: unknown) => {
    if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
      setCalendarValue(value as { start: CalendarDate; end: CalendarDate });

      const startValue = value.start as CalendarDate;
      const endValue = value.end as CalendarDate;

      if (startValue && endValue) {
        // Convert to Date for our internal state
        const startDate = new Date(
          startValue.year,
          startValue.month - 1,
          startValue.day,
        );

        const endDate = new Date(
          endValue.year,
          endValue.month - 1,
          endValue.day,
        );

        // Set time to start and end of day for each date
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        setDateRange({
          startDate,
          endDate,
        });
      }
    } else {
      setDateRange(null);
      setCalendarValue({
        start: today(getLocalTimeZone()),
        end: today(getLocalTimeZone()),
      });
    }
  };

  // Date selection confirmation handler
  const handleConfirmDates = () => {
    if (!dateRange) {
      toast.error('Por favor, seleccione un rango de fechas');
      return;
    }

    setLoading(true);
    prepareSchedulesForDates();
    setLoading(false);
  };

  // Toggle all schedules for a date
  const handleToggleAllSchedules = (dateIndex: number, checked: boolean) => {
    setDateSchedules((prevState) => {
      const newState = [...prevState];
      const dateSchedule = newState[dateIndex];

      if (checked) {
        dateSchedule.selectedScheduleIds = new Set(
          dateSchedule.schedules.map((s) => s.id),
        );
      } else {
        dateSchedule.selectedScheduleIds = new Set();
      }

      dateSchedule.allSelected = checked;
      return newState;
    });
  };

  // Toggle individual schedule
  const handleToggleSchedule = (dateIndex: number, scheduleId: string, checked: boolean) => {
    setDateSchedules((prevState) => {
      const newState = [...prevState];
      const dateSchedule = newState[dateIndex];

      if (checked) {
        dateSchedule.selectedScheduleIds.add(scheduleId);
      } else {
        dateSchedule.selectedScheduleIds.delete(scheduleId);
      }

      // Check if all schedules are selected
      dateSchedule.allSelected = dateSchedule.selectedScheduleIds.size === dateSchedule.schedules.length;

      return newState;
    });
  };

  // Create trips
  const createTrips = async () => {
    try {
      setCreatingTrips(true);

      // Prepare data for trip creation
      const tripsToCreate = dateSchedules.flatMap((dateSchedule) => Array.from(
        dateSchedule.selectedScheduleIds,
      ).map((scheduleId) => {
        const schedule = dateSchedule.schedules.find((s) => s.id === scheduleId);
        if (!schedule) return null;

        // Get departure time from schedule
        const [hours, minutes] = schedule.departureTime.split(':').map(Number);

        // Create departure date by combining date and time
        const departureDateTime = new Date(dateSchedule.date);
        departureDateTime.setHours(hours, minutes, 0, 0);

        // Assume trip duration is 2 hours (can be changed)
        const arrivalDateTime = new Date(departureDateTime);
        arrivalDateTime.setHours(arrivalDateTime.getHours() + 2);

        return {
          scheduleId,
          departureDateTime: departureDateTime.toISOString(),
          arrivalDateTime: arrivalDateTime.toISOString(),
        };
      }).filter(Boolean));

      if (tripsToCreate.length === 0) {
        toast.error('No se ha seleccionado ningún horario');
        setCreatingTrips(false);
        return;
      }

      // Send request to create trips
      const response = await axiosInstance.post('/trips/batch', { trips: tripsToCreate });

      toast.success(`Se han creado ${response.data.length} viajes con éxito`);
      onClose();
    } catch (error) {
      console.error('Error creating trips:', error);
      toast.error('Error al crear los viajes');
    } finally {
      setCreatingTrips(false);
    }
  };

  // Can go to schedules tab
  const canGoToSchedules = !!dateRange;

  // Count of selected schedules
  const selectedSchedulesCount = useMemo(() => dateSchedules.reduce(
    (total, dateSchedule) => total + dateSchedule.selectedScheduleIds.size,
    0,
  ), [dateSchedules]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="2xl"
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Crear Viajes
            </ModalHeader>
            <ModalBody>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={
                  canGoToSchedules
                    ? (key) => setSelectedTab(key.toString())
                    : undefined
                }
                color="primary"
                className="w-full"
                classNames={{
                  base: 'w-full',
                  tabList: 'w-full',
                }}
              >
                <Tab
                  key="dates"
                  title={(
                    <div className="flex items-center gap-2">
                      <span>1. Seleccionar fechas</span>
                    </div>
                  )}
                >
                  <div className="py-4">
                    <div className="mb-4">
                      <p className="text-gray-600 mb-2">
                        Seleccione el rango de fechas para crear viajes
                      </p>

                      {/* Quick date selection options */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Chip
                          color="primary"
                          variant="flat"
                          className="cursor-pointer"
                          onClick={selectTomorrow}
                        >
                          Mañana
                        </Chip>
                        <Chip
                          color="primary"
                          variant="flat"
                          className="cursor-pointer"
                          onClick={selectNextWeek}
                        >
                          Próxima semana
                        </Chip>
                        <Chip
                          color="primary"
                          variant="flat"
                          className="cursor-pointer"
                          onClick={selectCurrentMonth}
                        >
                          Este mes
                        </Chip>
                      </div>

                      {/* DateRangePicker with localization for DD.MM.YYYY format */}
                      <I18nProvider locale="es-ES">
                        <DateRangePicker
                          onChange={handleDateRangeChange}
                          selectorIcon={<CalendarIcon className="h-5 w-5" />}
                          className="w-full"
                          firstDayOfWeek="mon"
                          // @ts-expect-error - DateRangePicker type is not supported
                          value={calendarValue}
                        />
                      </I18nProvider>
                    </div>
                  </div>
                </Tab>
                <Tab
                  key="schedules"
                  title={(
                    <div className="flex items-center gap-2">
                      <span>2. Seleccionar horarios</span>
                    </div>
                  )}
                  isDisabled={!canGoToSchedules}
                >
                  <div className="py-4">
                    <p className="text-gray-600 mb-4">
                      Seleccione los horarios para crear viajes en las fechas elegidas
                    </p>
                    {dateSchedules.length > 0 ? (
                      <Accordion>
                        {dateSchedules.map((dateSchedule, dateIndex) => (
                          <AccordionItem
                            key={dateSchedule.date.toISOString()}
                            title={(
                              <div className="flex items-center justify-between w-full">
                                <span>{dateSchedule.dayName}</span>
                                <div className="flex items-center mr-8">
                                  <Checkbox
                                    isSelected={dateSchedule.allSelected}
                                    onValueChange={(checked) => handleToggleAllSchedules(
                                      dateIndex,
                                      checked,
                                    )}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">
                                    {dateSchedule.selectedScheduleIds.size}
                                    /
                                    {dateSchedule.schedules.length}
                                  </span>
                                </div>
                              </div>
                            )}
                            classNames={{
                              title: 'text-base font-medium',
                            }}
                          >
                            {dateSchedule.schedules.length > 0 ? (
                              <div className="px-2 py-3 space-y-3">
                                {dateSchedule.schedules.map((schedule) => (
                                  <div key={schedule.id} className="flex items-center">
                                    <Checkbox
                                      isSelected={dateSchedule.selectedScheduleIds.has(schedule.id)}
                                      onValueChange={(checked) => handleToggleSchedule(dateIndex, schedule.id, checked)}
                                      size="sm"
                                      className="mr-3"
                                    />
                                    <div>
                                      <p className="font-medium">{schedule.route.name}</p>
                                      <p className="text-sm text-gray-600">
                                        Hora de salida:
                                        {' '}
                                        {schedule.departureTime}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm p-2">
                                No hay horarios disponibles para este día
                              </p>
                            )}
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <p className="text-gray-500">
                        No hay fechas seleccionadas. Por favor, vuelva al paso anterior.
                      </p>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              {selectedTab === 'dates' && (
                <Button
                  color="primary"
                  onClick={handleConfirmDates}
                  isDisabled={!dateRange}
                  isLoading={loading}
                >
                  Continuar
                </Button>
              )}
              {selectedTab === 'schedules' && (
                <Button
                  color="primary"
                  onClick={createTrips}
                  isDisabled={selectedSchedulesCount === 0}
                  isLoading={creatingTrips}
                >
                  Crear
                  {' '}
                  {selectedSchedulesCount}
                  {' '}
                  viajes
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default CreateTrips;
