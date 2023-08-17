const path = require('path');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

/* 
  [CHALLENGES API]

- Implement restriction that users can only review a tour that they have actually booked;

- Implement nested booking routes: /tours/:id/bookings and /users/:id/bookings;

- Improve tour dates: add a participants and soldOut field to each date. A date then becomes an instance of the tour. Then, when a user boooks, they need to select one of the dates. A new booking will increase the number of participants in the date, until it is booked out(participants > maxGroupSize). So when a user wants to book, you need to check if tour on the selected date is still available;

- Implement advanced authentication features: confirm user email, keep users logged in with refresh tokens, two-factor authentication, etc.

  [CHALLENGES WEBSITE]

- Implement a sign up form, similar to login form;

- On the tour detail page, if a user has taken a tour, allow them add a review directly on the website. Implement a form for this.

- Hide the entire booking section on the detail page if current user has already booked the tour(also prevent duplicate bookings on the model);

- Implement "like tour" functionality, with fav tour page;

- On the user account page, implement the "My Reviews" page, wehere all reviews are displayed, and a user can edit them. (If you know REACT, this would be an amazing way to use the Natours API and train your skills!);

- For administrators, implement all the "Manage" pages, where they can CRUD tours, users, reviews and bookings.
*/

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set security HTTP headers

app.use(cors());
app.options('*', cors());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'unsafe-inline',
          'data',
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
          'https://checkout.stripe.com',
        ],
        frameSrc: [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          'https://js.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://localhost:*/',
        ],
        objectSrc: ["'none'"],
        styleSrc: [
          "'self'",
          'https:',
          "'unsafe-inline'",
          'https://api.mapbox.com/',
          'https://api.tiles.mapbox.com/',
          'https://fonts.googleapis.com/',
          'https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*',
          'https://checkout.stripe.com',
        ],
        workerSrc: [
          "'self'",
          'unsafe-inline',
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.tiles.mapbox.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com/v3/',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

// console.log(process.env.NODE_ENV);
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP: Allow 100 requests from the same IP in one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// express.json() is the middleware. middleware is a function than can modify the incoming request, respond data
// data from the body is added to request object, we use app.use in order to add this function to the middleware stack
// 'req' have all the information about the request that was done however Express does not put that body data on the 'req'.
// so inorder to have that data available, we have to use middleware -> app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Further HELMET configuration for Security Policy (CSP)
// app.use(helmet());

// Test middlewares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies)
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cannot find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Cannot find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
  // next함수가 인자를 받으면 그게 무엇이든지 express는 error가 생성된 것으로 인식한다.
  // 그리고 다른 모든 후속 middleware를 skip하고 global error handling middleware로 인자를 보낸다.
});

app.use(globalErrorHandler);

module.exports = app;
