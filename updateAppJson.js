const fs = require('fs');
let appJson = JSON.parse(fs.readFileSync('app.json', 'utf-8'));

if (appJson.expo && appJson.expo.android) {
  appJson.expo.android.googleServicesFile = "./google-services.json";
}

fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2), 'utf-8');
console.log("app.json updated with googleServicesFile");
