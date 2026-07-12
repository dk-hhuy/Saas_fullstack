import { SignUp } from "@clerk/nextjs";

const Page = () => {
  return (
    <main className="flex flex-1 items-center justify-center py-12">
      <SignUp routing="hash" />
    </main>
  );
};

export default Page; 