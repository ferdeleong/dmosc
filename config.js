require('dotenv').config();

const env = {
  development: process.env.NODE_ENV === "development",
  production: process.env.NODE_ENV === "production",
};
const applicationUrl = process.env.APPLICATION_URL;

module.exports = {
  env,
  applicationUrl
};