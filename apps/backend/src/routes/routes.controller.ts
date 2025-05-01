import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { routesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';

const routesRouter = Router();

// Get all routes (available to everyone)
routesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const routes = await routesService.getAllRoutes();
    res.json(routes);
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de rutas' });
  }
});

// Get route by ID (available to everyone)
routesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const route = await routesService.getRouteById(id);
    res.json(route);
  } catch (error) {
    console.error('Error getting route:', error);
    res.status(404).json({ error: error.message || 'Ruta no encontrada' });
  }
});

// Create new route with stops (admin only)
routesRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createRouteDto = plainToClass(CreateRouteDto, req.body);
    const errors = await validate(createRouteDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const route = await routesService.createRoute(createRouteDto);
    res.status(201).json({
      message: 'Ruta creada con éxito',
      route,
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(400).json({ error: error.message || 'Error al crear la ruta' });
  }
});

// Update route (admin only)
routesRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateRouteDto = plainToClass(UpdateRouteDto, req.body);
    const errors = await validate(updateRouteDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const route = await routesService.updateRoute(id, updateRouteDto);
    res.json({
      message: 'Ruta actualizada con éxito',
      route,
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar la ruta' });
  }
});

// Delete route (admin only)
routesRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await routesService.deleteRoute(id);
    res.json({
      message: 'Ruta eliminada con éxito',
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar la ruta' });
  }
});

// Add stop to route (admin only)
routesRouter.post('/:id/stops', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stopDto = plainToClass(CreateRouteStopDto, req.body);
    const errors = await validate(stopDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const routeStop = await routesService.addRouteStop(id, stopDto);
    res.status(201).json({
      message: 'Parada añadida con éxito',
      routeStop,
    });
  } catch (error) {
    console.error('Error adding stop:', error);
    res.status(400).json({ error: error.message || 'Error al añadir la parada' });
  }
});

// Remove stop from route (admin only)
routesRouter.delete('/:routeId/stops/:stopId', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { routeId, stopId } = req.params;
    await routesService.removeRouteStop(routeId, stopId);
    res.json({
      message: 'Parada eliminada con éxito',
    });
  } catch (error) {
    console.error('Error removing stop:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar la parada' });
  }
});

export { routesRouter }; 