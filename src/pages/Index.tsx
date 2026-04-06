import DashboardHeader from "@/components/DashboardHeader";
import CognitiveMetrics from "@/components/CognitiveMetrics";
import LearningStateIndicator from "@/components/LearningStateIndicator";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import AdaptiveContentFeed from "@/components/AdaptiveContentFeed";
import SessionAnalytics from "@/components/SessionAnalytics";
import CognitiveProfile from "@/components/CognitiveProfile";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader />
        <div className="space-y-5 pb-10">
          <LearningStateIndicator />
          <CognitiveMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <SessionAnalytics />
              <KnowledgeGraph />
            </div>
            <div className="space-y-5">
              <CognitiveProfile />
              <AdaptiveContentFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
