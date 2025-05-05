import { Request, Response, Router } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ticketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { canActivate } from '../common/middlewares/auth.middleware';
import { UserType } from '../users/user.entity';
import { ExpressRequest } from '../common/types/request';

const ticketRouter = Router();

// Get all tickets (admin only)
ticketRouter.get('/', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const tickets = await ticketsService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de boletos' });
  }
});

// Get tickets by trip ID (admin and driver of the trip)
ticketRouter.get('/trip/:tripId', async (req: ExpressRequest, res: Response) => {
  try {
    const { tripId } = req.params;

    // Check if user is admin or the driver of this trip
    if (req.user.type !== UserType.ADMIN
        && req.user.type !== UserType.DRIVER) {
      res.status(403).json({ error: 'No tiene permiso para ver los boletos de este viaje' });
    }

    const tickets = await ticketsService.getTripTickets(tripId);
    res.json(tickets);
  } catch (error) {
    console.error('Error getting trip tickets:', error);
    res.status(500).json({ error: error.message || 'Error al obtener los boletos del viaje' });
  }
});

// Get current user's tickets
ticketRouter.get('/user/me', async (req: ExpressRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const tickets = await ticketsService.getUserTickets(req.user.id);
    res.json(tickets);
  } catch (error) {
    console.error('Error getting user tickets:', error);
    res.status(500).json({ error: error.message || 'Error al obtener los boletos del usuario' });
  }
});

// Get user's tickets (admin and the user themselves)
ticketRouter.get('/user/:userId', async (req: ExpressRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user is admin or the owner of these tickets
    if (req.user.type !== UserType.ADMIN && req.user.id !== userId) {
      res.status(403).json({ error: 'No tiene permiso para ver estos boletos' });
    }

    const tickets = await ticketsService.getUserTickets(userId);
    res.json(tickets);
  } catch (error) {
    console.error('Error getting user tickets:', error);
    res.status(500).json({ error: error.message || 'Error al obtener los boletos del usuario' });
  }
});

// Validate ticket by validation code (admin and driver)
ticketRouter.get(
  '/validate/:validationCode',
  canActivate([UserType.ADMIN, UserType.DRIVER]),
  async (req: Request, res: Response) => {
    try {
      const { validationCode } = req.params;
      const { board } = req.query;

      // Get the ticket first
      const ticket = await ticketsService.getTicketByValidationCode(validationCode);

      // If board is true, mark as boarded
      if (board === 'true') {
        const boardedTicket = await ticketsService.boardTicket(validationCode);
        res.json({
          message: 'Boleto validado y marcado como abordado',
          ticket: boardedTicket,
        });
      }

      res.json({
        message: 'Boleto validado',
        ticket,
      });
    } catch (error) {
      console.error('Error validating ticket:', error);
      res.status(404).json({ error: error.message || 'Boleto no encontrado o no válido' });
    }
  },
);

// Get ticket by ID (admin, ticket owner, and driver of the trip)
ticketRouter.get('/:id', async (req: ExpressRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await ticketsService.getTicketById(id);

    // Check permissions (admin, ticket owner, or driver of the trip)
    if (
      req.user.type !== UserType.ADMIN
      && req.user.id !== ticket.userId
      && !(req.user.type === UserType.DRIVER && req.user.id === ticket.trip.driverId)
    ) {
      res.status(403).json({ error: 'No tiene permiso para ver este boleto' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error getting ticket:', error);
    res.status(404).json({ error: error.message || 'Boleto no encontrado' });
  }
});

// Create new ticket (admin and regular users)
ticketRouter.post('/', async (req: ExpressRequest, res: Response) => {
  try {
    const createTicketDto = plainToClass(CreateTicketDto, req.body);
    const errors = await validate(createTicketDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
    }

    // If not admin, user can only create tickets for themselves
    if (req.user.type !== UserType.ADMIN && req.user.id !== createTicketDto.userId) {
      res.status(403).json({ error: 'Solo puede comprar boletos para usted mismo' });
    }

    const ticket = await ticketsService.createTicket(createTicketDto);
    res.status(201).json({
      message: 'Boleto creado con éxito',
      ticket,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(400).json({ error: error.message || 'Error al crear el boleto' });
  }
});

// Update ticket (admin only)
ticketRouter.patch('/:id', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateTicketDto = plainToClass(UpdateTicketDto, req.body);
    const errors = await validate(updateTicketDto);

    if (errors.length > 0) {
      res.status(400).json({ errors });
    }

    const ticket = await ticketsService.updateTicket(id, updateTicketDto);
    res.json({
      message: 'Boleto actualizado con éxito',
      ticket,
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el boleto' });
  }
});

// Delete ticket (admin only)
ticketRouter.delete('/:id', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ticketsService.deleteTicket(id);
    res.json({
      message: 'Boleto eliminado con éxito',
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar el boleto' });
  }
});

// Create multiple tickets (admin only)
ticketRouter.post('/batch', canActivate([UserType.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { tickets } = req.body;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'La lista de boletos es inválida o vacía' });
    }

    // Validate all tickets first
    const ticketDtos = tickets.map((ticketData) => plainToClass(CreateTicketDto, ticketData));
    const validationPromises = ticketDtos.map((dto) => validate(dto));
    const validationResults = await Promise.all(validationPromises);

    // Filter out invalid tickets
    const validTickets = ticketDtos.filter((_, index) => validationResults[index].length === 0);

    if (validTickets.length === 0) {
      res.status(400).json({ error: 'Ninguno de los boletos proporcionados es válido' });
    }

    // Create tickets using the service
    const createdTickets = await ticketsService.createTickets(validTickets);

    res.status(201).json({
      message: `${createdTickets.length} boletos creados con éxito`,
      tickets: createdTickets,
    });
  } catch (error) {
    console.error('Error in batch ticket creation:', error);
    res.status(400).json({ error: error.message || 'Error al crear los boletos en lote' });
  }
});

export { ticketRouter };
