// app/routes.js
module.exports = function(app) {
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.twig', {
		});
	});	
};

