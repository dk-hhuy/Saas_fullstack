import DashboardSidebar from "./DashboardSidebar";
import MobileNav from "./MobileNav";
import OnboardingWizard from "./OnboardingWizard";

const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />
      <div className="dashboard-content">{children}</div>
      <MobileNav />
      <OnboardingWizard />
    </div>
  );
};

export default DashboardShell;
