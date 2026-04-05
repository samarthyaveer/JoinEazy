import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import ActivityFeed from "@/components/admin/ActivityFeed";
import BubbleLoader from "@/components/BubbleLoader";
import { getActivityFeed } from "@/services/api";

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getActivityFeed(25);
      const items = data.activity || data || [];
      const sorted = items
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivity(sorted);
    } catch (err) {
      setError(err.message || "Couldn't load activity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  if (isLoading) {
    return <BubbleLoader />;
  }

  return (
    <PageShell
      title="Recent activity"
      subtitle="Latest grading and submissions"
    >
      <ActivityFeed
        items={activity}
        isLoading={isLoading}
        error={error}
        onRetry={loadActivity}
      />
    </PageShell>
  );
}
