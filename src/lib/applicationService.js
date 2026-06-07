import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notificationService";

const toIso = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

const normalizeThread = (item) => {
  const data = item.data();

  return {
    id: item.id,
    ...data,
    createdAt: toIso(data.createdAt) || data.createdAt || new Date().toISOString(),
    updatedAt: toIso(data.updatedAt) || data.updatedAt || data.createdAt || new Date().toISOString(),
    conversation: (data.conversation || []).map((message) => ({
      ...message,
      createdAt: toIso(message.createdAt) || message.createdAt || new Date().toISOString(),
    })),
    statusHistory: (data.statusHistory || []).map((entry) => ({
      ...entry,
      createdAt: toIso(entry.createdAt) || entry.createdAt || new Date().toISOString(),
    })),
  };
};

export function listenUserThreads(account, onChange, onError) {
  if (!account?.uid) {
    onChange([]);
    return () => {};
  }

  const applicationsRef = collection(db, "applications");

  const q =
    account.accountType === "hiring"
      ? query(applicationsRef, where("ownerUid", "==", account.uid))
      : query(applicationsRef, where("seeker.uid", "==", account.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const threads = snapshot.docs
        .map(normalizeThread)
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );

      onChange(threads);
    },
    onError
  );
}

export async function createApplicationThread(threadData) {
  const docRef = await addDoc(collection(db, "applications"), {
    ...threadData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: threadData.status || "pending",
  });

  return {
    id: docRef.id,
    ...threadData,
    status: threadData.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function sendThreadReply(threadId, { message, lastMessage, thread }) {
  await updateDoc(doc(db, "applications", threadId), {
    lastMessage,
    updatedAt: serverTimestamp(),
    conversation: arrayUnion({
      ...message,
      createdAt: message.createdAt || new Date().toISOString(),
    }),
  });

  const senderEmail = message.email || message.fromEmail || "";
  const seekerEmail = thread?.seeker?.email || "";
  const ownerEmail = thread?.ownerEmail || "";

  const targetEmail =
    senderEmail === seekerEmail ? ownerEmail : seekerEmail;

  if (targetEmail && targetEmail !== senderEmail) {
    await createNotification({
      type: "new_message",
      title: "New message",
      text: `${message.from || "Someone"} sent you a message about ${thread?.title || "an application"}.`,
      targetEmail,
      actionUrl: "/messages",
      applicationId: threadId,
    });
  }
}

export async function updateThreadStatus(threadId, { status, by, systemMessage }) {
  await updateDoc(doc(db, "applications", threadId), {
    status,
    lastMessage: systemMessage.text,
    updatedAt: serverTimestamp(),
    conversation: arrayUnion({
      ...systemMessage,
      createdAt: systemMessage.createdAt || new Date().toISOString(),
    }),
    statusHistory: arrayUnion({
      status,
      by,
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function scheduleThreadInterview(threadId, { interview, by, systemMessage }) {
  await updateDoc(doc(db, "applications", threadId), {
    status: "interview",
    interview,
    lastMessage: systemMessage.text,
    updatedAt: serverTimestamp(),
    conversation: arrayUnion({
      ...systemMessage,
      createdAt: systemMessage.createdAt || new Date().toISOString(),
    }),
    statusHistory: arrayUnion({
      status: "interview",
      by,
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function deleteThreadFromFirestore(threadId) {
  await deleteDoc(doc(db, "applications", threadId));
}