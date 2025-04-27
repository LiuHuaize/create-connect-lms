import { useMemo } from 'react';

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  category?: string;
}

interface Skill {
  name: string;
  color: string;
}

// 预设技能列表
const PREDEFINED_SKILLS: Record<string, Skill> = {
  'product': { name: '产品原型设计', color: 'blue' },
  'business': { name: '市场分析', color: 'purple' },
  'management': { name: '项目管理', color: 'amber' },
  'teamwork': { name: '团队协作', color: 'green' },
  'ux': { name: '用户体验', color: 'red' },
  'game_design': { name: '游戏设计', color: 'purple' },
  'coding': { name: '编程', color: 'blue' }
};

// 将课程分类映射到技能
const CATEGORY_TO_SKILL: Record<string, string[]> = {
  'business': ['business', 'management'],
  'design': ['ux', 'product'],
  'development': ['coding', 'product'],
  'product': ['product', 'ux', 'management'],
  'game': ['game_design', 'product'],
  'management': ['management', 'teamwork']
};

// 默认技能，当没有分类匹配时使用
const DEFAULT_SKILLS = ['teamwork'];

export function useUserProgress(enrolledCourses: EnrolledCourse[] = []) {
  // 计算总体完成进度
  const overallProgress = useMemo(() => {
    if (enrolledCourses.length === 0) return 0;
    
    const totalProgress = enrolledCourses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(totalProgress / enrolledCourses.length);
  }, [enrolledCourses]);

  // 基于完成程度超过50%的课程计算获得的技能
  const skillsAcquired = useMemo(() => {
    if (enrolledCourses.length === 0) {
      return Object.values(PREDEFINED_SKILLS).slice(0, 3); // 返回默认的3个技能
    }
    
    const skillsMap = new Map<string, Skill>();
    
    // 对于进度超过50%的课程，添加相关技能
    enrolledCourses
      .filter(course => course.progress >= 50)
      .forEach(course => {
        const category = course.category || 'product';
        const skillKeys = CATEGORY_TO_SKILL[category] || DEFAULT_SKILLS;
        
        skillKeys.forEach(key => {
          if (PREDEFINED_SKILLS[key] && !skillsMap.has(key)) {
            skillsMap.set(key, PREDEFINED_SKILLS[key]);
          }
        });
      });
    
    // 如果没有完成超过50%的课程，返回默认技能
    if (skillsMap.size === 0) {
      return Object.values(PREDEFINED_SKILLS).slice(0, 3);
    }
    
    return Array.from(skillsMap.values());
  }, [enrolledCourses]);

  return {
    overallProgress,
    skillsAcquired
  };
}

export default useUserProgress; 