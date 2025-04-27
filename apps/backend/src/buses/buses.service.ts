import { Bus } from './bus.entity';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

class BusService {
  // Get all buses
  async getAllBuses(): Promise<Bus[]> {
    return Bus.find();
  }

  // Get bus by ID
  async getBusById(id: string): Promise<Bus> {
    const bus = await Bus.findOneBy({ id });
    if (!bus) {
      throw new Error('Autobús no encontrado');
    }
    return bus;
  }

  // Create new bus
  async createBus(createBusDto: CreateBusDto): Promise<Bus> {
    const bus = new Bus();
    Object.assign(bus, createBusDto);

    await bus.save();
    return bus;
  }

  // Update existing bus
  async updateBus(id: string, updateBusDto: UpdateBusDto): Promise<Bus> {
    const bus = await this.getBusById(id);

    Object.assign(bus, updateBusDto);

    await bus.save();
    return bus;
  }

  // Delete bus
  async deleteBus(id: string): Promise<void> {
    const bus = await this.getBusById(id);
    await bus.remove();
  }
}

export const busService = new BusService(); 