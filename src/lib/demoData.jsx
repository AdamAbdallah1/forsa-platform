const now = () => new Date().toISOString();

const demoPosts = [
  {
    id: 910001,
    ownerEmail: "hello@cedarscoffee.lb",
    ownerName: "Cedars Coffee",
    company: "Cedars Coffee",
    title: "Part-time Barista for weekend shifts",
    location: "Beirut",
    type: "Part-time",
    pay: "$250/month + tips",
    contact: "hello@cedarscoffee.lb",
    description: "Looking for a friendly part-time barista for weekend shifts. Experience is helpful but not required. Must be punctual, clean, and comfortable dealing with customers.",
    tags: ["Barista", "Customer service", "Part-time", "Sales"],
    urgent: true,
    featured: true,
    status: "active",
    createdAt: now(),
    qualityScore: 95,
  },
  {
    id: 910002,
    ownerEmail: "jobs@pixelhouse.lb",
    ownerName: "Pixel House",
    company: "Pixel House",
    title: "Junior React Developer Internship",
    location: "Remote / Beirut",
    type: "Internship",
    pay: "Paid internship",
    contact: "jobs@pixelhouse.lb",
    description: "We need a motivated junior frontend developer to help build landing pages and dashboards. Good fit for students who know React, Tailwind, and basic UI structure.",
    tags: ["React", "JavaScript", "Frontend", "UI/UX"],
    urgent: false,
    featured: true,
    status: "active",
    createdAt: now(),
    qualityScore: 92,
  },
  {
    id: 910003,
    ownerEmail: "social@localbrand.lb",
    ownerName: "Local Brand",
    company: "Local Brand",
    title: "Social Media Content Creator",
    location: "Saida",
    type: "Freelance",
    pay: "$120/project",
    contact: "social@localbrand.lb",
    description: "Small local brand needs help creating Instagram reels, captions, and simple Canva posts for a new campaign. Portfolio or examples preferred.",
    tags: ["Content creation", "Canva", "Instagram", "Video editing", "Marketing"],
    urgent: false,
    featured: false,
    status: "active",
    createdAt: now(),
    qualityScore: 88,
  },
  {
    id: 910004,
    ownerEmail: "events@nightshift.lb",
    ownerName: "Night Shift Events",
    company: "Night Shift Events",
    title: "Event assistants needed this weekend",
    location: "Jounieh",
    type: "Project",
    pay: "$25/day",
    contact: "events@nightshift.lb",
    description: "We need energetic students to help with guest check-in, setup, and coordination for a weekend event. Must be available Friday and Saturday.",
    tags: ["Events", "Customer service", "Sales", "Part-time"],
    urgent: true,
    featured: false,
    status: "active",
    createdAt: now(),
    qualityScore: 84,
  },
];

export function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

export function loadDemoActivity(account, profile) {
  const currentPosts = safeJson("forsaPosts", []);
  const currentMessages = safeJson("forsaMessages", []);
  const currentNotifications = safeJson("forsaNotifications", []);

  const existingPostIds = new Set(currentPosts.map((post) => post.id));
  const postsToAdd = demoPosts.filter((post) => !existingPostIds.has(post.id));

  const seekerEmail = account?.email || "demo@forsa.lb";
  const seekerName = account?.name || "Demo User";
  const seekerCity = account?.city || "Lebanon";

  const demoApplication = {
    id: 920001,
    opportunityId: 910002,
    ownerEmail: "jobs@pixelhouse.lb",
    title: "Junior React Developer Internship",
    company: "Pixel House",
    createdAt: now(),
    updatedAt: now(),
    lastMessage: "Hi, I’m interested in this internship. I know React and Tailwind, and I’m available to start this month.",
    status: "shortlisted",
    cv: profile?.cv || {
      name: "demo_cv.pdf",
      size: 420000,
      type: "application/pdf",
      uploadedAt: now(),
    },
    seeker: {
      name: seekerName,
      email: seekerEmail,
      city: seekerCity,
      skills: profile?.skills?.length ? profile.skills : ["React", "Frontend", "UI/UX"],
      lookingFor: profile?.lookingFor?.length ? profile.lookingFor : ["Internship", "Remote"],
    },
    opportunity: {
      title: "Junior React Developer Internship",
      company: "Pixel House",
      location: "Remote / Beirut",
      type: "Internship",
      pay: "Paid internship",
      contact: "jobs@pixelhouse.lb",
    },
    conversation: [
      {
        id: 930001,
        from: seekerName,
        role: "seeker",
        text: "Hi, I’m interested in this internship. I know React and Tailwind, and I’m available to start this month.",
        createdAt: now(),
      },
      {
        id: 930002,
        from: "Pixel House",
        role: "hiring",
        text: "Thanks for applying. Your profile looks relevant, so we moved your application to shortlisted.",
        createdAt: now(),
      },
    ],
  };

  const hasDemoApplication = currentMessages.some((item) => item.id === demoApplication.id);

  const demoNotifications = [
    {
      id: 940001,
      type: "application_status",
      title: "Application shortlisted",
      text: "Your application for Junior React Developer Internship was marked as shortlisted.",
      targetEmail: seekerEmail,
      createdAt: now(),
      read: false,
    },
    {
      id: 940002,
      type: "new_opportunity",
      title: "New urgent opportunity",
      text: "Part-time Barista for weekend shifts was added in Beirut.",
      targetEmail: seekerEmail,
      createdAt: now(),
      read: false,
    },
  ];

  const existingNotificationIds = new Set(currentNotifications.map((item) => item.id));
  const notificationsToAdd = demoNotifications.filter((item) => !existingNotificationIds.has(item.id));

  localStorage.setItem("forsaPosts", JSON.stringify([...postsToAdd, ...currentPosts]));
  localStorage.setItem("forsaMessages", JSON.stringify(hasDemoApplication ? currentMessages : [demoApplication, ...currentMessages]));
  localStorage.setItem("forsaNotifications", JSON.stringify([...notificationsToAdd, ...currentNotifications]));

  return {
    postsAdded: postsToAdd.length,
    messagesAdded: hasDemoApplication ? 0 : 1,
    notificationsAdded: notificationsToAdd.length,
  };
}

export function clearDemoActivity() {
  const demoPostIds = new Set([910001, 910002, 910003, 910004]);
  const demoMessageIds = new Set([920001]);
  const demoNotificationIds = new Set([940001, 940002]);

  localStorage.setItem("forsaPosts", JSON.stringify(safeJson("forsaPosts", []).filter((post) => !demoPostIds.has(post.id))));
  localStorage.setItem("forsaMessages", JSON.stringify(safeJson("forsaMessages", []).filter((message) => !demoMessageIds.has(message.id))));
  localStorage.setItem("forsaNotifications", JSON.stringify(safeJson("forsaNotifications", []).filter((notification) => !demoNotificationIds.has(notification.id))));
}
