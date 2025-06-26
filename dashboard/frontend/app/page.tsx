import AuthGuard from "../components/AuthGuard";
import DatasetsDashboard from "../components/DatasetsDashboard";

export default function Page() {
  return (
    <AuthGuard>
      <DatasetsDashboard />
    </AuthGuard>
  );
}
