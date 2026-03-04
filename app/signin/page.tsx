"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Film, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle" 
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { auth, GAP } from "@/lib/firebase"

// 1. Zod Schema for validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(true) // New state to prevent form flash
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // 2. THE REDIRECT LOGIC
  // This checks if the user is already logged in as soon as the page loads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/") // Use replace so they can't go "back" to login
      } else {
        setIsRedirecting(false) // No user? Stop loading and show the form
      }
    })
    return () => unsubscribe()
  }, [router])

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, data.email, data.password)
      toast.success("Logged in successfully")
      router.push("/")
    } catch (err: any) {
      setIsLoading(false)
      switch (err.code) {
        case "auth/invalid-credential":
          toast.error("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          toast.info("Too many attempts. Please wait.");
          break;
        case "auth/network-request-failed":
          toast.error("Check your internet connection.");
          break;
        default:
          toast.error("Something went wrong.");
      }
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await signInWithPopup(auth, GAP)
      router.push("/")
    } catch (err: any) {
      setIsLoading(false)
      toast.error("Google sign-in failed")
    }
  }

  // 3. SHOW LOADER WHILE CHECKING AUTH
  if (isRedirecting) {
    return (
      <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-zinc-500 animate-pulse">Checking session...</p>
      </div>
    )
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="flex overflow-hidden min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      <Toaster position="top-center" />
      <div className="absolute top-4 right-14 z-50">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE: Image */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop" 
          alt="Cinema"
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-12 left-12 z-20 text-white">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Film size={36} className="text-primary" /> MovieVault
          </h1>
          <p className="text-zinc-300 max-w-md">
            Welcome back. Your personalized movie recommendations are waiting.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12">
        <motion.div 
          className="w-full max-w-md space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Please enter your details to sign in.
            </p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                {...register("email")}
                className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                placeholder="m@example.com"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <input 
                {...register("password")}
                type="password"
                className="flex h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:border-zinc-800 transition-all"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <motion.button 
              type="submit" 
              disabled={isLoading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </motion.button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-300 dark:border-zinc-800"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-50 dark:bg-zinc-950 px-2 text-zinc-500">Or continue with</span></div>
            </div>

            <motion.button 
              type="button"
              onClick={handleGoogleSignIn} 
              disabled={isLoading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in with Google"}
            </motion.button>
          </motion.form>

          <motion.p variants={itemVariants} className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50">
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}