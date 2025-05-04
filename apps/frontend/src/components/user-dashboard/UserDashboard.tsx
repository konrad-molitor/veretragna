import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectItem,
  Button,
  Checkbox,
  DatePicker,
  Card,
  CardBody,
  Skeleton,
  Spinner,
} from '@heroui/react';
import {
  ArrowRightIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { I18nProvider } from '@react-aria/i18n';
import { today, getLocalTimeZone, DateValue } from '@internationalized/date';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../app/utils/axiosInstance';

interface Location {
  id: string;
  name: string;
}

interface Segment {
  tripId: string;
  depart: { locId: string; time: Date };
  arrive: { locId: string; time: Date };
  price: number;
}

interface TripResult {
  id: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  transfers: number;
  departureLocation: string | undefined;
  arrivalLocation: string | undefined;
}

interface SearchResponse {
  message: string;
  result: {
    outbound: Segment[] | null;
    inbound: Segment[] | null;
  };
}

export function UserDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<DateValue>(today(getLocalTimeZone()));
  const [returnDate, setReturnDate] = useState<DateValue>(today(getLocalTimeZone()));
  const [classType, setClassType] = useState<string>('any');
  const [isOneWay, setIsOneWay] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredFromLocations, setFilteredFromLocations] = useState<Location[]>([]);
  const [filteredToLocations, setFilteredToLocations] = useState<Location[]>([]);

  // New states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<TripResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axiosInstance.get('/locations');
        setLocations(response.data);
        setFilteredFromLocations(response.data);
        setFilteredToLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = locations.filter(
        (location) => location.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredFromLocations(filtered);
      setFilteredToLocations(filtered);
    } else {
      setFilteredFromLocations(locations);
      setFilteredToLocations(locations);
    }
  }, [searchQuery, locations]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromLocation || !toLocation) {
      // Can add error message here
      return;
    }

    setIsLoading(true);

    try {
      // Set search flag to activate animation
      setIsSearching(true);

      // Format date for API
      const formattedDepartureDate = departureDate.toString();
      const formattedReturnDate = isOneWay ? formattedDepartureDate : returnDate.toString();

      // Реальный API запрос к нашему новому роуту
      const response = await axiosInstance.post<SearchResponse>('/trips/search', {
        fromLocationId: fromLocation,
        toLocationId: toLocation,
        departureDate: formattedDepartureDate,
        returnDate: formattedReturnDate,
        minTransferMinutes: 5,
        searchWindowDays: 30,
      });

      // Преобразование полученных сегментов в формат TripResult
      const results: TripResult[] = [];

      if (response.data.result.outbound) {
        const { outbound } = response.data.result;
        const startSegment = outbound[0];
        const endSegment = outbound[outbound.length - 1];

        results.push({
          id: `outbound-${new Date().getTime()}`,
          departureTime: new Date(startSegment.depart.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(endSegment.arrive.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          price: outbound.reduce((sum, segment) => sum + segment.price, 0),
          transfers: outbound.length - 1,
          departureLocation: locations.find((loc) => loc.id === startSegment.depart.locId)?.name,
          arrivalLocation: locations.find((loc) => loc.id === endSegment.arrive.locId)?.name,
        });
      }

      if (response.data.result.inbound && !isOneWay) {
        const { inbound } = response.data.result;
        const startSegment = inbound[0];
        const endSegment = inbound[inbound.length - 1];

        results.push({
          id: `inbound-${new Date().getTime()}`,
          departureTime: new Date(startSegment.depart.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(endSegment.arrive.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          price: inbound.reduce((sum, segment) => sum + segment.price, 0),
          transfers: inbound.length - 1,
          departureLocation: locations.find((loc) => loc.id === startSegment.depart.locId)?.name,
          arrivalLocation: locations.find((loc) => loc.id === endSegment.arrive.locId)?.name,
        });
      }

      setSearchResults(results);
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching for trips:', error);
      setIsLoading(false);
    }
  };

  // Function to swap From and To locations
  const handleSwapLocations = () => {
    const tempFrom = fromLocation;
    setFromLocation(toLocation);
    setToLocation(tempFrom);
  };

  return (
    <div className="relative">
      {/* Hero section with background image - hidden during search */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 1, height: '50vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-cover bg-center relative"
            style={{ backgroundImage: 'url(/assets/images/bus6.png)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/80" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Encuentra Tu Viaje Perfecto</h1>
              <p className="text-xl md:text-2xl text-center max-w-2xl">
                Viajes cómodos y seguros a precios accesibles
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search form card - always visible, but changes position */}
      <motion.div
        initial={{ marginTop: isSearching ? 0 : '-5rem' }}
        animate={{ marginTop: isSearching ? 0 : '-5rem' }}
        transition={{ duration: 0.5 }}
        className={`max-w-6xl mx-auto z-10 ${isSearching ? 'mt-0 pt-4' : '-mt-20'}`}
      >
        <Card className="shadow-xl">
          <CardBody className="p-6 md:p-8">
            <form onSubmit={handleSearch}>
              {/* Main search row */}
              <div className="grid grid-cols-12 gap-2 md:gap-4 items-end">
                {/* From location */}
                <div className="col-span-12 md:col-span-2">
                  <Select
                    label="Origen"
                    placeholder="Desde"
                    selectedKeys={fromLocation ? [fromLocation] : []}
                    onChange={(e) => setFromLocation(e.target.value)}
                    startContent={<MapPinIcon className="h-5 w-5 text-blue-500" />}
                    isRequired
                  >
                    {filteredFromLocations.map((location) => (
                      <SelectItem key={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Swap button */}
                <div className="col-span-12 md:col-span-1 flex h-[100%] justify-center items-center justify-self-stretch">
                  <Button
                    type="button"
                    isIconOnly
                    variant="light"
                    aria-label="Intercambiar ubicaciones"
                    onClick={handleSwapLocations}
                    className="rounded-full"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* To location */}
                <div className="col-span-12 md:col-span-2">
                  <Select
                    label="Destino"
                    placeholder="Hasta"
                    selectedKeys={toLocation ? [toLocation] : []}
                    onChange={(e) => setToLocation(e.target.value)}
                    startContent={<MapPinIcon className="h-5 w-5 text-red-500" />}
                    isRequired
                  >
                    {filteredToLocations.map((location) => (
                      <SelectItem key={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Departure date */}
                <div className="col-span-12 md:col-span-2">
                  <I18nProvider locale="es-ES">
                    <DatePicker
                      // @ts-expect-error - tipos from library are not compatible
                      defaultValue={departureDate}
                      // @ts-expect-error - tipos from library are not compatible
                      onChange={(date) => date && setDepartureDate(date)}
                      firstDayOfWeek="mon"
                      selectorIcon={<CalendarIcon className="h-5 w-5" />}
                      // @ts-expect-error - tipos from library are not compatible
                      minValue={today(getLocalTimeZone())}
                      label="Salida"
                    />
                  </I18nProvider>
                </div>

                {/* Return date */}
                <div className={`col-span-12 md:col-span-2 ${isOneWay ? 'opacity-50' : ''}`}>
                  <I18nProvider locale="es-ES">
                    <DatePicker
                      // @ts-expect-error - tipos from library are not compatible
                      defaultValue={returnDate}
                      // @ts-expect-error - tipos from library are not compatible
                      onChange={(date) => date && setReturnDate(date)}
                      firstDayOfWeek="mon"
                      selectorIcon={<CalendarIcon className="h-5 w-5" />}
                      // @ts-expect-error - tipos from library are not compatible
                      minValue={departureDate}
                      isDisabled={isOneWay}
                      label="Regreso"
                    />
                  </I18nProvider>
                </div>

                {/* Class type selector */}
                <div className="col-span-12 md:col-span-3">
                  <Select
                    label="Clase"
                    placeholder="Cualquier clase"
                    selectedKeys={[classType]}
                    onChange={(e) => setClassType(e.target.value)}
                  >
                    <SelectItem key="any">Cualquier clase</SelectItem>
                    <SelectItem key="standard">Estándar</SelectItem>
                    <SelectItem key="comfort">Confort</SelectItem>
                  </Select>
                </div>
              </div>

              {/* Solo ida checkbox row */}
              <div className="mt-3 md:mt-4 flex flex-col md:flex-row justify-between items-center">
                <Checkbox
                  isSelected={isOneWay}
                  onValueChange={setIsOneWay}
                  className="mb-3 md:mb-0"
                >
                  Solo ida
                </Checkbox>
              </div>
              <div className="w-full md:w-auto flex justify-center">
                {/* Search button */}
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  endContent={isLoading ? <Spinner size="sm" color="white" /> : <ArrowRightIcon className="h-5 w-5" />}
                  className="px-8 w-full md:w-auto"
                  style={{ backgroundColor: 'rgb(255, 0, 22)' }}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Buscando...' : 'Buscar Viajes'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>

      {/* Search results section - displayed only after search */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-6xl mx-auto mt-8 px-4"
          >
            <h2 className="text-2xl font-bold mb-6">Resultados de búsqueda</h2>

            {(() => {
              if (isLoading) {
                return (
                  // Skeleton loader for results
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <Card key={item} className="w-full">
                        <CardBody>
                          <div className="flex flex-col md:flex-row justify-between">
                            <Skeleton className="h-6 w-32 rounded-lg mb-2" />
                            <Skeleton className="h-6 w-24 rounded-lg mb-2" />
                          </div>
                          <div className="flex flex-col md:flex-row mt-2 justify-between">
                            <Skeleton className="h-4 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-36 rounded-lg" />
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                );
              }

              if (searchResults && searchResults.length > 0) {
                return (
                  // Search results
                  <div className="space-y-4">
                    {searchResults.map((trip) => (
                      <Card key={trip.id} className="w-full hover:shadow-lg transition-shadow">
                        <CardBody>
                          <div className="flex flex-col md:flex-row justify-between items-center">
                            <div>
                              <p className="text-lg font-semibold">
                                {trip.departureLocation}
                                {' '}
                                →
                                {' '}
                                {trip.arrivalLocation}
                              </p>
                              <p className="text-sm text-gray-600">
                                {trip.departureTime}
                                {' '}
                                -
                                {trip.arrivalTime}
                                {' '}
                                •
                                {trip.transfers === 0 ? 'Directo' : `${trip.transfers} transbordo(s)`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end mt-4 md:mt-0">
                              <p className="text-xl font-bold text-red-600">
                                $
                                {trip.price.toLocaleString()}
                              </p>
                              <Button color="primary" className="mt-2" size="sm" style={{ backgroundColor: 'rgb(255, 0, 22)' }}>
                                Seleccionar
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                );
              }

              // No results message
              return (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-xl">No se encontraron viajes para esta ruta.</p>
                    <p className="text-gray-600 mt-2">Intenta con fechas u orígenes diferentes.</p>
                  </CardBody>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefits section - displayed only on home page (not during search) */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto mt-16 px-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">¿Por qué elegir nuestro servicio?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Puntualidad Garantizada</h3>
                <p className="text-gray-600">Nos comprometemos a cumplir con los horarios establecidos para tu tranquilidad.</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Seguridad en Viaje</h3>
                <p className="text-gray-600">Conductores profesionales y vehículos en óptimas condiciones para tu seguridad.</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Precios Competitivos</h3>
                <p className="text-gray-600">Ofrecemos las mejores tarifas del mercado sin comprometer la calidad del servicio.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserDashboard;
