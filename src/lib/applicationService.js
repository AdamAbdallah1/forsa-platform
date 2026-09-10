import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
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

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  return value;
};

const normalizeThread = (item) => {
  const data = item.data();

  return {
    id: item.id,
    ...data,

    createdAt:
      toIso(data.createdAt) ||
      data.createdAt ||
      new Date().toISOString(),

    updatedAt:
      toIso(data.updatedAt) ||
      data.updatedAt ||
      data.createdAt ||
      new Date().toISOString(),

    conversation: (data.conversation || []).map((message) => ({
      ...message,
      createdAt:
        toIso(message.createdAt) ||
        message.createdAt ||
        new Date().toISOString(),
    })),

    statusHistory: (data.statusHistory || []).map((entry) => ({
      ...entry,
      createdAt:
        toIso(entry.createdAt) ||
        entry.createdAt ||
        new Date().toISOString(),
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
      ? query(
          applicationsRef,
          where("ownerUid", "==", account.uid)
        )
      : query(
          applicationsRef,
          where("seeker.uid", "==", account.uid)
        );

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
};

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

const EXTERNAL_TRACKING_STATUSES = [
  "applied",
  "waiting",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

const findExistingExternalApplication = async ({ userUid, postId }) => {
  const q = query(
    collection(db, "applications"),
    where("seeker.uid", "==", userUid),
    where("opportunityId", "==", postId),
    where("applicationMethod", "==", "external"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  return snapshot.empty ? null : normalizeThread(snapshot.docs[0]);
};

export async function createExternalApplication(post, account) {
  const postId = post?.id;
  const userUid = account?.uid;

  if (!postId || !userUid) {
    throw new Error(
      "External application requires a post and a signed-in seeker."
    );
  }

  const existing = await findExistingExternalApplication({
    userUid,
    postId,
  });

  if (existing) {
    return {
      ...existing,
      appliedAt: toIso(existing.appliedAt) || existing.appliedAt,
    };
  }

  const externalType =
    post.externalApplicationType === "email" ? "email" : "url";

  const now = new Date().toISOString();

  const payload = {
    applicationMethod: "external",
    externalApplicationType: externalType,
    trackingStatus: "applied",
    status: "pending",

    opportunityId: postId,
    title: post.title || "",
    company: post.company || "",

    opportunity: {
      title: post.title || "",
      company: post.company || "",
      location: post.location || null,
      type: post.type || null,
      pay: post.pay || null,
      contact: post.contact || null,
    },

    seeker: {
      uid: userUid,
      email: account.email || "",
      name: account.name || "",
      username: account.username || "",
      usernameLower: account.usernameLower || "",
      city: account.city || "",
      lastSeen: now,
    },

    lastMessage:
      externalType === "email"
        ? "Application initiated through the company email."
        : "Application initiated through the external application link.",

    appliedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (externalType === "email") {
    const email = String(post.applicationEmail || "").trim();

    if (email) {
      payload.applicationEmail = email;
    }
  } else {
    const url = String(post.applicationUrl || "").trim();

    if (url) {
      payload.applicationUrl = url;
    }
  }

  const docRef = await addDoc(collection(db, "applications"), payload);

  return {
    id: docRef.id,
    ...payload,
    appliedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateExternalTrackingStatus(
  applicationId,
  trackingStatus
) {
  if (!applicationId) {
    throw new Error(
      "Application id is required to update the tracking status."
    );
  }

  if (!EXTERNAL_TRACKING_STATUSES.includes(trackingStatus)) {
    throw new Error(
      `Invalid external tracking status: ${trackingStatus}`
    );
  }

  await updateDoc(doc(db, "applications", applicationId), {
    trackingStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function sendThreadReply(
  threadId,
  { message, lastMessage, thread }
) {
  await updateDoc(doc(db, "applications", threadId), {
    lastMessage,

    updatedAt: serverTimestamp(),

    conversation: arrayUnion({
      ...message,
      createdAt:
        message.createdAt || new Date().toISOString(),
    }),
  });

  const senderEmail =
    message.email ||
    message.fromEmail ||
    "";

  const seekerEmail =
    thread?.seeker?.email || "";

  const ownerEmail =
    thread?.ownerEmail || "";

  const targetEmail =
    senderEmail === seekerEmail
      ? ownerEmail
      : seekerEmail;

  if (
    targetEmail &&
    targetEmail !== senderEmail
  ) {
    await createNotification({
      type: "new_message",
      title: "New message",
      text: `${message.from || "Someone"} sent you a message about ${
        thread?.title || "an application"
      }.`,
      targetEmail,
      actionUrl: "/messages",
      applicationId: threadId,
    });
  }
}

export async function updateThreadStatus(
  threadId,
  { status, by, systemMessage }
) {
  const updates = {
    status,
    lastMessage: systemMessage.text,
    updatedAt: serverTimestamp(),

    conversation: arrayUnion({
      ...systemMessage,
      createdAt:
        systemMessage.createdAt ||
        new Date().toISOString(),
    }),

    statusHistory: arrayUnion({
      status,
      by,
      createdAt: new Date().toISOString(),
    }),
  };

  if (status === "rejected" || status === "accepted") {
    updates.interview = deleteField();
  }

  await updateDoc(
    doc(db, "applications", threadId),
    updates
  );
}

export async function scheduleThreadInterview(
  threadId,
  { interview, by, systemMessage }
) {
  await updateDoc(doc(db, "applications", threadId), {
    status: "interview",

    interview,

    lastMessage: systemMessage.text,

    updatedAt: serverTimestamp(),

    conversation: arrayUnion({
      ...systemMessage,
      createdAt:
        systemMessage.createdAt ||
        new Date().toISOString(),
    }),

    statusHistory: arrayUnion({
      status: "interview",
      by,
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function cancelThreadInterview(
  threadId,
  { by, systemMessage, status = "pending" }
) {
  await updateDoc(doc(db, "applications", threadId), {
    status,
    interview: deleteField(),
    lastMessage: systemMessage.text,
    updatedAt: serverTimestamp(),

    conversation: arrayUnion({
      ...systemMessage,
      createdAt:
        systemMessage.createdAt ||
        new Date().toISOString(),
    }),

    statusHistory: arrayUnion({
      status,
      by,
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function deleteThreadFromFirestore(
  threadId
) {
  await deleteDoc(
    doc(db, "applications", threadId)
  );
}