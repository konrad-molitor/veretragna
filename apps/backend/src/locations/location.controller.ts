import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { locationService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';

const locationRouter = Router();

// Get all locations (available to everyone)
locationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const locations = await locationService.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de ubicaciones' });
  }
});

// Get location by ID (available to everyone)
locationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await locationService.getLocationById(id);
    res.json(location);
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(404).json({ error: error.message || 'Ubicación no encontrada' });
  }
});

// Create new location (admin only)
locationRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createLocationDto = plainToClass(CreateLocationDto, req.body);
    const errors = await validate(createLocationDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const location = await locationService.createLocation(createLocationDto);
    res.status(201).json({
      message: 'Ubicación creada con éxito',
      location,
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(400).json({ error: error.message || 'Error al crear la ubicación' });
  }
});

// Update location (admin only)
locationRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateLocationDto = plainToClass(UpdateLocationDto, req.body);
    const errors = await validate(updateLocationDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const location = await locationService.updateLocation(id, updateLocationDto);
    res.json({
      message: 'Ubicación actualizada con éxito',
      location,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar la ubicación' });
  }
});

// Delete location (admin only)
locationRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await locationService.deleteLocation(id);
    res.json({
      message: 'Ubicación eliminada con éxito',
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar la ubicación' });
  }
});

export { locationRouter };
