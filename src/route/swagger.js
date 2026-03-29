const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

function loadOpenApiDocument() {
	const filePath = path.join(__dirname, '../../docs/openapi-baseline.json');
	const raw = fs.readFileSync(filePath, 'utf8');
	const document = JSON.parse(raw);

	if (!Array.isArray(document.servers)) {
		document.servers = [];
	}

	if (!document.servers.some((server) => server && server.url === '/')) {
		document.servers.unshift({
			url: '/',
			description: 'Node local backend',
		});
	}

	return document;
}

router.get('/swagger.json', (req, res) => {
	try {
		return res.json(loadOpenApiDocument());
	} catch (error) {
		return res.status(500).json({
			message: 'Nao foi possivel carregar o OpenAPI baseline.',
		});
	}
});

router.use('/swagger', swaggerUi.serve, (req, res, next) => {
	try {
		const openApiDocument = loadOpenApiDocument();
		return swaggerUi.setup(openApiDocument, {
			explorer: true,
		})(req, res, next);
	} catch (error) {
		return res.status(500).send('Nao foi possivel carregar o Swagger.');
	}
});

module.exports = router;