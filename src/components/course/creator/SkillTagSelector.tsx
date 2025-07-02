import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

// 6个技能维度定义
export const SKILL_TYPES = [
  {
    key: 'communication',
    label: '沟通协调',
    description: '有效表达想法、倾听他人、协调团队沟通',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  {
    key: 'collaboration',
    label: '团体合作',
    description: '团队协作、分工合作、共同完成任务',
    color: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  {
    key: 'critical_thinking',
    label: '批判思考',
    description: '分析问题、逻辑推理、批判性评估',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  },
  {
    key: 'creativity',
    label: '创新能力',
    description: '创意思维、创新解决方案、原创性思考',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
  },
  {
    key: 'cultural_intelligence',
    label: '文化智力',
    description: '跨文化理解、多元化思维、全球视野',
    color: 'bg-pink-100 text-pink-800 hover:bg-pink-200'
  },
  {
    key: 'complex_problem_solving',
    label: '复杂问题解决',
    description: '系统性思维、复杂问题分析、综合解决方案',
    color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
  }
] as const;

export type SkillType = typeof SKILL_TYPES[number]['key'];

interface SkillTagSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  label?: string;
  description?: string;
  maxSelections?: number;
}

const SkillTagSelector: React.FC<SkillTagSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
  label = "技能标签",
  description = "选择此内容主要培养的技能维度",
  maxSelections
}) => {
  const handleSkillToggle = (skillKey: string) => {
    if (selectedSkills.includes(skillKey)) {
      // 移除技能
      onSkillsChange(selectedSkills.filter(skill => skill !== skillKey));
    } else {
      // 添加技能（检查最大选择数量）
      if (maxSelections && selectedSkills.length >= maxSelections) {
        return; // 达到最大选择数量，不添加
      }
      onSkillsChange([...selectedSkills, skillKey]);
    }
  };

  const handleRemoveSkill = (skillKey: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillKey));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">{label}</Label>
        {description && (
          <p className="text-xs text-gray-500 mb-3">{description}</p>
        )}
        {maxSelections && (
          <p className="text-xs text-gray-400 mb-3">
            最多可选择 {maxSelections} 个技能 ({selectedSkills.length}/{maxSelections})
          </p>
        )}
      </div>

      {/* 已选择的技能标签 */}
      {selectedSkills.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">已选择的技能：</Label>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skillKey => {
              const skill = SKILL_TYPES.find(s => s.key === skillKey);
              if (!skill) return null;
              
              return (
                <Badge
                  key={skillKey}
                  variant="secondary"
                  className={`${skill.color} flex items-center gap-1 px-3 py-1`}
                >
                  {skill.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveSkill(skillKey)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* 可选择的技能列表 */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">可选择的技能：</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SKILL_TYPES.map(skill => {
            const isSelected = selectedSkills.includes(skill.key);
            const isDisabled = maxSelections && !isSelected && selectedSkills.length >= maxSelections;
            
            return (
              <Button
                key={skill.key}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`
                  justify-start text-left h-auto p-3 
                  ${isSelected ? skill.color : 'hover:bg-gray-50'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isDisabled && handleSkillToggle(skill.key)}
                disabled={isDisabled}
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">{skill.label}</div>
                  <div className="text-xs opacity-75 line-clamp-2">
                    {skill.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillTagSelector;
