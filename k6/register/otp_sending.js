import http from "k6/http";

export const options = {
  vus: 2,
  iterations: 2,
};

export default function () {
  const url = "http://localhost:3001/api/v1/user-service/register/otp-sending";

  const payload = JSON.stringify({
    user_email: "",
    user_phone: "",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  console.log(`VU ${__VU} - Status: ${res.status}`);
  console.log(`Response: ${res.body}`);
}