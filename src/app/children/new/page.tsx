import { redirect } from "next/navigation";

export default function LegacyAddChildRedirect() {
  redirect("/portfolios/new");
}
