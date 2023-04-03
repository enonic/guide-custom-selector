var guillotineLib = require('/lib/guillotine');
var graphQlLib = require('/lib/graphql');
const context = guillotineLib.createContext();
var schema = guillotineLib.createSchema();

context.types.googleBookType = context.schemaGenerator.createObjectType({
    name: 'GoogleBook',
    fields: {
        id: {
            type: graphQlLib.GraphQLString,
        },
        title: {
            type: graphQlLib.GraphQLString,
        },
        authors: {
            type: graphQlLib.list(graphQlLib.GraphQLString),
        }
    }
});

context.options.creationCallbacks = {
    'com_enonic_app_myapp_GoogleBooksSelector_Data': (context, params) => {
        params.fields.googleBooks = {
            type: graphQlLib.list(context.types.googleBookType),
            resolve: (env) => {
                const bookIds = env.source['googleBooks'];
                const books = [];
                (bookIds || []).forEach(bookId => {
                    books.push(fetchBookById(bookId)) // make request to Google Books API
                });
                return books;
            }
        };
    },
};


function createSchema() {
    const context = guillotineLib.createContext();

    // create and register custom object types if needed

    return context.schemaGenerator.createSchema({
        query: createRootQueryType(context),
        dictionary: context.dictionary,
    });
}


exports.post = function (req) {
    var body = JSON.parse(req.body);
    var result = JSON.stringify(graphQlLib.execute(schema, body.query, body.variables));
    return {
        contentType: 'application/json',
        body: JSON.stringify(result)
    };
};
   