export function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function getAccount() {
  return safeJson("forsaAccount", null);
}

export function getUsers() {
  return safeJson("forsaUsers", []);
}

export function setSession(account) {
  localStorage.setItem("forsaAccount", JSON.stringify(account));
}

export function saveUser(user) {
  const users = getUsers();
  const exists = users.some((item) => item.email === user.email);

  const updated = exists
    ? users.map((item) => (item.email === user.email ? user : item))
    : [user, ...users];

  localStorage.setItem("forsaUsers", JSON.stringify(updated));
  setSession(user);
}

export function findUser(email, password) {
  return getUsers().find(
    (user) => user.email === email && user.password === password
  );
}

export function logout() {
  localStorage.removeItem("forsaAccount");
}