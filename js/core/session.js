let currentUserId = null;

export function setCurrentUser(id) {
  currentUserId = id;
}

export function getCurrentUser() {
  return currentUserId;
}
