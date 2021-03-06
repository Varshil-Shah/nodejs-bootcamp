const express = require('express');
const morgan = require('morgan');
// const helmet = require('helmet');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/app-error');
const globalErrorHandler = require('./controllers/error-controller');

const tourRouter = require('./routes/tour-router');
const userRouter = require('./routes/user-router');
const reviewRouter = require('./routes/review-router');
const viewRouter = require('./routes/view-router');

const app = express();

// serving views
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set secure http headers
// app.use(helmet());
// app.use(helmet.contentSecurityPolicy());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'difficulty',
      'maxGroupSize',
    ],
  })
);

// limit request from same API
const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1hr
  max: 100,
  message: 'Too many requests from this IP, please try again after an hour',
});

app.use('/api', limiter);

// cookie parser
app.use(cookieParser());

// body parser, reading data from body into req.body
// limiting amount of data comes in the body
app.use(express.json({ limit: '10kb' }));

// data sanitization again NOSQL query injection
app.use(mongoSanitize());

// data sanitization again cross-site scripting attacks (XSS)
app.use(xss());

// development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// GLOBAL ERRROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
