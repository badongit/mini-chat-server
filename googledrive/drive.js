const { google } = require("googleapis");
const configuration = require("../configs/configuration");

const oAuth2Client = new google.auth.OAuth2(
  configuration.drive.CLIENT_ID,
  configuration.drive.CLIENT_SECRET,
  configuration.drive.REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: configuration.drive.REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: oAuth2Client,
});

module.exports = drive;
