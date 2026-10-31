# IRIS Backend Development Runbook

## One shared environment file

The repository-root `.env` supplies settings for local service processes. It is
ignored by Git so local values and secrets are not committed. To recreate it on
another machine, copy `.env.example` to `.env` and update the values. The
example secrets are for local development only.

Install Node.js 20.6 or newer and MongoDB locally, and make sure MongoDB is
running on `127.0.0.1:27017` (or update `MONGO_PORT` and each service's
`*_MONGO_URI` in `.env`). No Docker commands are used to start the backend
services.

## Start services individually

From a terminal in the backend repository root, start an individual service
with its npm script:

```text
npm run start:user-service
npm run start:notification-service
npm run start:auth-service
npm run start:invoice-service
npm run start:api-gateway
```

To start all services together, run `npm run start:all`. It starts the Node.js
processes and leaves them running in that terminal; press Ctrl+C to stop them.
Each service uses its own local MongoDB database from the shared `.env`.
The gateway is available at `http://localhost:4000`; service health endpoints
use ports `4001` through `4004`.

The services log directly to the terminal. Configure SMTP in `.env` and set
`EMAIL_ENABLED=true` if email delivery is needed.
