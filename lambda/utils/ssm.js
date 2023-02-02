const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const getSecret = async (secretId) => {
  const secretsManagerClient = new SecretsManagerClient({
    region: "eu-north-1",
  });
  const params = {
    SecretId: secretId,
  };
  const secretQuery = new GetSecretValueCommand(params);
  const { SecretString } = await secretsManagerClient.send(secretQuery);
  return JSON.parse(SecretString);
};

module.exports = { getSecret };
