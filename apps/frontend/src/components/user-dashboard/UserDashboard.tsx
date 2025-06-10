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
  CheckIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { I18nProvider } from '@react-aria/i18n';
import { today, getLocalTimeZone, DateValue } from '@internationalized/date';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../app/utils/axiosInstance';
import CheckoutModal from './components/CheckoutModal';
import {
  Location, TripRoute, TripResult, SearchResponse, TripDetail,
} from './types';

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

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<TripResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [tripsDetails, setTripsDetails] = useState<Record<string, TripRoute>>({});

  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const [tripDetails, setTripDetails] = useState<Record<string, TripDetail>>({});

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

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

  // Function to fetch trip details
  const fetchTripDetails = async (tripId: string) => {
    try {
      const response = await axiosInstance.get(`/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for trip ${tripId}:`, error);
      return null;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromLocation || !toLocation) {
      return;
    }

    setIsLoading(true);

    try {
      setIsSearching(true);

      const formattedDepartureDate = departureDate.toString();
      const formattedReturnDate = returnDate.toString();

      const response = await axiosInstance.post<SearchResponse>('/trips/search', {
        fromLocationId: fromLocation,
        toLocationId: toLocation,
        departureDate: formattedDepartureDate,
        returnDate: formattedReturnDate,
        minTransferMinutes: 5,
        searchWindowDays: 30,
        returnTrip: true,
      });

      const results: TripResult[] = [];
      const details: Record<string, TripRoute> = {};

      if (response.data.result.outbound) {
        const { outbound } = response.data.result;
        // First and last segments of the outbound route
        const firstSegment = outbound[0];
        const lastSegment = outbound[outbound.length - 1];

        // Unique identifier for the outbound route
        const outboundId = `outbound-${new Date().getTime()}`;

        // Calculate the total trip price
        const totalPrice = outbound.reduce((sum, segment) => sum + Number(segment.price), 0);

        // Create promises for fetching details of each segment
        const tripDetailsPromises = outbound.map((segment) => fetchTripDetails(segment.tripId));

        // Wait for all promises to resolve
        const tripDetailsResults = await Promise.all(tripDetailsPromises);

        // Create a map of trip IDs to their details
        const tripDetailsMap: Record<string, TripDetail> = {};
        tripDetailsResults.forEach((detail) => {
          if (detail && detail.id) {
            tripDetailsMap[detail.id] = detail;
          }
        });

        // Store trip details in state
        setTripDetails({ ...tripDetails, ...tripDetailsMap });

        // Create segment information with location names from trip details
        const outboundRoute: TripRoute = {
          id: outboundId,
          type: 'outbound',
          departureTime: new Date(firstSegment.boardTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(lastSegment.alightTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          totalPrice,
          segments: outbound.map((segment) => {
            const detail = tripDetailsMap[segment.tripId];
            const routeName = detail?.schedule?.route?.name || 'Ruta desconocida';
            return {
              tripId: segment.tripId,
              from: routeName,
              to: routeName,
              departureTime: new Date(segment.boardTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              arrivalTime: new Date(segment.alightTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              price: Number(segment.price),
            };
          }),
        };

        results.push({
          id: outboundId,
          departureTime: outboundRoute.departureTime,
          arrivalTime: outboundRoute.arrivalTime,
          price: outboundRoute.totalPrice,
          transfers: outbound.length - 1,
          departureLocation: locations.find((loc) => loc.id === fromLocation)?.name,
          arrivalLocation: locations.find((loc) => loc.id === toLocation)?.name,
        });

        details[outboundId] = outboundRoute;
      }

      if (response.data.result.inbound && !isOneWay) {
        const { inbound } = response.data.result;
        const firstSegment = inbound[0];
        const lastSegment = inbound[inbound.length - 1];

        const inboundId = `inbound-${new Date().getTime()}`;

        const totalPrice = inbound.reduce((sum, segment) => sum + Number(segment.price), 0);

        const tripDetailsPromises = inbound.map((segment) => fetchTripDetails(segment.tripId));

        const tripDetailsResults = await Promise.all(tripDetailsPromises);

        const tripDetailsMap: Record<string, TripDetail> = {};
        tripDetailsResults.forEach((detail) => {
          if (detail && detail.id) {
            tripDetailsMap[detail.id] = detail;
          }
        });

        setTripDetails({ ...tripDetails, ...tripDetailsMap });

        const inboundRoute: TripRoute = {
          id: inboundId,
          type: 'inbound',
          departureTime: new Date(firstSegment.boardTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(lastSegment.alightTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          totalPrice,
          segments: inbound.map((segment) => {
            const detail = tripDetailsMap[segment.tripId];
            const routeName = detail?.schedule?.route?.name || 'Ruta desconocida';
            return {
              tripId: segment.tripId,
              from: routeName,
              to: routeName,
              departureTime: new Date(segment.boardTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              arrivalTime: new Date(segment.alightTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              price: Number(segment.price),
            };
          }),
        };

        results.push({
          id: inboundId,
          departureTime: inboundRoute.departureTime,
          arrivalTime: inboundRoute.arrivalTime,
          price: inboundRoute.totalPrice,
          transfers: inbound.length - 1,
          departureLocation: locations.find((loc) => loc.id === toLocation)?.name,
          arrivalLocation: locations.find((loc) => loc.id === fromLocation)?.name,
        });

        details[inboundId] = inboundRoute;
      }

      setSearchResults(results);
      setTripsDetails(details);
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching for trips:', error);
      setIsLoading(false);
    }
  };

  const handleSwapLocations = () => {
    const tempFrom = fromLocation;
    setFromLocation(toLocation);
    setToLocation(tempFrom);
  };

  const handleTripSelection = (tripId: string) => {
    if (selectedTrips.includes(tripId)) {
      setSelectedTrips(selectedTrips.filter((id) => id !== tripId));
    } else {
      setSelectedTrips([...selectedTrips, tripId]);
    }
  };

  // Calculate total price of selected trips
  const getTotalPrice = () => {
    if (!searchResults) return 0;

    return selectedTrips.reduce((total, tripId) => {
      const trip = searchResults.find((result) => result.id === tripId);
      return total + (trip?.price || 0);
    }, 0);
  };

  // Open the checkout modal window
  const handleOpenCheckout = () => {
    if (selectedTrips.length > 0) {
      setIsCheckoutModalOpen(true);
    }
  };

  // Close the checkout modal window
  const handleCloseCheckout = () => {
    setIsCheckoutModalOpen(false);
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

              <div className="w-full md:w-auto flex justify-center mt-8">
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
                          <div className="flex flex-col md:flex-row justify-between items-center mb-2">
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
                                {' '}
                                {trip.arrivalTime}
                                {' '}
                                •
                                {' '}
                                {trip.transfers === 0 ? 'Directo' : `${trip.transfers} transbordo(s)`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end mt-4 md:mt-0">
                              <p className="text-xl font-bold text-red-600">
                                $
                                {trip.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <Button
                                color={selectedTrips.includes(trip.id) ? 'success' : 'primary'}
                                className="mt-2"
                                size="sm"
                                style={selectedTrips.includes(trip.id) ? { backgroundColor: 'rgb(34, 197, 94)' } : { backgroundColor: 'rgb(255, 0, 22)' }}
                                startContent={selectedTrips.includes(trip.id) ? <CheckIcon className="h-4 w-4" /> : null}
                                onClick={() => handleTripSelection(trip.id)}
                              >
                                {selectedTrips.includes(trip.id) ? 'Seleccionado' : 'Seleccionar'}
                              </Button>
                            </div>
                          </div>

                          {/* Route details with transfers */}
                          {tripsDetails[trip.id] && tripsDetails[trip.id].segments.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-sm font-semibold mb-2">
                                {tripsDetails[trip.id].type === 'outbound' ? 'Detalles de la ida:' : 'Detalles de la vuelta:'}
                              </p>
                              <div className="space-y-2">
                                {tripsDetails[trip.id].segments.map((segment, idx) => (
                                  <div key={`${segment.tripId}-${idx}`} className="bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {segment.from}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {segment.departureTime}
                                          {' '}
                                          -
                                          {segment.arrivalTime}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          ID de viaje:
                                          {' '}
                                          {segment.tripId.substring(0, 8)}
                                          ...
                                        </p>
                                      </div>
                                      <div className="text-sm font-semibold">
                                        $
                                        {segment.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    {idx < tripsDetails[trip.id].segments.length - 1 && (
                                      <div className="flex justify-center my-1">
                                        <div className="border border-dashed border-gray-300 w-1/2" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}

                    {/* Purchase button - displayed only when trips are selected */}
                    {selectedTrips.length > 0 && (
                      <div className="sticky bottom-4 flex justify-center mt-6">
                        <Button
                          size="lg"
                          color="success"
                          className="shadow-lg font-bold py-3 px-8"
                          startContent={(
                            <motion.div
                              initial={{ scale: 1 }}
                              animate={{
                                scale: [1, 1.2, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'loop',
                              }}
                            >
                              <ShoppingCartIcon className="h-5 w-5" />
                            </motion.div>
                          )}
                          style={{
                            backgroundColor: 'rgb(20, 83, 45)',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                          onClick={handleOpenCheckout}
                        >
                          Comprar
                          {' '}
                          {selectedTrips.length}
                          {' '}
                          {selectedTrips.length === 1 ? 'billete' : 'billetes'}
                          {' '}
                          ($
                          {getTotalPrice().toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          )
                        </Button>
                      </div>
                    )}
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

      {/* Checkout modal window */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseCheckout}
        selectedTrips={selectedTrips}
        tripsDetails={tripsDetails}
        tripResults={searchResults || []}
        getTotalPrice={getTotalPrice}
      />
    </div>
  );
}

export default UserDashboard;
