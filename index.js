"use strict";

//const fs = require('fs');
const path = require('path');
//const https = require('https');
const express = require('express');
// for graceful shutdown.
const GracefulShutdownManager = require('@moebius/http-graceful-shutdown').GracefulShutdownManager;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// Passportがセッションに保存した認証情報を使うため、セッションを有効にする.
const session = require('express-session');
const bodyParser = require('body-parser');

const { routes } = require('./routes');

const app = express();
module.exports.express = app;

const User1 = {
  username: "user",
  password: "1234"
};

// 認証処理.
passport.use(new LocalStrategy(
  {
    passReqToCallback: true, // true にすると、検証用コールバックの第一引数で request が取得できる.
    session: false,
  },
  (request, username, password, done) => {
    // 検証用コールバック.
    // ここに認証処理を記載する.
    if (username !== User1.username) {
      return done(null, false);
    }
    if (password !== User1.password) {
      return done(null, false);
    }
    //return done(null, username); // const username = request.user;
    return done(null, { username: username }); // const { username } = request.user;
  }
));

app.use(bodyParser.urlencoded({ limit: '5mb', extended: true, }));
app.use(bodyParser.json({ limit: '10mb', }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: false, }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// for https.
// let webServer = https.createServer({
//   key: fs.readFileSync('server-key.pem'),
//   cert: fs.readFileSync('server-crt.pem'),
//   maxVersion: 'TLSv1.3',
//   minVersion: 'TLSv1',
// }, app)
// .listen(8443, () => {
//   console.log(`http://localhost:8443/ start`);
// });
let webServer = app.listen(8080, () => {
  console.log(`http://localhost:8080/ start`);
});

if (process.platform === "win32") {
  console.log('windows platform');
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.on("SIGINT", () => {
    console.log('SIGINT (readline)');
    process.emit("SIGINT");
  });
}

const shutdownManager = new GracefulShutdownManager(webServer);
process.on('SIGINT', () => {
  console.log('SIGINT');
  shutdownManager.terminate(() => {
    console.log('Server is gracefully terminated.');
    process.exit();
  });
});

/**
 * 認証済みかどうかを判定する.
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
 function isAuthenticated(request, response, next) {
  if (request.isAuthenticated()) {
    // 認証済みの場合の処理.
    return next();
  }

  // 認証していない場合の処理.
  response.redirect('/');
}

/**
 * ログイン.
 */
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/',
    session: true,
  }),
  (request, response) => {
    const { username } = request.user;
    response.redirect('/enter-page');
  }
);

/**
 * ログアウト.
 */
app.get('/logout', (request, response) => {
  request.logout();
  response.redirect('/');
});

/**
 * ログインページ.
 */
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'views/login-form.html'));
});

/**
 * ログイン後ページ.
 */
app.get('/enter-page', isAuthenticated, routes.get.enterPage);
