import { openDB } from "./idb.js";
import { hashPIN } from "./pin.js";

export async function getUsers() {
  const db = await openDB();
  const tx = db.transaction("users", "readonly");
  const req = tx.objectStore("users").getAll();

  return new Promise(res => {
    req.onsuccess = () => res(req.result);
  });
}

export async function createUser(name, pin) {
  const db = await openDB();
  const user = {
    id: crypto.randomUUID(),
    name,
    pinHash: await hashPIN(pin)
  };

  const tx = db.transaction("users", "readwrite");
  tx.objectStore("users").put(user);
  return user;
}

export async function checkUserPIN(userId, pin) {
  const db = await openDB();
  const tx = db.transaction("users", "readonly");
  const req = tx.objectStore("users").get(userId);

  return new Promise(async res => {
    req.onsuccess = async () => {
      const ok =
        req.result &&
        req.result.pinHash === await hashPIN(pin);
      res(ok);
    };
  });
}
