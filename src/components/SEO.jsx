import { useEffect } from "react";

const siteName = "Forsa";

const defaults = {
  title: "Forsa — Find work. Hire talent. Without chaos.",
  description:
    "Forsa helps students, freelancers, creators, and businesses in Lebanon find work, hire talent, and manage applications without chaos.",
};

function setMeta(name, content, attr = "name") {
  if (!content) return;

  let tag = document.querySelector(`meta[${attr}="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export default function SEO({ title, description, image, url }) {
  useEffect(() => {
    const finalTitle = title ? `${siteName} — ${title}` : defaults.title;
    const finalDescription = description || defaults.description;
    const finalImage = image || "https://forsa.digital/og-image.png";
    const finalUrl = url || window.location.href;

    document.title = finalTitle;

    setMeta("description", finalDescription);
    setMeta("robots", "index, follow");

    setMeta("og:title", finalTitle, "property");
    setMeta("og:description", finalDescription, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", finalUrl, "property");
    setMeta("og:image", finalImage, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", finalTitle);
    setMeta("twitter:description", finalDescription);
    setMeta("twitter:image", finalImage);
  }, [title, description, image, url]);

  return null;
}