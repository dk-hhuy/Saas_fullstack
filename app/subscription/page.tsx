import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Subscription = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 mt-20 flex items-start justify-center min-h-screen">
      <PricingTable />
    </div>
  );
};

export default Subscription