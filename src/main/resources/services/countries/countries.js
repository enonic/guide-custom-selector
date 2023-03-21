const httpClient = require('/lib/http-client');
const cacheLib = require('/lib/cache');

const CACHE = cacheLib.newCache({ size: 1, expire: 3600 });
const CACHE_KEY = 'COUNTRIES_API_RESPONSE';
const API_URL = "https://countriesnow.space/api/v0.1/countries/iso";

exports.get = function (request) {
    const query = request.params.query;
    const cacheData = CACHE.getIfPresent(CACHE_KEY);
    let status, data, error;
 
    if(cacheData) {
        status = 200;
        data = processApiResponse(cacheData, query);
    } else {
        try {
            status = 200;
            data = processApiResponse(requestApiData(), query);
        } catch(err) {
            status = 500;
            error = err.toString();
        }
    }
   
    let body;
    if (status === 200) body = JSON.stringify(data);
    if (status === 500) body = JSON.stringify({ error });
    
    return { status, body, contentType: 'application/json' };
}

function requestApiData() {
    const response = httpClient.request({
        url: API_URL,
        method: 'GET',
        contentType: 'application/json'
    });

    if(response.body.error) throw new Error('Error calling countriesnow API.');

    const responseBody = JSON.parse(response.body);

    CACHE.put(CACHE_KEY, responseBody);

    return responseBody;
}

function processApiResponse(responseBody, query = '') {
    let countries = [];
    responseBody.data.forEach((d) => countries = countries.concat(d.name));

    const hits = countries
        .filter(country => query ? country.toLowerCase().indexOf(query.toLowerCase()) > -1 : true)
        .map(country => ({ id: country, displayName: country, description: ' ' }));

    return { hits, count: hits.length, total: hits.length };
}

