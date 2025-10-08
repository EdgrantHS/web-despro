import { redirect } from "next/navigation";

export default async function Home() {
  // Selalu arahkan root ke halaman login
  redirect("/login");
}
