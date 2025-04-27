import { In } from 'typeorm';
import { Location } from './location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { cities } from './cities';

class LocationService {
  // Get all locations
  async getAllLocations(): Promise<Location[]> {
    return Location.find();
  }

  // Get location by ID
  async getLocationById(id: string): Promise<Location> {
    const location = await Location.findOneBy({ id });
    if (!location) {
      throw new Error('Ubicación no encontrada');
    }
    return location;
  }

  // Create new location
  async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
    const location = new Location();
    Object.assign(location, createLocationDto);

    await location.save();
    return location;
  }

  // Update existing location
  async updateLocation(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.getLocationById(id);

    Object.assign(location, updateLocationDto);

    await location.save();
    return location;
  }

  // Delete location
  async deleteLocation(id: string): Promise<void> {
    const location = await this.getLocationById(id);

    await location.softRemove();
  }

  // Initialize locations from cities data
  async initializeLocations(): Promise<void> {
    try {
      console.log('Initializing locations from cities data...');

      // Extract names from cities array
      const cityNames = cities.map((city) => city.name);

      // Find existing locations with these names
      const existingLocations = await Location.find({
        where: { name: In(cityNames) },
      });

      // Create a map of existing locations by name for quick lookup
      const existingLocationsByName = new Map<string, Location>();
      existingLocations.forEach((location) => {
        existingLocationsByName.set(location.name, location);
      });

      // Arrays to track changes
      const locationsToAdd = [];
      const locationsToUpdate = [];

      // Process cities using array methods instead of for loop
      cities.forEach((city) => {
        const existingLocation = existingLocationsByName.get(city.name);

        if (!existingLocation) {
          // New location - needs to be added
          console.log(`Adding new location: ${city.name}`);
          const newLocation = new Location();
          Object.assign(newLocation, {
            name: city.name,
            address: city.address,
            imageUrl: city.imageUrl,
            latitude: city.latitude,
            longitude: city.longitude,
            description: city.description,
          });

          locationsToAdd.push(newLocation);
        } else {
          // Location exists - check if needs update
          const needsUpdate = existingLocation.address !== city.address
            || existingLocation.imageUrl !== city.imageUrl
            || existingLocation.latitude !== city.latitude
            || existingLocation.longitude !== city.longitude
            || existingLocation.description !== city.description;

          if (needsUpdate) {
            console.log(`Updating location: ${city.name}`);
            Object.assign(existingLocation, {
              address: city.address,
              imageUrl: city.imageUrl,
              latitude: city.latitude,
              longitude: city.longitude,
              description: city.description,
            });

            locationsToUpdate.push(existingLocation);
          }
        }
      });

      // Save all new locations if any
      if (locationsToAdd.length > 0) {
        await Location.save(locationsToAdd);
        console.log(`Added ${locationsToAdd.length} new locations`);
      } else {
        console.log('All cities already exist in database');
      }

      // Save all updated locations if any
      if (locationsToUpdate.length > 0) {
        await Location.save(locationsToUpdate);
        console.log(`Updated ${locationsToUpdate.length} existing locations`);
      }
    } catch (error) {
      console.error('Error initializing locations:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
