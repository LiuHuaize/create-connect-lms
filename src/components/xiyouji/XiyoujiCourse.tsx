import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Info, ChevronRight, ChevronLeft, CheckCircle2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CharacterCard from './CharacterCard';
import AIChatBox, { ChatMessage } from './AIChatBox';
import CharacterStoryWithStyle from './CharacterStory';
import GlobalStyle from './GlobalStyle';
import FloatingChatButton from './FloatingChatButton';
import { sendMessageToAI, formatMessages, AppChatMessage } from '@/services/aiService';
import { toast } from '@/components/ui/use-toast';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { characters } from './course-components/characterData'; // Import characters data

interface XiyoujiCourseProps {
  onBack: () => void;
}

// 定义课程阶段
const courseStages = [
  { id: 'character-analysis', title: '人物分析', description: '分析师徒四人的特点、优缺点和需求' },
  { id: 'product-canvas', title: '产品画布', description: '头脑风暴，确定最适合的产品创意' },
  { id: 'flow-chart', title: '流程图', description: '使用Excalidraw绘制产品流程图' },
  { id: 'website-creation', title: '网站制作', description: '构建产品原型网站' }
];

// 定义CourseHeader组件
interface CourseHeaderProps {
  courseId: string;
  currentModuleIndex: number;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ courseId, currentModuleIndex }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => window.history.back()}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-indigo-800">西游记课程</h1>
          <p className="text-xs text-gray-500">中国古典名著学习</p>
        </div>
      </div>
    </div>
  );
};

