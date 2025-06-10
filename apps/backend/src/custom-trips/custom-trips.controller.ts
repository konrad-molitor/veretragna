import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { customTripsService } from './custom-trips.service';
import { CreateCustomTripDto } from './dto/create-custom-trip.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';
import { CustomTripStatus } from './custom-trip.entity';

const customTripsRouter = Router();

// Create custom trip (admin only)
customTripsRouter.post('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const createCustomTripDto = plainToClass(CreateCustomTripDto, req.body);
    const errors = await validate(createCustomTripDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const customTrip = await customTripsService.create(createCustomTripDto);
    res.status(201).json({
      message: 'Reserva creada exitosamente',
      customTrip,
    });
  } catch (error: unknown) {
    console.error('Error creating custom trip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear la reserva';
    res.status(400).json({ error: errorMessage });
  }
});

// Get all custom trips (admin only)
customTripsRouter.get('/', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const customTrips = await customTripsService.findAll();
    res.json(customTrips);
  } catch (error: unknown) {
    console.error('Error getting custom trips:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener las reservas';
    res.status(500).json({ error: errorMessage });
  }
});

// Get custom trip by payment token (public)
customTripsRouter.get('/payment/:paymentToken', canActivate([UserType.USER]), async (req: Request, res: Response) => {
  try {
    const { paymentToken } = req.params;
    const customTrip = await customTripsService.findByPaymentToken(paymentToken);
    res.json(customTrip);
  } catch (error: unknown) {
    console.error('Error getting custom trip by payment token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Reserva no encontrada';
    res.status(404).json({ error: errorMessage });
  }
});

// Get current user's custom trips (authenticated users)
customTripsRouter.get('/user/me', async (req: ExpressRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const customTrips = await customTripsService.findByCustomerEmail(userEmail);
    res.json(customTrips);
  } catch (error: unknown) {
    console.error('Error getting user custom trips:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener las reservas';
    res.status(500).json({ error: errorMessage });
  }
});

// Mark custom trip as paid (public)
customTripsRouter.post('/payment/:paymentToken/pay', async (req: Request, res: Response) => {
  try {
    const { paymentToken } = req.params;
    const customTrip = await customTripsService.markAsPaid(paymentToken);
    res.json({
      message: 'Reserva pagada exitosamente',
      customTrip,
    });
  } catch (error: unknown) {
    console.error('Error marking custom trip as paid:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago';
    res.status(400).json({ error: errorMessage });
  }
});

// Get custom trip by ID (admin only)
customTripsRouter.get('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customTrip = await customTripsService.findOne(id);
    res.json(customTrip);
  } catch (error: unknown) {
    console.error('Error getting custom trip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Reserva no encontrada';
    res.status(404).json({ error: errorMessage });
  }
});

// Update custom trip status (admin only)
customTripsRouter.patch('/:id/status', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(CustomTripStatus).includes(status)) {
      res.status(400).json({ error: 'Estado de reserva inválido' });
      return;
    }

    const customTrip = await customTripsService.updateStatus(id, status);
    res.json({
      message: 'Estado de la reserva actualizado',
      customTrip,
    });
  } catch (error: unknown) {
    console.error('Error updating custom trip status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el estado de la reserva';
    res.status(400).json({ error: errorMessage });
  }
});

// Delete custom trip (admin only)
customTripsRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    await customTripsService.remove(id);
    res.json({ message: 'Reserva eliminada' });
  } catch (error: unknown) {
    console.error('Error deleting custom trip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la reserva';
    res.status(400).json({ error: errorMessage });
  }
});

// Update custom trip (admin only) - only for pending_payment status
customTripsRouter.put('/:id', canActivate([UserType.ADMIN]), async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateCustomTripDto = plainToClass(CreateCustomTripDto, req.body);
    const errors = await validate(updateCustomTripDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const customTrip = await customTripsService.update(id, updateCustomTripDto);
    res.json({
      message: 'Reserva actualizada exitosamente',
      customTrip,
    });
  } catch (error: unknown) {
    console.error('Error updating custom trip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la reserva';
    res.status(400).json({ error: errorMessage });
  }
});

export { customTripsRouter };