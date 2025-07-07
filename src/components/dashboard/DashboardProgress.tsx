import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardProgressProps {
  overallProgress: number;
  totalCourses?: number;
}

const DashboardProgress: React.FC<DashboardProgressProps> = ({ 
  overallProgress,
  totalCourses = 0
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-full -mr-20 -mt-20" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-foreground">{overallProgress}%</CardTitle>
            <CardDescription className="text-muted-foreground mt-1.5 text-base">总体学习进度</CardDescription>
          </div>
          <div className="p-3.5 bg-secondary rounded-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={overallProgress} className="h-3 mb-5" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">已加入 {totalCourses} 个课程</span>
          <Link to="/learning" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            查看全部 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardProgress; 