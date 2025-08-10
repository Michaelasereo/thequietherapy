"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Brain } from "lucide-react"
import { useActionState } from "react"
import { therapistLoginAction } from "@/actions/therapist-auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type LoginFormValues = z.infer<typeof formSchema>

export default function TherapistLoginPage() {
  const { toast } = useToast()
  const [state, formAction, isPending] = useActionState(therapistLoginAction, null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: LoginFormValues) {
    const fd = new FormData()
    fd.append("email", values.email)
    fd.append("password", values.password)
    formAction(fd)
  }

  if (state?.error) {
    toast({
      title: "Login Failed",
      description: state.error,
      variant: "destructive",
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-2">
            <Brain className="h-7 w-7 text-primary" />
            Trpi (Therapist)
          </Link>
          <CardTitle className="text-2xl">Therapist Login</CardTitle>
          <CardDescription>Access your professional dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={formAction} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="therapist@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <Link href="#" className="underline">
              Forgot Password?
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            New to Trpi?{" "}
            <Link href="/therapist/enroll" className="underline">
              Enroll Now
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
