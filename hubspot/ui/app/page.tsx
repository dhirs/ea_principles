import { redirect } from "next/navigation";

// Companies is the CRM's landing tab. The Leads table used to live here at "/" and
// now sits at /leads, so this root route only forwards — old bookmarks to "/" and
// the header logo still land somewhere sensible.
export default function Home() {
  redirect("/companies");
}
