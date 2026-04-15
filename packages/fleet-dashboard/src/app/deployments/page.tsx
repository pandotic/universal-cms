import { redirect } from "next/navigation";

export default function DeploymentsRedirect() {
  redirect("/fleet?tab=deployments");
}
