import React from 'react';
import { Cpu } from 'lucide-react';
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
    purple: "bg-connect-purple/10 text-connect-purple hover:bg-connect-purple/20",
    blue: "bg-connect-blue/10 text-connect-blue hover:bg-connect-blue/20",
    amber: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
    green: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
    red: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
  };

  return `${colorMap[color] || colorMap.blue} border-0`;
};

const AcquiredSkills: React.FC<AcquiredSkillsProps> = ({ skillsAcquired }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-medium">获得的技能</CardTitle>
          <Cpu className="h-5 w-5 text-connect-blue" />
        </div>
        <CardDescription>最近掌握的能力</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skillsAcquired.length > 0 ? (
            skillsAcquired.map((skill, index) => (
              <Badge 
                key={index} 
                className={getSkillBadgeClass(skill.color)}
              >
                {skill.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-500">继续学习以获得更多技能</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcquiredSkills; 