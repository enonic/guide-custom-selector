const service = require('/services/countries/countries');

const appTypePrefix = app.name.replace(/\./g, '_') + '_';
const PERSON_DATA_TYPE = `${appTypePrefix}Person_Data`;
const COUNTRY_DETAILS_TYPE = `CountryDetails`;
const COUNTRY_DETAILS_FIELD = 'countryDetails';

exports.extensions = (graphQL) => {
    return {
        types: {
            [COUNTRY_DETAILS_TYPE]: {
                description: COUNTRY_DETAILS_TYPE,
                fields: {
                    country: {
                        type: graphQL.GraphQLString,
                    },
                    cities: {
                        type: graphQL.list(graphQL.GraphQLString),
                    }
                }
            }
        },
        creationCallbacks: {
            [PERSON_DATA_TYPE]: (params) => {
                params.addFields({
                    [COUNTRY_DETAILS_FIELD]: {
                        type: graphQL.reference(COUNTRY_DETAILS_TYPE),
                    },
                });
            }
        },
        resolvers: {
            [PERSON_DATA_TYPE]: {
                [COUNTRY_DETAILS_FIELD]: (env) => {
                    const countryName = env.source.country || '';

                    if (!countryName) {
                        return null;
                    }
                    return {
                        country: countryName,
                        cities: service.fetchCityList(countryName)
                    };
                }
            }
        },
    }
};
