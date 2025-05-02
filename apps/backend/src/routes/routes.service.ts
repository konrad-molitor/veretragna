import { In } from 'typeorm';
import { Route } from './route.entity';
import { RouteStop } from './route-stop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { Location } from '../locations/location.entity';

class RoutesService {
  // Get all routes
  async getAllRoutes(): Promise<Route[]> {
    return Route.find({
      relations: ['stops', 'stops.location'],
      order: {
        stops: {
          sequenceOrder: 'ASC',
        },
      },
    });
  }

  // Get route by ID
  async getRouteById(id: string): Promise<Route> {
    const route = await Route.findOne({
      where: { id },
      relations: ['stops', 'stops.location'],
      order: {
        stops: {
          sequenceOrder: 'ASC',
        },
      },
    });

    if (!route) {
      throw new Error('Ruta no encontrada');
    }

    return route;
  }

  // Create new route
  async createRoute(createRouteDto: CreateRouteDto): Promise<Route> {
    const { stops, ...routeData } = createRouteDto;

    // Create and save route
    const route = new Route();
    Object.assign(route, {
      ...routeData,
      boardingPrice: typeof routeData.boardingPrice === 'number' ? routeData.boardingPrice : 0,
    });
    await route.save();

    // If stops are provided, create them
    if (stops && stops.length > 0) {
      await this.createRouteStops(route.id, stops);
    }

    // Return the route with stops
    return this.getRouteById(route.id);
  }

  // Create route stops
  async createRouteStops(routeId: string, stopsDto: CreateRouteStopDto[]): Promise<RouteStop[]> {
    const route = await Route.findOneByOrFail({ id: routeId });

    // Validate that all location IDs exist
    const locationIds = stopsDto.map((stop) => stop.locationId);
    const locations = await Location.findBy({ id: In(locationIds) });

    if (locations.length !== locationIds.length) {
      throw new Error('Una o más ubicaciones no fueron encontradas');
    }

    // Create RouteStop entities
    const routeStops = stopsDto.map((stopDto) => {
      const routeStop = new RouteStop();
      routeStop.route = route;
      routeStop.location = locations.find((loc) => loc.id === stopDto.locationId);
      routeStop.sequenceOrder = stopDto.sequenceOrder;
      routeStop.timeOffsetMinutesArrival = stopDto.timeOffsetMinutesArrival;
      routeStop.stopDurationMinutes = stopDto.stopDurationMinutes;
      routeStop.price = typeof stopDto.price === 'number' ? stopDto.price : 0;
      return routeStop;
    });

    // Save all route stops
    return RouteStop.save(routeStops);
  }

  // Update existing route
  async updateRoute(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.getRouteById(id);

    // Update route fields
    Object.assign(route, {
      ...updateRouteDto,
      boardingPrice: typeof updateRouteDto.boardingPrice === 'number' ? updateRouteDto.boardingPrice : route.boardingPrice,
    });
    await route.save();

    return route;
  }

  // Delete route (and associated stops via cascade)
  async deleteRoute(id: string): Promise<void> {
    const route = await this.getRouteById(id);

    await route.softRemove();
  }

  // Add a stop to an existing route
  async addRouteStop(routeId: string, stopDto: CreateRouteStopDto): Promise<RouteStop> {
    const route = await this.getRouteById(routeId);
    const location = await Location.findOneByOrFail({ id: stopDto.locationId });

    // Check if the sequence order already exists
    const existingStop = await RouteStop.findOne({
      where: {
        route: { id: routeId },
        sequenceOrder: stopDto.sequenceOrder,
      },
    });

    if (existingStop) {
      throw new Error(`Ya existe una parada con el orden de secuencia ${stopDto.sequenceOrder}`);
    }

    // Create the new stop
    const routeStop = new RouteStop();
    routeStop.route = route;
    routeStop.location = location;
    routeStop.sequenceOrder = stopDto.sequenceOrder;
    routeStop.timeOffsetMinutesArrival = stopDto.timeOffsetMinutesArrival;
    routeStop.stopDurationMinutes = stopDto.stopDurationMinutes;
    routeStop.price = typeof stopDto.price === 'number' ? stopDto.price : 0;

    await routeStop.save();
    return routeStop;
  }

  // Remove a stop from a route
  async removeRouteStop(routeId: string, stopId: string): Promise<void> {
    const routeStop = await RouteStop.findOne({
      where: {
        id: stopId,
        route: { id: routeId },
      },
    });

    if (!routeStop) {
      throw new Error('Parada de ruta no encontrada');
    }

    await routeStop.softRemove();
  }

  // Update a stop from a route
  async updateRouteStop(
    routeId: string,
    stopId: string,
    updateDto: UpdateRouteStopDto,
  ): Promise<RouteStop> {
    const routeStop = await RouteStop.findOne({
      where: {
        id: stopId,
        route: { id: routeId },
      },
      relations: ['location'],
    });

    if (!routeStop) {
      throw new Error('Parada de ruta no encontrada');
    }

    // If locationId is provided, find the location
    if (updateDto.locationId) {
      const location = await Location.findOneByOrFail({ id: updateDto.locationId });
      routeStop.location = location;
    }

    // If sequenceOrder is changing, check if it conflicts with another stop
    if (updateDto.sequenceOrder && updateDto.sequenceOrder !== routeStop.sequenceOrder) {
      const existingStop = await RouteStop.findOne({
        where: {
          route: { id: routeId },
          sequenceOrder: updateDto.sequenceOrder,
        },
      });

      if (existingStop && existingStop.id !== stopId) {
        throw new Error(`Ya existe una parada con el orden de secuencia ${updateDto.sequenceOrder}`);
      }
    }

    // Update fields
    if (typeof updateDto.sequenceOrder === 'number') {
      routeStop.sequenceOrder = updateDto.sequenceOrder;
    }
    if (typeof updateDto.timeOffsetMinutesArrival === 'number') {
      routeStop.timeOffsetMinutesArrival = updateDto.timeOffsetMinutesArrival;
    }
    if (typeof updateDto.stopDurationMinutes === 'number') {
      routeStop.stopDurationMinutes = updateDto.stopDurationMinutes;
    }
    if (typeof updateDto.price === 'number') {
      routeStop.price = updateDto.price;
    }

    await routeStop.save();
    return routeStop;
  }
}

export const routesService = new RoutesService();
