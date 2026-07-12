import LoadingSpinner from "@/components/LoadingSpinner";

const DashboardLoading = () => {
  return (
    <main>
      <LoadingSpinner
        label="Loading page"
        description="Fetching your content…"
      />
    </main>
  );
};

export default DashboardLoading;
