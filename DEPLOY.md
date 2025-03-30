# Deployment Guide for Fly.io

This guide explains how to deploy the application to Fly.io.

## Free Tier Resources

Fly.io offers the following free resources (Legacy Free allowances):
- Up to 3 shared-cpu-1x 256MB VMs
- 3GB total persistent volume storage
- Outbound data transfer:
  - 100 GB from North America & Europe
  - 30 GB from Asia Pacific, Oceania & South America
  - 30 GB from Africa & India

Our application is configured to fit within these free tier limits.

## Prerequisites

1. Create a Fly.io account at https://fly.io/
2. Install Flyctl CLI: https://fly.io/docs/hands-on/install-flyctl/
3. Log in to Fly.io:
   ```bash
   flyctl auth login
   ```

## Manual Deployment

To deploy manually:

1. Launch the app (first time only):
   ```bash
   flyctl launch
   ```
   Note: This will create a fly.toml file. You can skip this step if the file already exists.

2. Deploy the application:
   ```bash
   flyctl deploy
   ```

## GitHub Actions Deployment

The repository is set up with GitHub Actions to automatically deploy to Fly.io when pushing to the main branch.

### Setting up the GitHub Action

1. Generate a Fly.io API token:
   ```bash
   flyctl auth token
   ```

2. Add this token as a secret in your GitHub repository:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Create a new repository secret named `FLY_API_TOKEN` with the token value

3. Push to the main branch to trigger the deployment.

## Configuration

The application is configured to:
- Build both frontend and backend in a single Docker image
- Serve the frontend static files from the backend Express server
- Use CORS to allow API requests from the frontend
- Run within the free tier limits (256MB memory)

## Cost Optimization

Our application is optimized to use Fly.io's free tier:
- VM is configured with 256MB memory (free tier limit)
- `min_machines_running = 0` allows machines to be stopped when not in use
- `auto_stop_machines = true` ensures unused machines are automatically stopped
- `auto_start_machines = true` ensures machines start when receiving traffic
- Node.js memory usage is limited in production with `NODE_OPTIONS`

## Database Setup

Make sure your database is configured correctly in Fly.io. You can create a database using:

```bash
flyctl postgres create
```

Note: Fly Postgres is not included in the free tier. Consider using:
- External database provider with a free tier
- A minimal Fly Postgres configuration if usage is low

Then attach it to your application:

```bash
flyctl postgres attach <database-name>
```

## Environment Variables

Configure your environment variables in the Fly.io dashboard or using the CLI:

```bash
flyctl secrets set KEY=VALUE
```

Important variables to set:
- DATABASE_URL: Your database connection string
- NODE_ENV: Set to "production"

## Monitoring

Monitor your application using:

```bash
flyctl status
flyctl logs
```

Monitor your resource usage and billing in the Fly.io dashboard to ensure you stay within free tier limits.

## Scaling

To scale your application:

```bash
flyctl scale count <number-of-instances>
```

## Troubleshooting

- Check logs: `flyctl logs`
- SSH into the VM: `flyctl ssh console` 