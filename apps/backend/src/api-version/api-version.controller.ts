import { Request, Response, Router } from 'express';
import { ApiVersion } from './api-version.entity';

const apiVersionRouter = Router();

// Get all API versions
apiVersionRouter.get('/', async (req: Request, res: Response) => {
  try {
    const versions = await ApiVersion.find();
    return res.json(versions);
  } catch (error) {
    console.error('Error fetching API versions:', error);
    return res.status(500).json({ error: 'Failed to fetch API versions' });
  }
});

// Get API version by ID
apiVersionRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const version = await ApiVersion.findOneBy({ id: req.params.id });
    if (!version) {
      return res.status(404).json({ error: 'API version not found' });
    }
    return res.json(version);
  } catch (error) {
    console.error('Error fetching API version:', error);
    return res.status(500).json({ error: 'Failed to fetch API version' });
  }
});

// Create API version
apiVersionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { version, description } = req.body;
    const apiVersion = new ApiVersion();
    apiVersion.version = version;
    apiVersion.description = description;
    
    await apiVersion.save();
    return res.status(201).json(apiVersion);
  } catch (error) {
    console.error('Error creating API version:', error);
    return res.status(500).json({ error: 'Failed to create API version' });
  }
});

export default apiVersionRouter; 