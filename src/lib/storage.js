export function getItem(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAccount() {
  return getItem("forsaAccount", null);
}

export function getProfile() {
  return getItem("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });
}

export function getPosts() {
  return getItem("forsaPosts", []);
}

export function setPosts(posts) {
  setItem("forsaPosts", posts);
}

export function getMessages() {
  return getItem("forsaMessages", []);
}

export function setMessages(messages) {
  setItem("forsaMessages", messages);
}

export function getNotifications() {
  return getItem("forsaNotifications", []);
}

export function setNotifications(notifications) {
  setItem("forsaNotifications", notifications);
}

export function getSavedJobs() {
  return getItem("forsaSavedJobs", []);
}

export function setSavedJobs(jobs) {
  setItem("forsaSavedJobs", jobs);
}