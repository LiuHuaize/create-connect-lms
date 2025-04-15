import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { sendMessageToAI, formatMessages } from '@/services/aiService';
import GlobalStyle from './GlobalStyle';
import FloatingChatButton from './FloatingChatButton';
import { ChatMessage } from './AIChatBox';

// 导入拆分出的组件
import CourseStages, { courseStages } from './course-components/CourseStages';
import CharacterAnalysis, { Character, CharacterTraits } from './course-components/CharacterAnalysis';
import ProductCanvas from './course-components/ProductCanvas';
import FlowChart from './course-components/FlowChart';
import WebsiteCreation from './course-components/WebsiteCreation';
import { characters } from './course-components/characterData';

interface XiyoujiCourseProps {
  onBack: () => void;
}

// 定义CourseHeader组件
interface CourseHeaderProps {
  onBack: () => void;
  progress: number;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ onBack, progress }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-indigo-800">西游记课程</h1>
          <p className="text-xs text-gray-500">中国古典名著学习</p>
        </div>
      </div>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500">课程进度</span>
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

const XiyoujiCourse: React.FC<XiyoujiCourseProps> = ({ onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [aiResponses, setAiResponses] = useState<ChatMessage[]>([
    { 
      role: 'ai' as 'ai', 
      content: `你好！我是${selectedCharacter.name}的分析助手。

你的任务是：
1. 阅读右侧的相关故事，思考这些故事揭示了${selectedCharacter.name}哪些性格特点
2. 与我讨论你发现的特点，我会帮你分析它们是优点还是缺点
3. 我会总结讨论结果并显示在"人物特点"页面
4. 你需要为每个角色至少找出一个优点和一个缺点才能进入下一阶段

请告诉我，从故事中你发现了${selectedCharacter.name}哪些性格特点？` 
    }
  ]);
  const [showNeeds, setShowNeeds] = useState(false);
  const [characterNeeds, setCharacterNeeds] = useState<string[]>([]);
  
  // 添加课程阶段状态
  const [currentStage, setCurrentStage] = useState(0);
  
  // 产品创意相关状态
  const [productIdeas, setProductIdeas] = useState<string[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [productCanvas, setProductCanvas] = useState({
    title: '',
    problem: '',
    solution: '',
    uniqueValue: '',
    userGroups: '',
    keyFeatures: ''
  });
  
  // 添加字符分析状态跟踪
  const [analyzedCharacters, setAnalyzedCharacters] = useState<{[key: string]: boolean}>({
    tangseng: false,
    wukong: false,
    bajie: false,
    wujing: false
  });
  
  // 添加每个角色的自定义特质
  const [characterTraits, setCharacterTraits] = useState<CharacterTraits>({
    tangseng: { strengths: [], weaknesses: [] },
    wukong: { strengths: [], weaknesses: [] },
    bajie: { strengths: [], weaknesses: [] },
    wujing: { strengths: [], weaknesses: [] }
  });
  
  // 添加用户状态
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  
  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
  }, []);
  
  // 统计已完成分析的角色数量
  const getAnalyzedCount = () => {
    return Object.values(analyzedCharacters).filter(Boolean).length;
  };
  
  // 检查角色是否有足够的特质
  const hasEnoughTraits = (characterId: string) => {
    return (
      characterTraits[characterId]?.strengths.length > 0 && 
      characterTraits[characterId]?.weaknesses.length > 0
    );
  };
  
  // 保存人物分析结果
  const saveCharacterAnalysis = async (characterId: string, characterName: string) => {
    try {
      // 检查是否有优缺点
      if (!hasEnoughTraits(characterId)) {
        toast({
          title: "分析不完整",
          description: `请至少添加一个优点和一个缺点。`,
          variant: "destructive"
        });
        return;
      }
      
      // 更新前端状态
      setAnalyzedCharacters(prev => ({
        ...prev,
        [characterId]: true
      }));
      
      // 保存到数据库
      if (user) {
        await supabase
          .from('character_analysis')
          .upsert({
            user_id: user.id,
            character_id: characterId,
            strengths: characterTraits[characterId].strengths,
            weaknesses: characterTraits[characterId].weaknesses,
            created_at: new Date().toISOString()
          });
      }
      
      // 显示成功消息
      toast({
        title: "分析已保存",
        description: `${characterName}的分析已成功保存。`,
        variant: "success"
      });
      
      // 计算并更新进度
      updateProgress();
      
    } catch (error) {
      console.error("保存人物分析失败:", error);
      toast({
        title: "保存失败",
        description: "无法保存人物分析，请稍后再试。",
        variant: "destructive"
      });
    }
  };
  
  // 更新课程进度
  const updateProgress = () => {
    let percentage = 0;
    
    // 根据当前阶段计算基础进度
    percentage = (currentStage / courseStages.length) * 100;
    
    // 如果在人物分析阶段，根据已分析角色数添加进度
    if (currentStage === 0) {
      const analyzedCount = getAnalyzedCount();
      const characterPercentage = (analyzedCount / characters.length) * (100 / courseStages.length);
      percentage = characterPercentage;
    }
    
    // 如果在产品画布阶段，根据已填写字段计算进度
    if (currentStage === 1) {
      const filledFields = Object.values(productCanvas).filter(v => v.trim() !== '').length;
      const canvasProgress = (filledFields / Object.keys(productCanvas).length) * 0.5;
      percentage = 25 + (canvasProgress * 25); // 25% 是第一阶段的进度
    }
    
    // 更新进度
    setProgress(percentage);
  };
  
  // 当组件状态变化时更新进度
  useEffect(() => {
    updateProgress();
  }, [currentStage, analyzedCharacters, productCanvas]);
  
  // 加载保存的聊天记录
  useEffect(() => {
    const fetchCharacterChats = async () => {
      if (!user) return;
      
      try {
        // 获取当前角色的聊天记录
        const { data, error } = await supabase
          .from('character_chats')
          .select('messages')
          .eq('user_id', user.id)
          .eq('character_id', selectedCharacter.id)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 是 "no rows found" 错误
            console.error("获取聊天记录失败:", error);
          }
          // 如果没有找到记录，使用默认的欢迎消息
          return;
        }
        
        if (data?.messages) {
          setAiResponses(data.messages);
        }
        
      } catch (error) {
        console.error("加载聊天记录失败:", error);
      }
    };
    
    // 获取角色的分析状态和特质
    const fetchCharacterAnalysis = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('character_analysis')
          .select('character_id, strengths, weaknesses')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("获取角色分析失败:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // 更新已分析状态
          const analyzed = { ...analyzedCharacters };
          
          // 更新特质
          const traits = { ...characterTraits };
          
          data.forEach(item => {
            analyzed[item.character_id] = true;
            traits[item.character_id] = {
              strengths: item.strengths || [],
              weaknesses: item.weaknesses || []
            };
          });
          
          setAnalyzedCharacters(analyzed);
          setCharacterTraits(traits);
        }
        
      } catch (error) {
        console.error("加载角色分析失败:", error);
      }
    };
    
    fetchCharacterChats();
    fetchCharacterAnalysis();
  }, [user, selectedCharacter.id]);
  
  // 从故事中分析特质的函数
  const analyzeStoryForTraits = (storyText: string, characterName: string) => {
    // 如果AI分析指出了某些特质，可以自动将其添加到特质列表中
    const aiMessage = `从故事"${storyText}"中，我们可以看出${characterName}具有以下特质:`;
    
    setTimeout(() => {
      setAiResponses(prev => [
        ...prev,
        { role: 'ai', content: aiMessage }
      ]);
    }, 1000);
  };
  
  // 页面导航
  const handlePageChange = (index: number) => {
    if (index > currentStage) return; // 不允许跳过
    setCurrentStage(index);
  };
  
  const handlePrevStage = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    } else {
      // 如果已经是第一阶段，返回上一个页面
      onBack();
    }
  };
  
  const handleNextStage = () => {
    // 检查当前阶段是否完成
    if (currentStage === 0 && getAnalyzedCount() < characters.length) {
      toast({
        title: "无法继续",
        description: "请先完成所有角色的分析。",
        variant: "destructive"
      });
      return;
    }
    
    // 如果当前阶段已完成，进入下一阶段
    if (currentStage < courseStages.length - 1) {
      // 保存当前阶段的进度
      if (currentStage === 0) {
        // 如果是第一阶段，设置第一个角色的需求
        setCharacterNeeds(selectedCharacter.needs);
        setShowNeeds(true);
      }
      
      setCurrentStage(currentStage + 1);
    }
  };
  
  const handleSelectCharacter = (character: Character) => {
    // 保存当前聊天记录
    saveCharacterChat(selectedCharacter.id, aiResponses);
    
    // 更改选定的角色
    setSelectedCharacter(character);
    
    // 设置初始AI回应
    const initialMessage = { 
      role: 'ai' as 'ai', 
      content: `你好！我是${character.name}的分析助手。

你的任务是：
1. 阅读右侧的相关故事，思考这些故事揭示了${character.name}哪些性格特点
2. 与我讨论你发现的特点，我会帮你分析它们是优点还是缺点
3. 我会总结讨论结果并显示在"人物特点"页面
4. 你需要为每个角色至少找出一个优点和一个缺点才能进入下一阶段

请告诉我，从故事中你发现了${character.name}哪些性格特点？` 
    };
    
    setAiResponses([initialMessage]);
  };
  
  // 保存角色聊天记录
  const saveCharacterChat = async (characterId: string, messages: ChatMessage[]) => {
    if (!user) return;
    
    try {
      // 保存聊天记录到数据库
      await supabase
        .from('character_chats')
        .upsert({
          user_id: user.id,
          character_id: characterId,
          messages: messages,
          updated_at: new Date().toISOString()
        });
      
    } catch (error) {
      console.error("保存聊天记录失败:", error);
    }
  };
  
  // 处理发送消息
  const handleSendMessage = async (message: string) => {
    try {
      // 将用户消息添加到聊天
      const newMessages = [
        ...aiResponses,
        { role: 'user' as 'user', content: message }
      ];
      
      setAiResponses(newMessages);
      
      // 准备发送到AI的消息
      const messagesToSend = formatMessages(newMessages, {
        characterName: selectedCharacter.name,
        characterStrengths: selectedCharacter.strengths.join(', '),
        characterWeaknesses: selectedCharacter.weaknesses.join(', '),
        characterStories: selectedCharacter.stories.map(s => `${s.title}: ${s.content}`).join('\n\n')
      });
      
      // 发送到AI服务
      const aiResponse = await sendMessageToAI(messagesToSend, 'character_analysis');
      
      // 检查AI回复中是否有特质识别
      if (aiResponse) {
        // 添加AI回复到聊天
        const updatedMessages = [
          ...newMessages,
          { role: 'ai' as 'ai', content: aiResponse }
        ];
        
        setAiResponses(updatedMessages);
        
        // 保存聊天记录
        saveCharacterChat(selectedCharacter.id, updatedMessages);
        
        // 分析AI回复，自动提取可能的特质
        const strengthsMatch = aiResponse.match(/优点[：:]\s*([\u4e00-\u9fa5,，、]+)/);
        const weaknessesMatch = aiResponse.match(/缺点[：:]\s*([\u4e00-\u9fa5,，、]+)/);
        
        if (strengthsMatch) {
          const strengths = strengthsMatch[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
          strengths.forEach(trait => {
            if (trait && !characterTraits[selectedCharacter.id].strengths.includes(trait)) {
              handleTraitDiscovered(trait, 'strength');
            }
          });
        }
        
        if (weaknessesMatch) {
          const weaknesses = weaknessesMatch[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
          weaknesses.forEach(trait => {
            if (trait && !characterTraits[selectedCharacter.id].weaknesses.includes(trait)) {
              handleTraitDiscovered(trait, 'weakness');
            }
          });
        }
      }
      
    } catch (error) {
      console.error("发送消息失败:", error);
      
      // 添加错误消息到聊天
      setAiResponses(prev => [
        ...prev,
        { role: 'ai' as 'ai', content: "抱歉，发送消息时出现问题，请稍后再试。" }
      ]);
    }
  };
  
  // 处理添加产品创意
  const handleAddIdea = (idea: string) => {
    if (!productIdeas.includes(idea)) {
      setProductIdeas([...productIdeas, idea]);
    }
  };
  
  // 处理选择/取消选择产品创意
  const handleToggleIdea = (idea: string) => {
    if (selectedIdeas.includes(idea)) {
      setSelectedIdeas(selectedIdeas.filter(i => i !== idea));
    } else {
      setSelectedIdeas([...selectedIdeas, idea]);
    }
  };
  
  // 处理产品画布字段变化
  const handleCanvasChange = (field: string, value: string) => {
    if (field === 'showNeeds') {
      setShowNeeds(true);
      return;
    }
    
    setProductCanvas({
      ...productCanvas,
      [field]: value
    });
  };
  
  // 处理发现新特质
  const handleTraitDiscovered = (trait: string, type: 'strength' | 'weakness') => {
    if (!trait.trim()) return;
    
    setCharacterTraits(prev => {
      // 检查该特质是否已存在
      if (prev[selectedCharacter.id][type].includes(trait)) {
        return prev;
      }
      
      // 创建新的状态对象
      const newState = { ...prev };
      newState[selectedCharacter.id] = {
        ...newState[selectedCharacter.id],
        [type]: [...newState[selectedCharacter.id][type], trait]
      };
      
      return newState;
    });
  };
  
  // 处理添加新特质
  const handleAddTrait = (type: 'strength' | 'weakness') => {
    // 弹出对话框让用户输入新特质
    const trait = prompt(`请输入${type === 'strength' ? '优点' : '缺点'}:`);
    if (trait && trait.trim()) {
      handleTraitDiscovered(trait.trim(), type);
    }
  };
  
  return (
    <GlobalStyle>
      <div className="max-w-6xl mx-auto px-4 pb-12 pt-4">
        <CourseHeader 
          onBack={onBack} 
          progress={progress}
        />
        
        <CourseStages 
          currentStage={currentStage} 
          onStageChange={handlePageChange} 
        />
        
        {currentStage === 0 && (
          <CharacterAnalysis
            characters={characters}
            characterTraits={characterTraits}
            selectedCharacter={selectedCharacter}
            aiResponses={aiResponses}
            analyzedCharacters={analyzedCharacters}
            onSelectCharacter={handleSelectCharacter}
            onSendMessage={handleSendMessage}
            onTraitDiscovered={handleTraitDiscovered}
            onAddTrait={handleAddTrait}
            onSaveCharacterAnalysis={saveCharacterAnalysis}
          />
        )}
        
        {currentStage === 1 && (
          <ProductCanvas
            selectedCharacter={selectedCharacter}
            showNeeds={showNeeds}
            characterNeeds={characterNeeds}
            productIdeas={productIdeas}
            selectedIdeas={selectedIdeas}
            productCanvas={productCanvas}
            onAddIdea={handleAddIdea}
            onToggleIdea={handleToggleIdea}
            onCanvasChange={handleCanvasChange}
          />
        )}
        
        {currentStage === 2 && (
          <FlowChart
            productCanvas={productCanvas}
          />
        )}
        
        {currentStage === 3 && (
          <WebsiteCreation
            productCanvas={productCanvas}
          />
        )}
        
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevStage}
          >
            上一步
          </Button>
          
          <Button 
            onClick={handleNextStage}
            disabled={
              (currentStage === 0 && getAnalyzedCount() < characters.length) ||
              (currentStage === courseStages.length - 1)
            }
          >
            {currentStage === courseStages.length - 1 ? '完成课程' : '下一步'}
          </Button>
        </div>
      </div>
      
      <FloatingChatButton />
    </GlobalStyle>
  );
};

export default function XiyoujiCourseWithStyle(props: XiyoujiCourseProps) {
  return (
    <XiyoujiCourse {...props} />
  );
} 