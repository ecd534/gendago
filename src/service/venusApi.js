const axios = require('axios');

const venusApi = axios.create({
    baseURL: process.env.VENUS_API_URL || 'http://127.0.0.1:8000',
    timeout: 10000,
    headers: {
        Accept: 'application/json',
    },
});

function getAuthHeaders() {
    const token = process.env.VENUS_API_TOKEN;

    if (!token) {
        return {};
    }

    const headerName = process.env.VENUS_API_AUTH_HEADER || 'Authorization';
    const tokenPrefix = process.env.VENUS_API_TOKEN_PREFIX || 'Bearer';

    return {
        [headerName]: tokenPrefix ? `${tokenPrefix} ${token}` : token,
    };
}

async function getCategorias() {
    const endpoint = process.env.VENUS_CATEGORIAS_PATH || '/categorias';
    const response = await venusApi.get(endpoint, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

async function getCategoriaById(id) {
    const endpoint = process.env.VENUS_CATEGORIA_BY_ID_PATH || '/categorias';
    const response = await venusApi.get(`${endpoint}/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
}

module.exports = {
    getCategorias,
    getCategoriaById,
};