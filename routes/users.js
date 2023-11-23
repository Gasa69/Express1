var express = require('express');
var router = express.Router();

router.get('/signin', function(req, res, next) {
  res.render('users/signin');
});

module.exports = router;
