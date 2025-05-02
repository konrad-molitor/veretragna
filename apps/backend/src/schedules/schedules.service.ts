import { Schedule } from './schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Route } from '../routes/route.entity';

class ScheduleService {
  // Get all schedules
  async getAllSchedules(): Promise<Schedule[]> {
    return Schedule.find({
      relations: ['route'],
    });
  }

  // Get schedule by ID
  async getScheduleById(id: string): Promise<Schedule> {
    const schedule = await Schedule.findOne({
      where: { id },
      relations: ['route'],
    });

    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    return schedule;
  }

  // Create new schedule
  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const { routeId, ...scheduleData } = createScheduleDto;

    // Verify that route exists
    const route = await Route.findOneBy({ id: routeId });
    if (!route) {
      throw new Error('Ruta no encontrada');
    }

    const schedule = new Schedule();
    Object.assign(schedule, scheduleData);
    schedule.route = route;

    await schedule.save();
    return schedule;
  }

  // Update schedule
  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.getScheduleById(id);
    const { routeId, ...scheduleData } = updateScheduleDto;

    // If routeId is provided, verify that route exists
    if (routeId) {
      const route = await Route.findOneBy({ id: routeId });
      if (!route) {
        throw new Error('Ruta no encontrada');
      }
      schedule.route = route;
    }

    Object.assign(schedule, scheduleData);
    await schedule.save();
    return schedule;
  }

  // Delete schedule
  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getScheduleById(id);
    await schedule.softRemove();
  }

  // Get schedules by route
  async getSchedulesByRoute(routeId: string): Promise<Schedule[]> {
    return Schedule.find({
      where: {
        route: { id: routeId },
      },
      relations: ['route'],
    });
  }
}

export const scheduleService = new ScheduleService();
