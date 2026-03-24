"use client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useUserStore } from "@/store/userStore"

const formSchema = z.object({
  identifier: z.string().min(5, "Min 5 characters").max(32),
  password: z.string().min(8, "Min 8 characters"),
})

export default function Login() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: "", password: "" },
  })
  const { setToken } = useUserStore()
  const router = useRouter()

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const res = await api.post("/auth/login", data)
      if (res.data.sucess) {
        setToken(res.data.jwtToken.accessToken || res.data.jwtToken)
        router.push("/")
      } else {
        console.error("Login failed:", res.data.message)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    }
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <div className="mb-3 flex items-center justify-center">
            <Image src="/assets/logo.webp" alt="Digital Socratic Logo" width={80} height={80} className="rounded-full object-cover" />
          </div>
          <div className="m-3">
            <h1 className="text-2xl font-bold">The Digital Socratic</h1>
            <span className="text-[10px] font-light">
              Continue your intellectual journey.
            </span>
          </div>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="identifier"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Username</FieldLabel>
                  <Input {...field} placeholder="Username" className="h-12" />
                  {fieldState.error && (
                    <span className="text-xs text-red-500">
                      {fieldState.error.message}
                    </span>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Password"
                    className="h-12"
                  />
                  {fieldState.error && (
                    <span className="text-xs text-red-500">
                      {fieldState.error.message}
                    </span>
                  )}
                </Field>
              )}
            />

            <Button
              className="h-12 w-full"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader className="h-full w-full animate-spin" />
              ) : (
                "Sign Up"
              )}
            </Button>
            <div className="w-full border" />
            <div className="w-full text-center flex justify-center gap-2">
             Don{"'"}t Have an Account<Link href={"/signup"} className=" text-blue-500">Login</Link>
            </div>
          </FieldGroup>
        </form>
      </Card>
    </main>
  )
}
