import { redirect } from "next/navigation";

// Bills now live as a tab on /live, next to the run they start.
export default function Bills() {
  redirect("/live");
}
