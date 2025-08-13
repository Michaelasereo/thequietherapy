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
import { useActionState } from "react"
import { therapistMagicLinkAction } from "@/actions/therapist-auth"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
})

type LoginFormValues = z.infer<typeof formSchema>

export default function TherapistLoginPage() {
  const { toast } = useToast()
  const [state, formAction, isPending] = useActionState(therapistMagicLinkAction, null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: LoginFormValues) {
    const fd = new FormData()
    fd.append("email", values.email)
    formAction(fd)
  }

  if (state?.error) {
    toast({
      title: "Login Failed",
      description: state.error,
      variant: "destructive",
    })
  }

  if (state?.success) {
    toast({
      title: "Magic Link Sent!",
      description: state.success,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Therapist Login</CardTitle>
          <CardDescription>Enter your email to receive a secure login link.</CardDescription>
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>We'll send you a secure link to access your dashboard.</p>
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
