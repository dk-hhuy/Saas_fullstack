import { SignIn } from "@clerk/nextjs"

const Page = () => {
  return (
    <main className="flex flex-1 items-center justify-center py-12">
      <SignIn routing="hash" />
    </main>
  )
}

export default Page