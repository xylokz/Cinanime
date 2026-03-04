"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Popcorn, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { auth } from "@/lib/firebase"
import { 
  createUserWithEmailAndPassword as createUser, 
  onAuthStateChanged, 
  updateProfile 
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"

// 1. Zod Schema with Password Match Validation
const signupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signupSchema>

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(true) // Prevents form flash
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
  })

  // 2. The Redirect Guard
  // Automatically sends the user home if they are already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/")
      } else {
        setIsRedirecting(false) // Only show the form if they are a guest
      }
    })
    return () => unsubscribe()
  }, [router])

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true)
      
      // Create user
      const userCredential = await createUser(auth, data.email, data.password)
      
      // Save their name to their profile
      await updateProfile(userCredential.user, {
        displayName: data.name
      })

      toast.success("Created account successfully")
      router.push("/")
    } catch (err: any) {
      setIsLoading(false)
      if (err.code === "auth/email-already-in-use") {
        toast.error("User already exists!")
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  // 3. Loading State for the Redirect Guard
  if (isRedirecting) {
    return (
      <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-zinc-500 animate-pulse font-medium">Securing session...</p>
      </div>
    )
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden flex-row-reverse bg-zinc-50 dark:bg-zinc-950">
      <Toaster position="top-center" />
      
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* RIGHT SIDE: Dynamic Movie Image */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" /> 
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop" 
          alt="Movie Theater"
          className="object-cover w-full h-full"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-white text-center w-full px-12">
          <Popcorn size={64} className="mx-auto mb-6 text-primary" />
          <h2 className="text-4xl font-bold mb-4">Join the Premiere</h2>
          <p className="text-zinc-300 text-lg">
            Create an account to save favorites, build your watchlist, and review movies.
          </p>
        </div>
      </div>

      {/* LEFT SIDE: The Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 relative">
        <motion.div 
          className="w-full max-w-md space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Start your cinematic journey today.
            </p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input 
                {...register("name")}
                className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                {...register("email")}
                className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                placeholder="m@example.com"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  {...register("password")}
                  type="password"
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm</label>
                <input 
                  {...register("confirmPassword")}
                  type="password"
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={isLoading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 mt-4"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </motion.button>
          </motion.form>

          <motion.p variants={itemVariants} className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}