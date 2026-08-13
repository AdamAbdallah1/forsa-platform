import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const { default: handler } = await import("./send-profile-reminders.js");

const response = {
  statusCode: null,
  body: null,
};

const req = {
  method: "POST",
  body: {
    testEmail: "support.forsa@gmail.com",
  },
};

const res = {
  status(code) {
    response.statusCode = code;
    return this;
  },

  json(data) {
    response.body = data;
    return this;
  },
};

await handler(req, res);

console.log(JSON.stringify(response, null, 2));