import { FindOptionsWhere, MoreThanOrEqual, In } from 'typeorm';
import { Trip, TripStatus } from './trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Bus } from '../buses/bus.entity';
import { User, UserType } from '../users/user.entity';
import { Schedule } from '../schedules/schedule.entity';

class TripService {
  // Get all trips
  async getAllTrips(
    where: FindOptionsWhere<Trip> = {},
    relations: string[] = ['schedule', 'schedule.route', 'bus', 'driver'],
  ): Promise<Trip[]> {
    return Trip.find({
      where,
      relations,
      order: { departureDateTime: 'ASC' },
    });
  }

  // Get trip by ID
  async getTripById(id: string): Promise<Trip> {
    const trip = await Trip.findOne({
      where: { id },
      relations: ['schedule', 'schedule.route', 'bus', 'driver'],
    });

    if (!trip) {
      throw new Error('Viaje no encontrado');
    }

    return trip;
  }

  // Create new trip
  async createTrip(createTripDto: CreateTripDto): Promise<Trip> {
    // Validate schedule exists
    const schedule = await Schedule.findOneBy({ id: createTripDto.scheduleId });
    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    // Validate bus if provided
    if (createTripDto.busId) {
      const bus = await Bus.findOneBy({ id: createTripDto.busId });
      if (!bus) {
        throw new Error('Autobús no encontrado');
      }
    }

    // Validate driver if provided
    if (createTripDto.driverId) {
      const driver = await User.findOne({
        where: {
          id: createTripDto.driverId,
          type: UserType.DRIVER,
        },
      });
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }
    }

    const trip = new Trip();
    Object.assign(trip, createTripDto);

    await trip.save();

    // Load full trip data after saving
    return this.getTripById(trip.id);
  }

  // Update existing trip
  async updateTrip(id: string, updateTripDto: UpdateTripDto): Promise<Trip> {
    const trip = await this.getTripById(id);

    // Validate if trying to set status to SCHEDULED
    if (
      updateTripDto.status === TripStatus.SCHEDULED
      && trip.status === TripStatus.PENDING
    ) {
      // Check if bus and driver are assigned
      const hasDriver = updateTripDto.driverId || trip.driverId;
      const hasBus = updateTripDto.busId || trip.busId;

      if (!hasDriver || !hasBus) {
        throw new Error('No se puede programar un viaje sin asignar un conductor y un autobús');
      }
    }

    // Validate schedule if provided
    if (updateTripDto.scheduleId) {
      const schedule = await Schedule.findOneBy({ id: updateTripDto.scheduleId });
      if (!schedule) {
        throw new Error('Horario no encontrado');
      }
    }

    // Validate bus if provided
    if (updateTripDto.busId) {
      const bus = await Bus.findOneBy({ id: updateTripDto.busId });
      if (!bus) {
        throw new Error('Autobús no encontrado');
      }
    }

    // Validate driver if provided
    if (updateTripDto.driverId) {
      const driver = await User.findOne({
        where: {
          id: updateTripDto.driverId,
          type: UserType.DRIVER,
        },
      });
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }
    }

    Object.assign(trip, updateTripDto);
    await trip.save();

    return trip;
  }

  // Delete trip
  async deleteTrip(id: string): Promise<void> {
    const trip = await this.getTripById(id);

    await trip.softRemove();
  }

  // Get upcoming trips
  async getUpcomingTrips(): Promise<Trip[]> {
    const now = new Date();

    return this.getAllTrips({
      departureDateTime: MoreThanOrEqual(now),
      status: In([TripStatus.SCHEDULED, TripStatus.PENDING, TripStatus.BOARDING]),
    });
  }

  // Get trips by status
  async getTripsByStatus(status: TripStatus): Promise<Trip[]> {
    return this.getAllTrips({ status });
  }

  // Get trips by driver
  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return this.getAllTrips({ driverId });
  }

  // Get trips by bus
  async getTripsByBus(busId: string): Promise<Trip[]> {
    return this.getAllTrips({ busId });
  }

  // Batch create trips
  async createTrips(tripDtos: CreateTripDto[]): Promise<Trip[]> {
    const createdTripIds: string[] = [];

    // Use Promise.all for parallel trip creation
    const creationPromises = tripDtos.map((dto) => this.createTrip(dto)
      .then((trip) => {
        createdTripIds.push(trip.id);
        return trip;
      })
      .catch((error) => {
        console.error('Error creating individual trip:', error);
        return null;
      }));

    await Promise.all(creationPromises);

    // If there are created trips, return them with loaded relations
    if (createdTripIds.length > 0) {
      return Trip.find({
        where: { id: In(createdTripIds) },
        relations: ['schedule', 'schedule.route', 'bus', 'driver'],
        order: { departureDateTime: 'ASC' },
      });
    }

    return [];
  }
}

export const tripService = new TripService();
