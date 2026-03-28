const express = require('express');

const venusApi = require('../service/venusApi');

const router = express.Router();

function extractError(error) {
	if (error.response?.data?.detail) {
		return error.response.data.detail;
	}

	if (error.detail) {
		return error.detail;
	}

	return error.response?.data || error.message || 'Nao foi possivel consultar categorias.';
}

router.get('/api/categorias', async (req, res) => {
	try {
		const categorias = await venusApi.getCategorias();
		return res.json(categorias);
	} catch (error) {
		return res.status(error.statusCode || error.response?.status || 500).json({
			message: 'Nao foi possivel consultar categorias.',
			detail: extractError(error),
		});
	}
});

router.get('/api/categorias/:id', async (req, res) => {
	try {
		const categoria = await venusApi.getCategoriaById(req.params.id);
		return res.json(categoria);
	} catch (error) {
		return res.status(error.statusCode || error.response?.status || 500).json({
			message: 'Nao foi possivel consultar a categoria.',
			detail: extractError(error),
		});
	}
});

module.exports = router;