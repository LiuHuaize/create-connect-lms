import React from 'react';
import { Award } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Skill {
  name: string;
  color: string;
}

interface AcquiredSkillsProps {
  skillsAcquired: Skill[];
}

const getSkillBadgeClass = (color: string) => {
  const colorMap: Record<string, string> = {
    purple: "bg-primary/10 text-primary hover:bg-primary/20",
    blue: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
    amber: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
    green: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
    red: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
  };

  return `${colorMap[color] || colorMap.blue} border-0 font-medium`;
};

const AcquiredSkills: React.FC<AcquiredSkillsProps> = ({ skillsAcquired }) => {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">获得的技能</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">最近掌握的能力</CardDescription>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Award className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap gap-2">
          {skillsAcquired.length > 0 ? (
            skillsAcquired.map((skill, index) => (
              <Badge 
                key={index} 
                className={getSkillBadgeClass(skill.color)}
                variant="secondary"
              >
                {skill.name}
              </Badge>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">继续学习以获得更多技能</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcquiredSkills; 