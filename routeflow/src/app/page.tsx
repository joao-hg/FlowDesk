import { AppHeader } from "@/components/AppHeader";
import { RoutePlannerScreenLoader } from "@/components/RoutePlannerScreenLoader";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <RoutePlannerScreenLoader />
    </div>
  );
}
