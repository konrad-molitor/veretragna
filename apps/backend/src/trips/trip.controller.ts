import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { tripService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';
import { TripStatus } from './trip.entity';
import { tripsSearchService } from './trips-search.service';
import { SearchTripsDto } from './dto/search-trips.dto';

const tripRouter = Router();

// Get all trips (admin and driver)
tripRouter.get('/', canActivate([UserType.ADMIN, UserType.DRIVER]), async (req: ExpressRequest, res: Response) => {
  try {
    const trips = await tripService.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error('Error getting trips:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de viajes' });
  }
});

// Get upcoming trips (available to all)
tripRouter.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const trips = await tripService.getUpcomingTrips();
    res.json(trips);
  } catch (error) {
    console.error('Error getting upcoming trips:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de próximos viajes' });
  }
});

// Get trips by status (admin only)
tripRouter.get('/status/:status', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    if (!Object.values(TripStatus).includes(status as TripStatus)) {
      res.status(400).json({ error: 'Estado de viaje no válido' });
      return;
    }

    const trips = await tripService.getTripsByStatus(status as TripStatus);
    res.json(trips);
  } catch (error) {
    console.error('Error getting trips by status:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de viajes por estado' });
  }
});

// Get trips by driver (admin and specific driver)
tripRouter.get('/driver/:driverId', async (req: ExpressRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    // Allow driver to see only their own trips
    if (req.user.type === UserType.DRIVER && req.user.id !== driverId) {
      res.status(403).json({ error: 'No tiene permiso para ver viajes de otros conductores' });
      return;
    }

    const trips = await tripService.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error('Error getting trips by driver:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de viajes por conductor' });
  }
});

// Get trips by bus (admin only)
tripRouter.get('/bus/:busId', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const trips = await tripService.getTripsByBus(busId);
    res.json(trips);
  } catch (error) {
    console.error('Error getting trips by bus:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de viajes por autobús' });
  }
});

// Bulk update trips (admin only) - NEW ENDPOINT
tripRouter.patch('/bulk', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { tripIds, updateData } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      res.status(400).json({ error: 'La lista de viajes es inválida o vacía' });
      return;
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
      return;
    }

    // Convert updateStatus flag to boolean and remove from updateData
    const shouldUpdateStatus = updateData.updateStatus === 'true';
    const cleanedUpdateData = { ...updateData };
    delete cleanedUpdateData.updateStatus;

    // Update all trips in batch
    const updatedTrips = await tripService.updateTripsInBulk(
      tripIds,
      cleanedUpdateData,
      shouldUpdateStatus,
    );

    res.json({
      message: `${updatedTrips.length} viajes actualizados con éxito`,
      updatedCount: updatedTrips.length,
    });
  } catch (error) {
    console.error('Error updating trips in bulk:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar los viajes en lote' });
  }
});

// Get trip by ID (admin, driver of the trip, and users with bookings)
tripRouter.get('/:id', async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await tripService.getTripById(id);

    // Check permissions (simplified - may need to check booking ownership for regular users)
    if (
      req.user.type !== UserType.ADMIN
      && (req.user.type === UserType.DRIVER && req.user.id !== trip.driverId)
    ) {
      res.status(403).json({ error: 'No tiene permiso para ver este viaje' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Error getting trip:', error);
    res.status(404).json({ error: error.message || 'Viaje no encontrado' });
  }
});

// Create new trip (admin only)
tripRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createTripDto = plainToClass(CreateTripDto, req.body);
    const errors = await validate(createTripDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const trip = await tripService.createTrip(createTripDto);
    res.status(201).json({
      message: 'Viaje creado con éxito',
      trip,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(400).json({ error: error.message || 'Error al crear el viaje' });
  }
});

// Update trip (admin only)
tripRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateTripDto = plainToClass(UpdateTripDto, req.body);
    const errors = await validate(updateTripDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const trip = await tripService.updateTrip(id, updateTripDto);
    res.json({
      message: 'Viaje actualizado con éxito',
      trip,
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el viaje' });
  }
});

// Delete trip (admin only)
tripRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await tripService.deleteTrip(id);
    res.json({
      message: 'Viaje eliminado con éxito',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el viaje' });
  }
});

// Create multiple trips (admin only)
tripRouter.post('/batch', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { trips } = req.body;

    if (!Array.isArray(trips) || trips.length === 0) {
      res.status(400).json({ error: 'La lista de viajes es inválida o vacía' });
      return;
    }

    // Validate all trips first
    const tripDtos = trips.map((tripData) => plainToClass(CreateTripDto, tripData));
    const validationPromises = tripDtos.map((dto) => validate(dto));
    const validationResults = await Promise.all(validationPromises);

    // Filter out invalid trips
    const validTrips = tripDtos.filter((_, index) => validationResults[index].length === 0);

    if (validTrips.length === 0) {
      res.status(400).json({ error: 'Ninguno de los viajes proporcionados es válido' });
      return;
    }

    // Create trips using the service
    const createdTrips = await tripService.createTrips(validTrips);

    res.status(201).json(createdTrips);
  } catch (error) {
    console.error('Error in batch trip creation:', error);
    res.status(400).json({ error: error.message || 'Error al crear los viajes en lote' });
  }
});

// Search for trips with connections between locations
tripRouter.post('/search', async (req: Request, res: Response) => {
  try {
    const searchTripsDto = plainToClass(SearchTripsDto, req.body);
    const errors = await validate(searchTripsDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const {
      fromLocationId,
      toLocationId,
      departureDate,
      returnDate,
      minTransferMinutes = 5,
      searchWindowDays = 30,
    } = searchTripsDto;

    const result = await tripsSearchService.findRoundTrip(
      fromLocationId,
      toLocationId,
      new Date(departureDate),
      new Date(returnDate),
      minTransferMinutes * 60 * 1000, // convert to milliseconds
      searchWindowDays,
    );

    if (!result.outbound) {
      res.status(404).json({
        error: 'No se encontraron viajes disponibles para la ruta de ida',
      });
      return;
    }

    if (!result.inbound) {
      res.status(404).json({
        error: 'No se encontraron viajes disponibles para la ruta de vuelta',
      });
      return;
    }

    res.json({
      message: 'Búsqueda completada con éxito',
      result,
    });
  } catch (error) {
    console.error('Error searching for trips:', error);
    res.status(500).json({
      error: error.message || 'Error en la búsqueda de viajes',
    });
  }
});

export { tripRouter };
