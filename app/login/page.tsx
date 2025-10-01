import { SignIn } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default function LoginPage() {
  // Redirect to the proper sign-in route
  redirect('/sign-in')
}