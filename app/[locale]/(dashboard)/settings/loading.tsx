import LoadingSpinner from "@/components/LoadingSpinner";

const SettingsLoading = () => {
  return (
    <main>
      <LoadingSpinner
        label="Loading settings"
        description="Fetching your preferences…"
      />
    </main>
  );
};

export default SettingsLoading;
