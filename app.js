const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { engine } = require("express-handlebars");
const { parseAuthCookie } = require("./services/auth");

// ROUTERS IMPORT
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const competitonsRouter = require('./routes/competitions');

// APP INIT
const app = express();

// VIEW ENGINE SETUP
app.engine('handlebars', engine({
  partialsDir: path.join(__dirname, '/views/partials')
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// MIDDLEWARE SETUP
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(parseAuthCookie);

// ROUTERS SETUP
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/competitions', competitonsRouter);

// 404 > ERROR HANDLER
app.use(function (req, res, next) {
  next(createError(404));
});

// ERRORHANDLER
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.status === 404) {
    res.locals.message = "Tražena stranica ne postoji";
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
