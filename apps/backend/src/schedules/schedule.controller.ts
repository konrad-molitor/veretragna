import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { scheduleService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';

const scheduleRouter = Router();

// Get all schedules (available to everyone)
scheduleRouter.get('/', async (req: Request, res: Response) => {
  try {
    const schedules = await scheduleService.getAllSchedules();
    res.json(schedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de horarios' });
  }
});

// Get schedules by route (available to everyone)
scheduleRouter.get('/route/:routeId', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const schedules = await scheduleService.getSchedulesByRoute(routeId);
    res.json(schedules);
  } catch (error) {
    console.error('Error getting schedules by route:', error);
    res.status(500).json({ error: error.message || 'Error al obtener horarios para la ruta' });
  }
});

// Get schedule by ID (available to everyone)
scheduleRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);
    res.json(schedule);
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(404).json({ error: error.message || 'Horario no encontrado' });
  }
});

// Create new schedule (admin only)
scheduleRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createScheduleDto = plainToClass(CreateScheduleDto, req.body);
    const errors = await validate(createScheduleDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const schedule = await scheduleService.createSchedule(createScheduleDto);
    res.status(201).json({
      message: 'Horario creado con éxito',
      schedule,
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(400).json({ error: error.message || 'Error al crear el horario' });
  }
});

// Update schedule (admin only)
scheduleRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateScheduleDto = plainToClass(UpdateScheduleDto, req.body);
    const errors = await validate(updateScheduleDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const schedule = await scheduleService.updateSchedule(id, updateScheduleDto);
    res.json({
      message: 'Horario actualizado con éxito',
      schedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el horario' });
  }
});

// Delete schedule (admin only)
scheduleRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id);
    res.json({
      message: 'Horario eliminado con éxito',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el horario' });
  }
});

export { scheduleRouter };
