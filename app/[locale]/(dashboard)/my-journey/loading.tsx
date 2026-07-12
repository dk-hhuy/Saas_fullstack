import LoadingSpinner from "@/components/LoadingSpinner";

const MyJourneyLoading = () => {
  return (
    <main>
      <LoadingSpinner
        label="Loading My Journey"
        description="Fetching your progress…"
      />
    </main>
  );
};

export default MyJourneyLoading;
