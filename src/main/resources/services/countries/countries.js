const httpClient = require('/lib/http-client');
const cacheLib = require('/lib/cache');

const CACHE = cacheLib.newCache({ size: 1, expire: 3600 });
const CACHE_KEY = 'COUNTRIES_API_RESPONSE';
const API_BASE_URL = "https://countriesnow.space/api/v0.1/countries";
const API_COUNTRIES_URL = `${API_BASE_URL}/iso`;
const API_CITIES_URL = `${API_BASE_URL}/cities/q`;

exports.get = function (request) {
    const query = request.params.query;
    let status = 200, data, error;

    try {
        data = processApiResponse(fetchCountryList(), query);
    } catch(err) {
        status = 500;
        error = err.toString();
    }

    const body = JSON.stringify(status === 200 ? data : { error });

    return {
        status,
        body,
        contentType: 'application/json'
    };
}

const fetchCountryList = () => {
    const cacheData = CACHE.getIfPresent(CACHE_KEY);
    if (cacheData) {
        return cacheData;
    }

    const response = httpClient.request({
        url: API_COUNTRIES_URL,
        method: 'GET',
        contentType: 'application/json'
    });

    if (response.body.error) {
        throw new Error('Error calling countriesnow API.');
    }

    const responseBody = JSON.parse(response.body);

    CACHE.put(CACHE_KEY, responseBody);

    return responseBody;
}

exports.fetchCityList = (countryName) => {
    const CITY_CACHE_KEY = `${CACHE_KEY}_${countryName.toUpperCase()}`;
    const cacheData = CACHE.getIfPresent(CITY_CACHE_KEY);
    if (cacheData) {
        return cacheData;
    }

    const response = httpClient.request({
        url: API_CITIES_URL,
        method: 'GET',
        contentType: 'application/json',
        queryParams: { country: countryName }
    });

    if (response.body.error){
        throw new Error('Error calling countriesnow API.');
    }

    const responseBody = JSON.parse(response.body);

    CACHE.put(CITY_CACHE_KEY, responseBody.data);

    return responseBody.data;

}

const processApiResponse = (responseBody, query = '') => {
    let countries = [];
    responseBody.data.forEach((d) => countries = countries.concat(d.name));

    const hits = countries
        .filter(country => query ? country.toLowerCase().indexOf(query.toLowerCase()) > -1 : true)
        .map(country => ({ id: country, displayName: country, description: ' ' }));

    return { hits, count: hits.length, total: hits.length };
}

