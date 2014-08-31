
/*
 * GET users listing.
 */

exports.index = function(req, res){
  res.render('admin', { title: 'Adminstration' });
};