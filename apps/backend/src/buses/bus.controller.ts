import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { busService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';

const busRouter = Router();

// Get all buses (available to everyone)
busRouter.get('/', async (req: Request, res: Response) => {
  try {
    const buses = await busService.getAllBuses();
    res.json(buses);
  } catch (error) {
    console.error('Error getting buses:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de autobuses' });
  }
});

// Get bus by ID (available to everyone)
busRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bus = await busService.getBusById(id);
    res.json(bus);
  } catch (error) {
    console.error('Error getting bus:', error);
    res.status(404).json({ error: error.message || 'Autobús no encontrado' });
  }
});

// Create new bus (admin only)
busRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createBusDto = plainToClass(CreateBusDto, req.body);
    const errors = await validate(createBusDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const bus = await busService.createBus(createBusDto);
    res.status(201).json({
      message: 'Autobús creado con éxito',
      bus,
    });
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(400).json({ error: error.message || 'Error al crear el autobús' });
  }
});

// Update bus (admin only)
busRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateBusDto = plainToClass(UpdateBusDto, req.body);
    const errors = await validate(updateBusDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const bus = await busService.updateBus(id, updateBusDto);
    res.json({
      message: 'Autobús actualizado con éxito',
      bus,
    });
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el autobús' });
  }
});

// Delete bus (admin only)
busRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await busService.deleteBus(id);
    res.json({
      message: 'Autobús eliminado con éxito',
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el autobús' });
  }
});

export { busRouter };
