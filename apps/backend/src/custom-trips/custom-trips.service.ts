import { v4 as uuidv4 } from 'uuid';
import { In } from 'typeorm';
import { CustomTrip, CustomTripStatus } from './custom-trip.entity';
import { CreateCustomTripDto } from './dto/create-custom-trip.dto';
import { Bus } from '../buses/bus.entity';
import { User, UserType } from '../users/user.entity';
import { mailerService } from '../mailer/mailer.service';

class CustomTripsService {
  async create(createCustomTripDto: CreateCustomTripDto): Promise<CustomTrip> {
    const {
      busIds, driverIds, maxSeats, ...tripData
    } = createCustomTripDto;

    // Validate buses exist
    const buses = await Bus.findBy({ id: In(busIds) });
    if (buses.length !== busIds.length) {
      throw new Error('Uno o más vehículos no fueron encontrados');
    }

    // Calculate total capacity from buses
    const totalCapacity = buses.reduce((sum, bus) => {
      const busCapacity = Object.values(bus.totalSeats).reduce((total, seats) => total + seats, 0);
      return sum + busCapacity;
    }, 0);

    // Validate max seats doesn't exceed bus capacity
    if (maxSeats > totalCapacity) {
      throw new Error(`El número máximo de asientos (${maxSeats}) excede la capacidad de los vehículos (${totalCapacity})`);
    }

    // Validate drivers exist and are drivers
    const drivers = await User.findBy({
      id: In(driverIds),
      type: UserType.DRIVER,
    });
    if (drivers.length !== driverIds.length) {
      throw new Error('Uno o más conductores no fueron encontrados o no son conductores');
    }

    // Validate drivers >= buses
    if (driverIds.length < busIds.length) {
      throw new Error(`El número de conductores (${driverIds.length}) debe ser igual o mayor al número de vehículos (${busIds.length})`);
    }

    // Validate route stops timing
    if (tripData.route && tripData.route.length > 1) {
      for (let i = 1; i < tripData.route.length; i += 1) {
        const currentStop = tripData.route[i];
        const previousStops = tripData.route.slice(0, i);
        const minRequiredTime = previousStops.reduce(
          (total, prevStop) => (
            total + prevStop.timeOffsetMinutesArrival + prevStop.stopDurationMinutes
          ),
          0,
        );

        if (currentStop.timeOffsetMinutesArrival <= minRequiredTime) {
          throw new Error(`El tiempo de llegada de la parada ${i + 1} debe ser mayor a ${minRequiredTime} minutos`);
        }
      }
    }

    // Generate unique payment token
    const paymentToken = uuidv4();

    // Create custom trip
    const customTrip = new CustomTrip();
    Object.assign(customTrip, {
      ...tripData,
      maxSeats,
      bookedSeats: 0,
      paymentToken,
      startDateTime: new Date(tripData.startDateTime),
    });

    await customTrip.save();

    // Set relations
    customTrip.buses = buses;
    customTrip.drivers = drivers;
    await customTrip.save();

    // Send payment link email
    try {
      const formattedDateTime = new Date(tripData.startDateTime).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      await mailerService.sendPaymentLinkEmail(
        tripData.customerEmail,
        tripData.customerName,
        tripData.name,
        tripData.description,
        formattedDateTime,
        tripData.price,
        maxSeats,
        paymentToken,
      );
    } catch (emailError) {
      console.error('Error sending payment link email:', emailError);
      // Don't throw error - trip was created successfully
    }

    return customTrip;
  }

