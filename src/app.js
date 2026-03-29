const express = require('express')
require('dotenv').config();
const session = require('express-session');
const adminRoute = require('./route/admin');
const categoriaRoute = require('./route/categoria');
const webappRoute = require('./route/webapp');
const apiRoute = require('./route/api');
const swaggerRoute = require('./route/swagger');
const path = require('path');

const app = express()
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
	name: 'gendago.admin.sid',
	secret: process.env.SESSION_SECRET || 'gendago-dev-session-secret-change-me',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 1000 * 60 * 60 * 8,
	},
}));

app.use((req, res, next) => {
	res.locals.currentAdmin = req.session.adminUser || null;
	res.locals.flashMessage = req.session.flashMessage || null;
	delete req.session.flashMessage;
	next();
});

app.get('/', (req, res) => {
	res.redirect('/admin');
});

app.use(adminRoute);
app.use(categoriaRoute);
app.use(webappRoute);
app.use(apiRoute);
app.use(swaggerRoute);

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Servidor Node.js ativo na porta ${port}`);
	});
}

module.exports = app;