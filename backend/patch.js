const http = require("http");

const data = JSON.stringify({
  assistantId: "7c116dd7-282e-4edf-8b6a-cb0bcf735ef1",
  name: "Diagnostic",
  fields: [{key: "fullName"}, {key: "age"}]
});

const options = {
  hostname: "localhost",
  port: 4000,
  path: "/api/sync-webhook",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
