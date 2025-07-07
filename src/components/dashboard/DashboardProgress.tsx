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
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full -mr-16 -mt-16" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{overallProgress}%</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">总体学习进度</CardDescription>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={overallProgress} className="h-3 mb-4" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">已加入 {totalCourses} 个课程</span>
          <Link to="/learning" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            查看全部 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardProgress; 