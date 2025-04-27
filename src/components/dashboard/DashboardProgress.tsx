import React from 'react';
import { Activity } from 'lucide-react';
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-medium">总体完成度</CardTitle>
          <Activity className="h-5 w-5 text-connect-blue" />
        </div>
        <CardDescription>学习情况</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{overallProgress}%</span>
            <span className="text-sm text-muted-foreground">目标: 100%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>已加入课程: {totalCourses}个</span>
          <Link to="/learning">
            <Badge variant="outline" className="bg-connect-blue/10 text-connect-blue border-connect-blue/20 cursor-pointer">
              查看全部
            </Badge>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardProgress; 