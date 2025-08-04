import { SignIn } from "@clerk/nextjs"

const Page = () => {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <SignIn routing="hash" />
    </main>
  )
}

export default Page