const XiyoujiCourse: React.FC<XiyoujiCourseProps> = ({ onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [activeTab, setActiveTab] = useState('analysis');
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
  const [characterTraits, setCharacterTraits] = useState<{
    [key: string]: {
      strengths: string[],
      weaknesses: string[]
    }
  }>({
    tangseng: { strengths: [], weaknesses: [] },
    wukong: { strengths: [], weaknesses: [] },
    bajie: { strengths: [], weaknesses: [] },
    wujing: { strengths: [], weaknesses: [] }
  });
  
  // 添加缺失的状态变量
  const [user, setUser] = useState<any>(null);
  const [courseId, setCourseId] = useState('default-course-id');
  
  // 添加聊天记录的状态
  const [characterChats, setCharacterChats] = useState<{
    [key: string]: ChatMessage[]
  }>({
    tangseng: [],
    wukong: [],
    bajie: [],
    wujing: []
  });
  
  // 添加当前故事页码状态
  const [currentPage, setCurrentPage] = useState(0);
  
  // 修改或添加相关状态变量
  const [characterAnalyses, setCharacterAnalyses] = useState<any[]>([]);
  
  // 添加新状态
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  
  // 获取当前用户
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
  }, []);
  
  // 获取分析完成的角色数量
  const getAnalyzedCount = () => {
    return Object.values(analyzedCharacters).filter(Boolean).length;
  };
  
  // 检查是否所有角色都已分析
  const allCharactersAnalyzed = getAnalyzedCount() === 4;
  
  // 检查一个角色是否有足够的特质被发现
  const hasEnoughTraits = (characterId: string) => {
    return characterTraits[characterId].strengths.length > 0 && 
           characterTraits[characterId].weaknesses.length > 0;
  };
  
  // 保存角色分析到数据库
  const saveCharacterAnalysis = async (characterId: string, characterName: string) => {
    if (!user) return;
    
    try {
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from('character_analysis')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('character_id', characterId)
        .single();
      
      const characterTraitsData = {
        strengths: characterTraits[characterId].strengths,
        weaknesses: characterTraits[characterId].weaknesses
      };
      
      if (fetchError || !existingAnalysis) {
        // 创建新记录
        const { error } = await supabase
          .from('character_analysis')
          .insert({
            user_id: user.id,
            course_id: courseId,
            character_id: characterId,
            character_name: characterName,
            character_traits: characterTraitsData,
            is_analyzed: true,
            completed_at: new Date().toISOString()
          });
          
        if (error) throw error;
      } else {
        // 更新现有记录
        const { error } = await supabase
          .from('character_analysis')
          .update({
            character_traits: characterTraitsData,
            is_analyzed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id);
          
        if (error) throw error;
      }
      
      console.log(`角色分析已保存: ${characterName}`);
    } catch (error) {
      console.error('保存角色分析失败:', error);
    }
  };
  
  // 初始加载时获取已有聊天记录
  useEffect(() => {
    const fetchCharacterChats = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('character_analysis_chats')
          .select('character_id, messages')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const chatsByCharacter: {[key: string]: ChatMessage[]} = {
            tangseng: [],
            wukong: [],
            bajie: [],
            wujing: []
          };
          
          data.forEach(item => {
            if (item.character_id && item.messages) {
              // 确保从数据库加载的消息有正确的类型
              const typedMessages = item.messages.map((msg: any) => ({
                role: msg.role as 'user' | 'ai',
                content: msg.content
              }));
              chatsByCharacter[item.character_id] = typedMessages;
            }
          });
          
          setCharacterChats(chatsByCharacter);
          
          // 如果当前选择的角色有聊天记录，设置到aiResponses
          if (selectedCharacter && chatsByCharacter[selectedCharacter.id].length > 0) {
            setAiResponses(chatsByCharacter[selectedCharacter.id]);
          }
        }
      } catch (error) {
        console.error('获取聊天记录失败:', error);
      }
    };
    
    if (user) {
      fetchCharacterChats();
    }
  }, [user, courseId]);
  
  // 从故事内容中分析特质
  const analyzeStoryForTraits = (storyText: string, characterName: string) => {
    // 初步实现检测特质的逻辑
    const possibleStrengths = [
      '勇敢', '聪明', '忠诚', '善良', '坚持', '谨慎', '自信', '谦虚', '正直', '诚实', 
      '耐心', '温柔', '机智', '踏实', '负责', '乐观', '慷慨', '坚强', '细心', '慈悲',
      '执着', '有信仰', '领导力', '决断力', '包容', '智慧', '有远见'
    ];
    
    const possibleWeaknesses = [
      '固执', '贪婪', '自私', '冲动', '暴躁', '傲慢', '叛逆', '多疑', '悲观',
      '贪心', '胆小', '软弱', '粗心', '轻信', '优柔寡断', '固执己见', '体弱', 
      '缺乏判断力', '缺乏自保能力', '嫉妒', '懒惰', '害怕', '贪吃', '好色'
    ];
    
    const discoveredStrengths: string[] = [];
    const discoveredWeaknesses: string[] = [];
    
    // 简单检测文本中是否包含这些特质词
    possibleStrengths.forEach(trait => {
      if (storyText.includes(trait)) {
        discoveredStrengths.push(trait);
      }
    });
    
    possibleWeaknesses.forEach(trait => {
      if (storyText.includes(trait)) {
        discoveredWeaknesses.push(trait);
      }
    });
    
    return { strengths: discoveredStrengths, weaknesses: discoveredWeaknesses };
  };

  // 修改处理故事页码变化函数
  const handlePageChange = (index: number) => {
    setCurrentPage(index);
  };
  
  // 处理前一个故事
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // 处理下一个故事
  const handleNextPage = () => {
    if (currentPage < selectedCharacter.stories.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // 选择角色时也要重置当前页码和输入框
  const handleSelectCharacter = (character: typeof characters[0]) => {
    setSelectedCharacter(character);
    setShowNeeds(false);
    setCharacterNeeds([]);
    setCurrentPage(0);
    setNewStrength('');
    setNewWeakness('');
    
    // 如果该角色有保存的聊天记录，使用保存的记录
    if (characterChats[character.id] && characterChats[character.id].length > 0) {
      setAiResponses(characterChats[character.id]);
    } else {
      // 否则使用初始引导消息
      setAiResponses([
        { 
          role: 'ai' as 'ai', 
          content: `你好！我是${character.name}的分析助手。

你的任务是：
1. 阅读右侧的相关故事，思考这些故事揭示了${character.name}哪些性格特点
2. 与我讨论你发现的特点，我会帮你分析它们是优点还是缺点
3. 我会总结讨论结果并显示在"人物特点"页面
4. 你需要为每个角色至少找出一个优点和一个缺点才能进入下一阶段


请告诉我，从故事中你发现了${character.name}哪些性格特点？` 
        }
      ]);
    }
  };
  
  // 保存聊天记录到数据库
  const saveCharacterChat = async (characterId: string, messages: ChatMessage[]) => {
    if (!user) return;
    
    try {
      // 先检查是否已有该角色的聊天记录
      const { data: existingChat, error: fetchError } = await supabase
        .from('character_analysis_chats')
        .select('id')
        .eq('user_id', user.id)
        .eq('character_id', characterId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116是"没有找到结果"的错误，其他错误需要抛出
        throw fetchError;
      }
      
      if (!existingChat) {
        // 创建新记录
        const { error } = await supabase
          .from('character_analysis_chats')
          .insert({
            user_id: user.id,
            character_id: characterId,
            messages: messages
          });
          
        if (error) throw error;
      } else {
        // 更新现有记录
        const { error } = await supabase
          .from('character_analysis_chats')
          .update({
            messages: messages,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChat.id);
          
        if (error) throw error;
      }
      
      // 更新本地状态
      setCharacterChats(prev => ({
        ...prev,
        [characterId]: messages
      }));
      
      console.log(`聊天记录已保存: ${characterId}`);
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  };
  
  // 修改处理聊天消息发送的函数
  const handleSendMessage = async (message: string) => {
    const characterId = selectedCharacter.id;
    const currentMessages = characterChats[characterId] || [];

    // 添加用户消息到当前角色的聊天记录
    const updatedMessages = [...currentMessages, { role: 'user' as 'user', content: message }];
    
    // 更新状态以立即显示用户消息
    setCharacterChats(prev => ({
        ...prev,
        [characterId]: updatedMessages
      }));

    try {
      // 更新系统提示，引导AI进行启发式对话，使用儿童化语言
      const systemPrompt = `你是一个可爱的小助手，正在和一位小朋友一起学习西游记！你的任务是引导小朋友思考关于 ${selectedCharacter.name} 的优点和缺点，而不是直接告诉他答案。

当前的故事是关于《${selectedCharacter.stories[currentPage].title}》。
故事内容是："${selectedCharacter.stories[currentPage].content}"

请记住：
1.  用苏格拉底式对话，引导小朋友思考。
2.  如果小朋友问你问题，试着用提问的方式回答，引导他自己找答案。
3.  不要直接说出优点或缺点，给他们点提示适当的。
4.  引导小朋友总结出 ${selectedCharacter.name} 的优点和缺点。
`;

      // 将本地 ChatMessage 转换为 AppChatMessage
      const aiMessages: AppChatMessage[] = [
        { role: 'system' as const, content: systemPrompt },
        ...updatedMessages.map(msg => ({
          role: msg.role as 'user' | 'ai' | 'system',
          content: msg.content
        }))
      ];
      
      const aiResponse = await sendMessageToAI(aiMessages);
      
      // 添加AI回复到当前角色的聊天记录
      const finalMessages: ChatMessage[] = [
        ...updatedMessages, 
        { role: 'ai' as 'ai', content: aiResponse }
      ];
      
      // 更新状态以显示AI回复
       setCharacterChats(prev => ({
        ...prev,
        [characterId]: finalMessages
      }));
      
      // 保存完整聊天记录到数据库
      saveCharacterChat(characterId, finalMessages);
      
    } catch (error) {
      console.error('获取AI回复失败:', error);
      // 将错误消息添加到当前角色的聊天记录
      const errorResponse: ChatMessage = { 
        role: 'ai', 
        content: '抱歉，我在处理您的请求时遇到了问题。请稍后再试。' 
      };
      setCharacterChats(prev => ({
        ...prev,
        [characterId]: [...updatedMessages, errorResponse]
      }));
    }
  };

  // 处理添加产品创意
  const handleAddIdea = (idea: string) => {
    if (idea.trim()) {
      setProductIdeas(prev => [...prev, idea]);
    }
  };

  // 处理选择/取消选择创意
  const handleToggleIdea = (idea: string) => {
    if (selectedIdeas.includes(idea)) {
      setSelectedIdeas(prev => prev.filter(i => i !== idea));
    } else if (selectedIdeas.length < 3) {
      setSelectedIdeas(prev => [...prev, idea]);
    }
  };

  // 处理产品画布字段更新
  const handleCanvasChange = (field: keyof typeof productCanvas, value: string) => {
    setProductCanvas(prev => ({ ...prev, [field]: value }));
  };

  // 处理阶段导航
  const handlePrevStage = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleNextStage = () => {
    // 检查是否所有角色都已分析且每个角色都至少有一个优点和一个缺点
    const allCharactersHaveTraits = Object.keys(characterTraits).every(charId => 
      hasEnoughTraits(charId)
    );
    
    if (currentStage === 0 && (!allCharactersAnalyzed || !allCharactersHaveTraits)) {
      // 显示提示消息
      toast({
        title: "无法进入下一阶段",
        description: !allCharactersAnalyzed 
          ? "请先完成所有四个角色的分析" 
          : "每个角色至少需要发现一个优点和一个缺点",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStage < courseStages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  // 处理发现的新特质 - 现在主要由用户输入触发
  const handleTraitDiscovered = (trait: string, type: 'strength' | 'weakness') => {
    if (!trait || !trait.trim()) return;

    const characterId = selectedCharacter.id;
    const updatedTraits = {...characterTraits};
    const traitsList = type === 'strength' ? 'strengths' : 'weaknesses';
    const trimmedTrait = trait.trim();

    if (!updatedTraits[characterId][traitsList].includes(trimmedTrait)) {
      updatedTraits[characterId][traitsList] = [...updatedTraits[characterId][traitsList], trimmedTrait];
      setCharacterTraits(updatedTraits);
      
      if (hasEnoughTraits(characterId) && !analyzedCharacters[characterId]) {
        const updatedAnalyzed = {...analyzedCharacters};
        updatedAnalyzed[characterId] = true;
        setAnalyzedCharacters(updatedAnalyzed);
        saveCharacterAnalysis(characterId, selectedCharacter.name);
      }
    }
  };
  
  // 新增：处理添加优点/缺点按钮点击
  const handleAddTrait = (type: 'strength' | 'weakness') => {
    const trait = type === 'strength' ? newStrength : newWeakness;
    handleTraitDiscovered(trait, type);
    // 清空输入框
    if (type === 'strength') {
      setNewStrength('');
    } else {
      setNewWeakness('');
    }
  };

  // 修改渲染特质的部分 - 现在用于右侧面板
  const renderCharacterTraitsPanel = () => {
    const characterId = selectedCharacter.id;
    const discoveredStrengths = characterTraits[characterId]?.strengths || [];
    const discoveredWeaknesses = characterTraits[characterId]?.weaknesses || [];

    return (
      <div className="h-full overflow-y-auto p-4 space-y-6 flex flex-col">
        <div>
          <h4 className="text-base font-semibold text-green-700 mb-3">优点</h4>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
            {discoveredStrengths.length === 0 ? (
              <p className="text-xs text-gray-400 italic">暂无优点</p>
            ) : (
              discoveredStrengths.map((trait, index) => (
                <Badge key={`strength-${index}`} variant="outline" className="bg-green-50 border-green-200 text-green-800">
                  {trait}
                </Badge>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="text"
              placeholder="添加优点..."
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTrait('strength'); }}
              className="h-9 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => handleAddTrait('strength')} className="h-9 px-3">
              <PlusCircle size={16} />
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-base font-semibold text-red-700 mb-3">缺点</h4>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
            {discoveredWeaknesses.length === 0 ? (
               <p className="text-xs text-gray-400 italic">暂无缺点</p>
            ) : (
              discoveredWeaknesses.map((trait, index) => (
                <Badge key={`weakness-${index}`} variant="outline" className="bg-red-50 border-red-200 text-red-800">
                  {trait}
                </Badge>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="text"
              placeholder="添加缺点..."
              value={newWeakness}
              onChange={(e) => setNewWeakness(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTrait('weakness'); }}
              className="h-9 text-sm"
            />
             <Button size="sm" variant="outline" onClick={() => handleAddTrait('weakness')} className="h-9 px-3">
               <PlusCircle size={16} />
            </Button>
          </div>
        </div>
        
         <div className="mt-auto pt-4 text-xs text-gray-500 text-center">
          请根据故事分析人物特点，并在此处添加。
        </div>
      </div>
    );
  };

  // 修改渲染阶段内容
  const renderStageContent = () => {
    switch (currentStage) {
      case 0: // 人物分析 - 新布局
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 grid grid-cols-12 gap-4 h-[calc(100vh-230px)]">
              {/* 左侧：角色选择 */}
              <div className="col-span-2 h-full overflow-y-auto rounded-lg border border-indigo-100">
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 font-medium text-indigo-800">
                  选择角色
                </div>
                <div className="divide-y divide-indigo-100">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => handleSelectCharacter(character)}
                      className={`w-full p-3 text-left transition-colors duration-200 flex items-center gap-2 ${
                        selectedCharacter?.id === character.id
                          ? "bg-indigo-100 text-indigo-900 font-semibold"
                          : "hover:bg-indigo-50/50"
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={character.avatar} alt={character.name} />
                        <AvatarFallback>
                          {character.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{character.name}</div>
                        <div className={`text-xs ${analyzedCharacters[character.id] ? 'text-green-600' : 'text-gray-500'}`}>
                          {analyzedCharacters[character.id] ? "已分析" : "未分析"}
                        </div>
                      </div>
                      {analyzedCharacters[character.id] && hasEnoughTraits(character.id) && (
                        <CheckCircle2
                          size={16}
                          className="ml-auto text-green-500"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 中间：故事内容 */}
              <div className="col-span-6 h-full overflow-hidden flex flex-col border border-indigo-100 rounded-lg">
                {!selectedCharacter ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    请选择一个角色开始分析
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100 font-medium text-indigo-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                          <AvatarFallback>{selectedCharacter.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {selectedCharacter.name}的故事
                      </div>
                      <Badge variant="outline" className="text-xs font-normal bg-white">
                        故事 {currentPage + 1}/{selectedCharacter.stories.length}
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <ScrollArea className="h-full w-full">
                        <div className="prose prose-sm prose-indigo max-w-none">
                          <h3 className="text-base font-semibold mb-3">
                            {selectedCharacter.stories[currentPage].title}
                          </h3>
                          <div className="whitespace-pre-line leading-relaxed text-gray-700">
                            {selectedCharacter.stories[currentPage].content}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="p-4 border-t border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="h-8 flex items-center gap-1 text-xs bg-white"
                      >
                        <ChevronLeft size={14} />
                        上一个故事
                      </Button>
                      
                      <div className="flex gap-1">
                        {selectedCharacter.stories.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => handlePageChange(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === currentPage 
                                ? 'bg-indigo-500 scale-125' 
                                : 'bg-indigo-200 hover:bg-indigo-300'
                            }`}
                            aria-label={`跳转到故事 ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === selectedCharacter.stories.length - 1}
                        className="h-8 flex items-center gap-1 text-xs bg-white"
                      >
                        下一个故事
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* 右侧：特点分析面板 */}
              <div className="col-span-4 h-full overflow-hidden flex flex-col border border-indigo-100 rounded-lg bg-white">
                 <div className="p-4 bg-indigo-50 border-b border-indigo-100 font-medium text-indigo-800 flex items-center justify-between">
                  <div>{selectedCharacter.name} 特点分析</div>
                   <Badge variant="outline" className="text-xs font-normal bg-white">
                    手动添加
                  </Badge>
                </div>
                {!selectedCharacter ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    请选择一个角色开始分析
                  </div>
                ) : (
                  renderCharacterTraitsPanel()
                )}
              </div>
            </div>
            
            {/* 底部按钮和进度条 */}
            <div className="mt-6 p-4 border border-indigo-100 rounded-lg bg-white shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium text-indigo-800">人物分析进度: {getAnalyzedCount()}/{characters.length}</h3>
                  <p className="text-sm text-gray-500">为每个角色至少发现一个优点和一个缺点</p>
                </div>
                <Button
                  onClick={handleNextStage}
                  disabled={!allCharactersAnalyzed || !Object.keys(characterTraits).every(charId => hasEnoughTraits(charId))}
                  variant={allCharactersAnalyzed && Object.keys(characterTraits).every(charId => hasEnoughTraits(charId)) ? "default" : "secondary"}
                  className={`${allCharactersAnalyzed && Object.keys(characterTraits).every(charId => hasEnoughTraits(charId)) ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                >
                  进入下一阶段
                </Button>
              </div>
              <Progress
                value={(getAnalyzedCount() / characters.length) * 100}
                max={100}
                className="h-2 mt-2"
              />
            </div>
          </div>
        );
      case 1: // 产品画布
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* 创意头脑风暴区域 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-4 backdrop-blur-sm bg-white/90">
              <h2 className="text-base md:text-lg font-medium text-indigo-700 mb-3">创意头脑风暴</h2>
              
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="添加你的创意..." 
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddIdea(target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="添加你的创意..."]') as HTMLInputElement;
                      handleAddIdea(input.value);
                      input.value = '';
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white border-0"
                  >
                    添加
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg min-h-[100px] border border-indigo-100">
                  {productIdeas.length === 0 ? (
                    <p className="text-gray-400 text-sm w-full text-center">添加你的创意，可以是任何帮助师徒四人西天取经的软件...</p>
                  ) : (
                    productIdeas.map((idea, index) => (
                      <div 
                        key={index}
                        onClick={() => handleToggleIdea(idea)}
                        className={`p-2 rounded-lg text-xs cursor-pointer transition-all ${
                          selectedIdeas.includes(idea) 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                      >
                        {idea}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-gray-500">选择3个最有潜力的创意 ({selectedIdeas.length}/3)</span>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-700">
                  提示：思考师徒四人在旅途中可能面临的问题，结合现代技术，提出创新解决方案。
                </p>
              </div>
            </div>
            
            {/* 产品画布填写区域 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-4 backdrop-blur-sm bg-white/90">
              <h2 className="text-base md:text-lg font-medium text-indigo-700 mb-3">产品画布</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                  <input 
                    type="text" 
                    value={productCanvas.title}
                    onChange={(e) => handleCanvasChange('title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="给你的产品起个名字..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">要解决的问题</label>
                  <textarea 
                    value={productCanvas.problem}
                    onChange={(e) => handleCanvasChange('problem', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                    placeholder="这个产品解决了什么问题？"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
                  <textarea 
                    value={productCanvas.solution}
                    onChange={(e) => handleCanvasChange('solution', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                    placeholder="产品如何解决这个问题？"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">独特价值</label>
                  <textarea 
                    value={productCanvas.uniqueValue}
                    onChange={(e) => handleCanvasChange('uniqueValue', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                    placeholder="产品的独特价值是什么？"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户群体</label>
                  <input 
                    type="text" 
                    value={productCanvas.userGroups}
                    onChange={(e) => handleCanvasChange('userGroups', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="谁会使用这个产品？"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">关键功能</label>
                  <textarea 
                    value={productCanvas.keyFeatures}
                    onChange={(e) => handleCanvasChange('keyFeatures', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                    placeholder="列出产品的核心功能..."
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2: // 流程图
        return (
          <div className="mt-4">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-4 backdrop-blur-sm bg-white/90">
              <h2 className="text-base md:text-lg font-medium text-indigo-700 mb-3">产品流程图</h2>
              
              <div className="aspect-video bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-4">在这里使用Excalidraw绘制流程图</p>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                    打开Excalidraw
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-700 mb-2">流程图步骤：</h3>
                  <ol className="list-decimal pl-4 text-xs text-gray-700 space-y-1">
                    <li>确定用户旅程的起点和终点</li>
                    <li>列出主要功能和交互点</li>
                    <li>设计页面流程和导航路径</li>
                    <li>添加决策点和条件分支</li>
                    <li>注明数据流向和系统响应</li>
                  </ol>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">提示与建议：</h3>
                  <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                    <li>保持流程简洁清晰</li>
                    <li>使用一致的符号表示不同元素</li>
                    <li>标注每个步骤的描述</li>
                    <li>考虑潜在的错误处理流程</li>
                    <li>设计直观的用户体验路径</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3: // 网站制作
        return (
          <div className="mt-4">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-4 backdrop-blur-sm bg-white/90">
              <h2 className="text-base md:text-lg font-medium text-indigo-700 mb-3">网站原型制作</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">与AI对话</h3>
                  <p className="text-xs text-gray-600 mb-4">描述你想要创建的网站，包括功能、风格和布局</p>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">场景描述</label>
                    <textarea 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                      placeholder="描述你的产品场景和用户故事..."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">网站风格</label>
                    <textarea 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[60px]"
                      placeholder="描述你希望的设计风格和用户体验..."
                    />
                  </div>
                  
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white border-0">
                    生成网站原型
                  </Button>
                </div>
                
                <div className="aspect-video bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-gray-400">网站预览将在这里显示</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <h3 className="text-sm font-medium text-green-700 mb-2">提示：</h3>
                <p className="text-xs text-gray-700">
                  尽可能详细地描述你的网站需求，包括目标用户、核心功能、页面结构、交互方式和设计风格。AI将根据你的描述生成网站原型。
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
      <div className="container mx-auto py-6 space-y-6 relative">
        <CourseHeader courseId={courseId} currentModuleIndex={currentStage} />
        {renderStageContent()}

        <DialogTrigger asChild>
           <Button 
            variant="outline" 
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white p-0 flex items-center justify-center border-2 border-white"
            aria-label="打开AI助手"
          >
              <Sparkles size={24} />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[500px] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-medium text-indigo-800">
            与 {selectedCharacter?.name || 'AI'} 助手对话
          </DialogTitle>
        </DialogHeader>
        {selectedCharacter ? (
          <AIChatBox
            key={selectedCharacter.id}
            characterName={selectedCharacter.name}
            messages={characterChats[selectedCharacter.id] || []}
            onSendMessage={handleSendMessage}
            height="calc(100% - 65px)"
            placeholder={`思考${selectedCharacter.name}的需求...`}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
            请先在主界面选择一个角色。
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function XiyoujiCourseWithStyle(props: XiyoujiCourseProps) {
  return (
    <XiyoujiCourse {...props} />
  );
} 