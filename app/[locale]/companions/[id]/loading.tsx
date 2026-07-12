const SessionLoading = () => {
  return (
    <main className="animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="h-9 w-72 rounded-lg bg-muted" />
        <div className="h-5 w-48 rounded-lg bg-muted" />
      </div>
      <div className="mt-8 h-[60vh] rounded-3xl bg-muted" />
    </main>
  );
};

export default SessionLoading;
