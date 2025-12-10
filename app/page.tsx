import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!userRole) {
    return redirect("/login");
  }

  switch (userRole.role) {
    case "petugas":
      return redirect("/petugas");
    case "admin_node":
      return redirect("/node-admin");
    case "admin_pusat":
      return redirect("/super-admin");
    default:
      return redirect("/login");
  }
}
