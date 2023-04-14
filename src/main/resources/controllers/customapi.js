const httpClient = require('/lib/http-client');
const guillotineLib = require('/lib/guillotine');
const graphQlLib = require('/lib/graphql');

const API_URL = "https://countriesnow.space/api/v0.1/countries/cities/q";

const context = guillotineLib.createContext();

context.types.countryDetails = context.schemaGenerator.createObjectType({
    name: 'CountryDetails',
    fields: {
        country: {
            type: graphQlLib.GraphQLString,
        },
        cities: {
            type: graphQlLib.list(graphQlLib.GraphQLString),
        }
    }
});

context.options.creationCallbacks = {
    'com_example_myproject_Person_Data': (ctx, params) => {
        params.fields.countryDetails = {
            type: context.types.countryDetails,
            resolve: (env) => {
                const countryName = env.source.country || '';

                if (!countryName) {
                    return {};
                }

                return {
                    country: countryName,
                    cities: requestApiData(countryName)
                }
            }
        };
    },
};

const schema = createSchema();

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const result = graphQlLib.execute(schema, body.query, body.variables);
    return {
        contentType: 'application/json',
        body: JSON.stringify(result)
    };
};

//

function createSchema() {
    return context.schemaGenerator.createSchema({
        query: createRootQueryType(context),
        dictionary: context.dictionary
    });
}

function createRootQueryType(context) {
    return context.schemaGenerator.createObjectType({
        name: 'Query',
        fields: {
            guillotine: {
                type: guillotineLib.createHeadlessCmsType(context),
                resolve: function () {
                    return {};
                }
            }
        }
    });
}

//

function requestApiData(countryName = '') {
    const response = httpClient.request({
        url: API_URL,
        method: 'GET',
        contentType: 'application/json',
        queryParams: { country: countryName }
    });

    if (response.body.error) throw new Error('Error calling countriesnow API.');

    return JSON.parse(response.body).data;
}
