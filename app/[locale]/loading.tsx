import LoadingSpinner from "@/components/LoadingSpinner";

const HomeLoading = () => {
  return (
    <main>
      <LoadingSpinner label="Loading home" description="Fetching your content…" />
    </main>
  );
};

export default HomeLoading;
