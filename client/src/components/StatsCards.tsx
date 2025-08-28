import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, Play, Users, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                <div className="ml-3 sm:ml-4 space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      icon: Folder,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      icon: Play,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Advertisers",
      value: stats?.advertisers || 0,
      icon: Users,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Countries",
      value: stats?.countries || 0,
      icon: Globe,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm border border-slate-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 ${card.bgColor} rounded-lg`}>
                <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.iconColor}`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">{card.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