  async findAll(): Promise<CustomTrip[]> {
    return CustomTrip.find({
      relations: ['buses', 'drivers'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomTrip> {
    const customTrip = await CustomTrip.findOne({
      where: { id },
      relations: ['buses', 'drivers'],
    });

    if (!customTrip) {
      throw new Error('Reserva no encontrada');
    }

    return customTrip;
  }

  async findByPaymentToken(paymentToken: string): Promise<CustomTrip> {
    const customTrip = await CustomTrip.findOne({
      where: { paymentToken },
      relations: ['buses', 'drivers'],
    });

    if (!customTrip) {
      throw new Error('Reserva no encontrada');
    }

    return customTrip;
  }

  async findByCustomerEmail(customerEmail: string): Promise<CustomTrip[]> {
    const customTrips = await CustomTrip.find({
      where: { customerEmail },
      relations: ['buses', 'drivers'],
      order: { createdAt: 'DESC' },
    });

    return customTrips;
  }

  async updateStatus(id: string, status: CustomTripStatus): Promise<CustomTrip> {
    const customTrip = await this.findOne(id);
    customTrip.status = status;
    await customTrip.save();
    return customTrip;
  }

  async markAsPaid(paymentToken: string): Promise<CustomTrip> {
    const customTrip = await this.findByPaymentToken(paymentToken);

    if (customTrip.status !== CustomTripStatus.PENDING_PAYMENT) {
      throw new Error('La reserva ya ha sido pagada o cancelada');
    }

    customTrip.status = CustomTripStatus.PAID;
    await customTrip.save();

    // Send payment confirmation email
    try {
      const formattedDateTime = new Date(customTrip.startDateTime).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Extract route information for email
      const routeInfo = customTrip.route?.map((stop) => ({
        name: stop.location.name,
        address: stop.location.address,
      }));

      await mailerService.sendPaymentConfirmationEmail(
        customTrip.customerEmail,
        customTrip.customerName,
        customTrip.name,
        customTrip.description,
        formattedDateTime,
        customTrip.price,
        customTrip.maxSeats,
        routeInfo,
        customTrip.paymentToken,
      );
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't throw error - payment was successful
    }

    return customTrip;
  }

  async remove(id: string): Promise<void> {
    const customTrip = await this.findOne(id);
    await customTrip.remove();
  }

  async update(id: string, updateCustomTripDto: CreateCustomTripDto): Promise<CustomTrip> {
    const customTrip = await this.findOne(id);

    // Only allow updates for trips in pending_payment status
    if (customTrip.status !== CustomTripStatus.PENDING_PAYMENT) {
      throw new Error('Solo se pueden actualizar reservas con estado de pago pendiente');
    }

    const {
      busIds, driverIds, maxSeats, ...tripData
    } = updateCustomTripDto;

    // Validate buses exist
    const buses = await Bus.findBy({ id: In(busIds) });
    if (buses.length !== busIds.length) {
      throw new Error('Uno o más vehículos no fueron encontrados');
    }

    // Calculate total capacity from buses
    const totalCapacity = buses.reduce((sum, bus) => {
      const busCapacity = Object.values(bus.totalSeats).reduce((total, seats) => total + seats, 0);
      return sum + busCapacity;
    }, 0);

    // Validate max seats doesn't exceed bus capacity
    if (maxSeats > totalCapacity) {
      throw new Error(`El número máximo de asientos (${maxSeats}) excede la capacidad de los vehículos (${totalCapacity})`);
    }

    // Validate drivers exist and are drivers
    const drivers = await User.findBy({
      id: In(driverIds),
      type: UserType.DRIVER,
    });
    if (drivers.length !== driverIds.length) {
      throw new Error('Uno o más conductores no fueron encontrados o no son conductores');
    }

    // Validate drivers >= buses
    if (driverIds.length < busIds.length) {
      throw new Error(`El número de conductores (${driverIds.length}) debe ser igual o mayor al número de vehículos (${busIds.length})`);
    }

    // Validate route stops timing
    if (tripData.route && tripData.route.length > 1) {
      for (let i = 1; i < tripData.route.length; i += 1) {
        const currentStop = tripData.route[i];
        const previousStops = tripData.route.slice(0, i);
        const minRequiredTime = previousStops.reduce(
          (total, prevStop) => (
            total + prevStop.timeOffsetMinutesArrival + prevStop.stopDurationMinutes
          ),
          0,
        );

        if (currentStop.timeOffsetMinutesArrival <= minRequiredTime) {
          throw new Error(`El tiempo de llegada de la parada ${i + 1} debe ser mayor a ${minRequiredTime} minutos`);
        }
      }
    }

    // Update custom trip
    Object.assign(customTrip, {
      ...tripData,
      maxSeats,
      startDateTime: new Date(tripData.startDateTime),
    });

    await customTrip.save();

    // Update relations
    customTrip.buses = buses;
    customTrip.drivers = drivers;
    await customTrip.save();

    return customTrip;
  }
}

export const customTripsService = new CustomTripsService();
