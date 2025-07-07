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
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    amber: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    red: "bg-rose-100 text-rose-700 hover:bg-rose-200"
  };

  return `${colorMap[color] || colorMap.blue} border-0 font-medium`;
};

const AcquiredSkills: React.FC<AcquiredSkillsProps> = ({ skillsAcquired }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">获得的技能</CardTitle>
            <CardDescription className="text-muted-foreground mt-1.5">最近掌握的能力</CardDescription>
          </div>
          <div className="p-3 bg-amber-100 rounded-2xl">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex flex-wrap gap-2.5">
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