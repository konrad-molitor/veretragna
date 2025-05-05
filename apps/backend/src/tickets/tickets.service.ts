import { In } from 'typeorm';
import * as crypto from 'crypto';
import { Ticket, TicketStatus } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Trip } from '../trips/trip.entity';
import { User } from '../users/user.entity';
import { RouteStop } from '../routes/route-stop.entity';

class TicketsService {
  // Get all tickets
  async getAllTickets(): Promise<Ticket[]> {
    return Ticket.find({
      relations: ['trip', 'user', 'startRouteStop', 'endRouteStop'],
    });
  }

  // Get ticket by ID
  async getTicketById(id: string): Promise<Ticket> {
    const ticket = await Ticket.findOne({
      where: { id },
      relations: ['trip', 'user', 'startRouteStop', 'endRouteStop'],
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  // Get ticket by validation code
  async getTicketByValidationCode(validationCode: string): Promise<Ticket> {
    const ticket = await Ticket.findOne({
      where: { validationCode },
      relations: ['trip', 'user', 'startRouteStop', 'endRouteStop'],
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  // Get user tickets
  async getUserTickets(userId: string): Promise<Ticket[]> {
    return Ticket.find({
      where: { userId },
      relations: ['trip', 'startRouteStop', 'endRouteStop', 'startRouteStop.location', 'endRouteStop.location'],
    });
  }

  // Get trip tickets
  async getTripTickets(tripId: string): Promise<Ticket[]> {
    return Ticket.find({
      where: { tripId },
      relations: ['user', 'startRouteStop', 'endRouteStop', 'startRouteStop.location', 'endRouteStop.location'],
    });
  }

  // Generate a random 6-character alphanumeric validation code (no ambiguous characters)
  private generateValidationCode(): string {
    // Only use unambiguous characters (exclude 0, 1, I, O, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Generate 3 random bytes (will give us 6 hex chars)
    const randomBytes = crypto.randomBytes(3);
    let code = '';

    // Convert each byte to 2 characters from our charset
    for (let i = 0; i < randomBytes.length; i += 1) {
      const byte = randomBytes[i];
      // Use each byte to generate two indices into our charset
      const index1 = byte % chars.length;
      const index2 = Math.floor(byte / chars.length) % chars.length;

      code += chars[index1] + chars[index2];
    }

    // Ensure we have exactly 6 characters
    return code.slice(0, 6);
  }

  // Generate a unique validation code that doesn't exist in the database yet
  private async generateUniqueValidationCode(): Promise<string> {
    let code: string;
    let existingTicket: Ticket | null;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateValidationCode();
       
      existingTicket = await Ticket.findOneBy({ validationCode: code });
      attempts += 1;

      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique validation code after multiple attempts');
      }
    } while (existingTicket);

    return code;
  }

  // Create ticket
  async createTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Check if related entities exist
    const trip = await Trip.findOneBy({ id: createTicketDto.tripId });
    if (!trip) {
      throw new Error('Trip not found');
    }

    const user = await User.findOneBy({ id: createTicketDto.userId });
    if (!user) {
      throw new Error('User not found');
    }

    const startRouteStop = await RouteStop.findOneBy({ id: createTicketDto.startRouteStopId });
    if (!startRouteStop) {
      throw new Error('Start route stop not found');
    }

    const endRouteStop = await RouteStop.findOneBy({ id: createTicketDto.endRouteStopId });
    if (!endRouteStop) {
      throw new Error('End route stop not found');
    }

    // Generate unique validation code
    const validationCode = await this.generateUniqueValidationCode();

    // Create new ticket
    const ticket = new Ticket();
    Object.assign(ticket, {
      ...createTicketDto,
      validationCode,
      status: TicketStatus.PAID,
    });

    // Increase booked seats count in associated trip
    trip.bookedSeats += 1;
    await trip.save();

    await ticket.save();
    return ticket;
  }

  // Update ticket
  async updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.getTicketById(id);

    Object.assign(ticket, updateTicketDto);

    await ticket.save();
    return ticket;
  }

  // Board ticket (mark as boarded)
  async boardTicket(validationCode: string): Promise<Ticket> {
    const ticket = await this.getTicketByValidationCode(validationCode);

    if (ticket.status === TicketStatus.BOARDED) {
      throw new Error('Ticket has already been boarded');
    }

    ticket.status = TicketStatus.BOARDED;
    await ticket.save();
    return ticket;
  }

  // Delete ticket
  async deleteTicket(id: string): Promise<void> {
    const ticket = await this.getTicketById(id);

    // Decrease booked seats count in associated trip
    const trip = await Trip.findOneBy({ id: ticket.tripId });
    if (trip) {
      trip.bookedSeats = Math.max(0, trip.bookedSeats - 1);
      await trip.save();
    }

    await ticket.softRemove();
  }

  // Create multiple tickets
  async createTickets(createTicketDtos: CreateTicketDto[]): Promise<Ticket[]> {
    const tickets: Ticket[] = [];

    // Using Promise.all to avoid await in loop
    await Promise.all(
      createTicketDtos.map(async (dto) => {
        const ticket = await this.createTicket(dto);
        tickets.push(ticket);
      }),
    );

    return tickets;
  }
}

export const ticketsService = new TicketsService();
