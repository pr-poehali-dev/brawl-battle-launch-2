const AUTH_URL = "https://functions.poehali.dev/6cc53d8e-3165-4ebf-abad-94d904022207";
const PROFILE_URL = "https://functions.poehali.dev/fc3f8750-d79b-4eda-a611-4bf346df0271";
const SHOP_URL = "https://functions.poehali.dev/286c419d-8797-4372-a875-7ef1073251b2";

async function post(url: string, path: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Path": path },
    body: JSON.stringify({ ...body, _path: path }),
  });
  return res.json();
}

async function get(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, {
    headers: { "X-Path": "/profile" },
  });
  return res.json();
}

export const bbApi = {
  register: (username: string, password: string) =>
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, _path: "/register" }),
    }).then((r) => r.json()),

  login: (username: string, password: string) =>
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, _path: "/login" }),
    }).then((r) => r.json()),

  getProfile: (user_id: number) =>
    fetch(`${PROFILE_URL}?user_id=${user_id}&_path=/profile`).then((r) => r.json()),

  collectGift: (user_id: number, gift_type: "heart" | "letter") =>
    fetch(PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, gift_type, _path: "/collect-gift" }),
    }).then((r) => r.json()),

  dailyGift: (user_id: number) =>
    fetch(PROFILE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, _path: "/daily-gift" }),
    }).then((r) => r.json()),

  buyItem: (user_id: number, item_id: number) =>
    fetch(SHOP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, item_id, _path: "/buy" }),
    }).then((r) => r.json()),

  getHistory: (user_id: number) =>
    fetch(`${SHOP_URL}?user_id=${user_id}&_path=/history`).then((r) => r.json()),
};
