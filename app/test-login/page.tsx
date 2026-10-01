import { redirect } from "next/navigation";

export default function TestLoginPage() {
  redirect("/auth?login=username&next=%2F");
}
