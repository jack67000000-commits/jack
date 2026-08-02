import { notFound } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const localPreviewEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.WINKING_ADMIN_PREVIEW === "true";

  if (!localPreviewEnabled) {
    notFound();
  }

  return children;
}
