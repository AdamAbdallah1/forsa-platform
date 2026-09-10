import { useEffect } from "react";

const siteName = "Forsa";

const defaults = {
  title: "Forsa — Find work. Hire talent. Without chaos.",
  description:
    "Forsa is a Lebanese career community connecting students, early-career talent, and ambitious professionals with companies, opportunities, and people across Lebanon.",
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
    const finalTitle = title || defaults.title;
    const finalDescription = description || defaults.description;
    const finalImage = image || "https://forsa.digital/og-image.png";
    const finalUrl = url || window.location.href;
    let canonical = document.querySelector('link[rel="canonical"]');

if (!canonical) {
  canonical = document.createElement("link");
  canonical.setAttribute("rel", "canonical");
  document.head.appendChild(canonical);
}

canonical.setAttribute("href", finalUrl);

    document.title = finalTitle;

    setMeta("description", finalDescription);

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