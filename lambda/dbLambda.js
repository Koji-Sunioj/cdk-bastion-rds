const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { getSecret } = require("./utils/ssm.js");

exports.handler = async function (event, context) {
  const { httpMethod, resource, pathParameters, body, queryStringParameters } =
    event;
  const routeKey = `${httpMethod} ${resource}`;
  let statusCode = 200;
  let returnObject = {};
  const secret = await getSecret(process.env.DB_SECRET);
  returnObject.something = secret;

  try {
    switch (routeKey) {
      case "GET /posts":
        break;
      case "POST /posts":
        break;
      case "GET /posts/{postId}":
        break;
      case "DELETE /posts/{postId}":
        break;
      case "PATCH /posts/{postId}":
        break;
      default:
        statusCode = 404;
    }
  } catch (e) {
    statusCode = 400;
    returnObject = { message: e.message };
  }

  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnObject),
  };
};
