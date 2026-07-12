import LoadingSpinner from "@/components/LoadingSpinner";

const CompanionsLoading = () => {
  return (
    <main>
      <LoadingSpinner
        label="Loading companions"
        description="Fetching your library…"
      />
    </main>
  );
};

export default CompanionsLoading;
