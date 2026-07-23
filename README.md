# Cost Manager – RESTful Web Services

Final project for the *Asynchronous Server-Side Development* course.
The system is built as **four independent microservices** (four separate processes),
each with its own `package.json`, that share a single MongoDB Atlas database.

| Service | Folder | Local port | Endpoints |
|---------|--------|-----------|-----------|
| Logs (admin) | `a-logs-service` | 3000 | `GET /api/logs` |
| Users | `b-users-service` | 3001 | `POST /api/add`, `GET /api/users`, `GET /api/users/:id` |
| Costs | `c-costs-service` | 3002 | `POST /api/add`, `GET /api/report` |
| About (admin) | `d-about-service` | 3003 | `GET /api/about` |

## Technologies
Node.js, Express.js, Mongoose, Pino (logging to MongoDB), MongoDB Atlas.
Written in JavaScript (no TypeScript). Unit tests with Jest + Supertest.

## Installation and running (locally)

1. Clone the repository.
2. Make sure Node.js (>= 20.19) and npm are installed.
3. Install dependencies for each service:
   ```
   cd a-logs-service  && npm install && cd ..
   cd b-users-service && npm install && cd ..
   cd c-costs-service && npm install && cd ..
   cd d-about-service && npm install && cd ..
   ```
4. Create a `.env` file in each service folder (see `.env.example`) with:
   ```
   MONGODB_URI=<your MongoDB Atlas connection string>
   DB_NAME=cost_manager
   PORT=<3000 / 3001 / 3002 / 3003>
   ```
5. Start each service in its own terminal:
   ```
   cd a-logs-service  && npm start
   cd b-users-service && npm start
   cd c-costs-service && npm start
   cd d-about-service && npm start
   ```

## Running the tests
Each service has its own test suite (the database is mocked, so no connection is needed):
```
cd <service-folder> && npm test
```

## Design notes
* The monthly report implements the **Computed design pattern**: a report for a month
  that has already ended is computed once and cached in the `reports` collection.
* The `sum` field uses the BSON `Double` type, as required.
* Every error response is a JSON document containing at least `id` and `message`.
