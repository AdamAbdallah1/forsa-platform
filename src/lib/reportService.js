import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

export async function createReport(data) {
  const ref = await addDoc(collection(db, "reports"), {
    ...data,
    status: "open",
    createdAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...data,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

export async function getReports() {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      ...data,
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function updateReportStatus(id, status) {
  await updateDoc(doc(db, "reports", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}