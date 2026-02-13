distributed-booking-system/
├── src/
│   ├── config/
│   │   ├── redis.js
│   │   ├── database.js
│   │   └── queue.js
│   ├── controllers/
│   │   └── bookingController.js
│   ├── services/
│   │   ├── lockService.js
│   │   ├── bookingService.js
│   │   └── seatService.js
│   ├── models/
│   │   └── prisma/
│   ├── routes/
│   │   ├── v1/
│   │   └── index.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── validator.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── queues/
│   │   └── unlockSeatQueue.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── constants.js
│   │   └── errors.js
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js