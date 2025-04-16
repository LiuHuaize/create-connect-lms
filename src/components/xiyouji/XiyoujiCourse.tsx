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
  
  // 添加AI创意助手状态
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);
  
  // 添加创意页面标签状态
  const [activeCreativeTab, setActiveCreativeTab] = useState('brainstorm'); // 'brainstorm', 'selected', 'canvas'
  
  // 添加删除确认状态
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
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
    // 测试阶段：跳过验证逻辑，允许直接进入下一阶段
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

  // 处理AI创意助手请求
  const handleGetAiHelp = async () => {
    if (selectedIdeas.length === 0) return;
    
    setIsLoadingAiSuggestion(true);
    
    try {
      // 构建提示信息
      const systemPrompt = `你是为孩子们设计的西游记创意助手。你的任务是帮助孩子们完善他们为唐僧师徒四人设计的产品创意。
      
请记住：
1. 使用友好、鼓励的语气，适合与儿童交流
2. 提供具体的建议，但不要完全改变他们的创意
3. 针对创意可能存在的问题提出改进方案
4. 引导他们思考产品如何更好地帮助唐僧师徒解决西天取经路上的困难
5. 保持积极正面的态度，赞美他们的创造力`;

      const userMessage = `我选择了这些产品创意，请帮我分析它们的优缺点，并给出如何改进的建议：
${selectedIdeas.map((idea, index) => `创意${index + 1}: ${idea}`).join('\n')}

如果你认为这些创意中有一个特别有潜力，请重点分析它，并帮我完善。`;

      // 构建AI请求消息
      const aiMessages: AppChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];
      
      // 发送请求到AI服务
      const aiResponse = await sendMessageToAI(aiMessages);
      
      // 设置AI回复
      setAiSuggestion(aiResponse);
      
    } catch (error) {
      console.error('获取AI建议失败:', error);
      setAiSuggestion("抱歉，我暂时无法提供创意建议。请稍后再试。");
    } finally {
      setIsLoadingAiSuggestion(false);
    }
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
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
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
          <div className="flex flex-col space-y-6 mt-4">
            {/* 顶部标题和导航 */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
              <h2 className="text-xl font-bold mb-3">产品创意工坊</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveCreativeTab('brainstorm')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCreativeTab === 'brainstorm'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  头脑风暴
                </button>
                <button
                  onClick={() => setActiveCreativeTab('selected')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCreativeTab === 'selected'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  精选创意
                </button>
                <button
                  onClick={() => setActiveCreativeTab('canvas')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCreativeTab === 'canvas'
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  产品画布
                </button>
              </div>
            </div>

            {/* 创意头脑风暴区域 - 更吸引儿童的设计 */}
            {activeCreativeTab === 'brainstorm' && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Sparkles className="mr-2" size={20} />
                    创意头脑风暴
                  </h2>
                  <p className="text-white/80 text-sm">想象你可以为唐僧师徒创造什么样的神奇工具？</p>
                </div>
                
                <div className="p-6">
                  <div className="flex gap-3 mb-6">
                    <Input 
                      type="text" 
                      placeholder="输入你的创意点子..." 
                      className="border-2 border-orange-200 focus:border-orange-400 rounded-full pl-4 text-md"
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
                        const input = document.querySelector('input[placeholder="输入你的创意点子..."]') as HTMLInputElement;
                        handleAddIdea(input.value);
                        input.value = '';
                      }}
                      className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white rounded-full font-semibold px-6"
                    >
                      <Sparkles className="mr-2" size={16} />
                      添加创意
                    </Button>
                  </div>
                  
                  {/* 创意展示墙 - 类似便利贴的样式 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto p-2">
                    {productIdeas.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <img src="/images/idea-bulb.svg" alt="创意灯泡" className="w-24 h-24 mb-4 opacity-30" />
                        <p className="text-gray-400">还没有任何创意，开始添加你的点子吧！</p>
                      </div>
                    ) : (
                      productIdeas.map((idea, index) => {
                        // 为每个卡片随机分配一种颜色主题
                        const themes = [
                          'from-pink-300 to-red-300 border-pink-400 text-pink-800',
                          'from-orange-300 to-amber-300 border-orange-400 text-amber-800',
                          'from-lime-300 to-green-300 border-lime-400 text-green-800',
                          'from-cyan-300 to-blue-300 border-cyan-400 text-blue-800',
                          'from-violet-300 to-purple-300 border-violet-400 text-purple-800',
                        ];
                        const theme = themes[index % themes.length];
                        
                        // 为每个卡片随机分配一个图标
                        const icons = [
                          '🚀', '🌟', '🎮', '🎨', '🎯', '🎪', '🧩', '🔮', '🧸', '🦄', '🦊', '🐉'
                        ];
                        const icon = icons[index % icons.length];
                        
                        return (
                          <div 
                            key={index}
                            className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 
                                       transform hover:scale-105 hover:shadow-xl group
                                       ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                                       ${selectedIdeas.includes(idea) 
                                         ? 'shadow-md bg-gradient-to-br from-indigo-200 to-purple-200 border-2 border-indigo-400' 
                                         : `shadow bg-gradient-to-br ${theme} border-2`
                                       }`}
                            style={{minHeight: '120px'}}
                          >
                            {/* 背景装饰元素 */}
                            <div className="absolute -bottom-2 -right-2 text-4xl opacity-20">{icon}</div>
                            
                            {/* 选中标记 */}
                            {selectedIdeas.includes(idea) && (
                              <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1 shadow-lg">
                                <CheckCircle2 size={18} />
                              </div>
                            )}
                            
                            {/* 删除按钮 */}
                            <div 
                              className={`absolute -top-3 -left-3 bg-red-500 text-white rounded-full p-1 shadow-lg 
                                         ${deleteConfirmation === idea ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:opacity-100'} 
                                         transition-opacity z-20 cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation(); // 阻止冒泡，避免触发卡片的点击事件
                                handleDeleteIdea(idea);
                              }}
                              title={deleteConfirmation === idea ? "再次点击确认删除" : "删除创意"}
                            >
                              {deleteConfirmation === idea ? (
                                <div className="flex items-center justify-center animate-pulse">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                  </svg>
                                </div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              )}
                            </div>
                            
                            {/* 创意内容 - 点击这部分可以选择/取消选择创意 */}
                            <div 
                              className="relative z-10 h-full"
                              onClick={() => handleToggleIdea(idea)}
                            >
                              <div className="text-lg font-bold mb-1">{icon}</div>
                              <p className="font-medium">{idea}</p>
                            </div>
                            
                            {/* 闪光效果 */}
                            <div className={`absolute top-2 right-2 h-2 w-2 rounded-full bg-white 
                                            ${selectedIdeas.includes(idea) ? 'animate-pulse' : ''}`}></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">已选创意:</span>
                      <div className="text-sm py-1 px-3 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                        {selectedIdeas.length}/3
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      disabled={selectedIdeas.length === 0 || isLoadingAiSuggestion}
                      onClick={handleGetAiHelp}
                    >
                      {isLoadingAiSuggestion ? (
                        <>
                          <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-2" />
                          思考中...
                        </>
                      ) : (
                        "获取AI帮助"
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* AI创意建议展示区域 */}
                {aiSuggestion && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-700 mb-2 flex items-center">
                      <Sparkles size={16} className="mr-2" />
                      创意助手建议
                    </h3>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {aiSuggestion}
                    </div>
                  </div>
                )}
                
                {/* AI助手提示区域 */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-t-2 border-indigo-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-full shadow-md">
                      <Sparkles className="text-indigo-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-indigo-700">创意小助手提示</h3>
                      <p className="text-sm text-gray-600">思考一下师徒四人在旅途中遇到的各种妖怪和困难，他们会需要什么样的帮助呢？孙悟空的神通广大，但也有无法解决的问题！</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeCreativeTab === 'selected' && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Sparkles className="mr-2" size={20} />
                    精选创意
                  </h2>
                  <p className="text-white/80 text-sm">挑选最有价值的创意进行深入分析</p>
                </div>
                
                <div className="p-6">
                  {selectedIdeas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <img src="/images/empty-box.svg" alt="空盒子" className="w-24 h-24 mb-4 opacity-30" />
                      <p className="text-gray-400">尚未选择任何创意，请先在头脑风暴中选择创意</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-indigo-300 text-indigo-700"
                        onClick={() => setActiveCreativeTab('brainstorm')}
                      >
                        返回头脑风暴
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {selectedIdeas.map((idea, index) => {
                        // 为每个卡片随机分配一种颜色主题
                        const themes = [
                          'from-pink-300 to-red-300 border-pink-400 text-pink-800',
                          'from-orange-300 to-amber-300 border-orange-400 text-amber-800',
                          'from-lime-300 to-green-300 border-lime-400 text-green-800',
                          'from-cyan-300 to-blue-300 border-cyan-400 text-blue-800',
                          'from-violet-300 to-purple-300 border-violet-400 text-purple-800',
                        ];
                        const theme = themes[index % themes.length];
                        
                        // 为每个卡片随机分配一个图标
                        const icons = [
                          '🚀', '🌟', '🎮', '🎨', '🎯', '🎪', '🧩', '🔮', '🧸', '🦄', '🦊', '🐉'
                        ];
                        const icon = icons[index % icons.length];
                        
                        return (
                          <div 
                            key={index}
                            className={`relative p-5 rounded-xl transition-all duration-300 
                                       transform hover:scale-105 hover:shadow-xl shadow-md
                                       bg-gradient-to-br ${theme} border-2`}
                          >
                            {/* 背景装饰元素 */}
                            <div className="absolute -bottom-2 -right-2 text-5xl opacity-20">{icon}</div>
                            
                            {/* 创意内容 */}
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="text-2xl">{icon}</div>
                                <h4 className="font-bold text-lg">创意 {index + 1}</h4>
                              </div>
                              <p className="font-medium text-lg">{idea}</p>
                            </div>
                            
                            {/* 闪光效果 */}
                            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-white animate-pulse"></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {selectedIdeas.length > 0 && (
                    <div className="mt-8 space-y-6">
                      <div className="flex justify-center">
                        <Button
                          onClick={handleGetAiHelp}
                          disabled={isLoadingAiSuggestion}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg"
                        >
                          {isLoadingAiSuggestion ? (
                            <>
                              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              思考创意中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2" size={20} />
                              获取AI魔法分析
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {aiSuggestion && (
                        <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-lg">
                          <h3 className="font-bold text-purple-700 mb-4 flex items-center text-xl">
                            <Sparkles size={24} className="mr-3" />
                            创意小助手分析
                          </h3>
                          <div className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                            {aiSuggestion}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeCreativeTab === 'canvas' && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-green-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-teal-500 p-4">
                  <h2 className="text-xl font-bold text-white">产品详情设计</h2>
                  <p className="text-white/80 text-sm">把你的创意变成一个完整的产品！</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">你的产品叫什么名字？</label>
                    <Input 
                      type="text" 
                      value={productCanvas.title}
                      onChange={(e) => handleCanvasChange('title', e.target.value)}
                      className="border-2 border-green-200 focus:border-green-400 rounded-lg text-lg font-medium"
                      placeholder="给你的产品起个超酷的名字..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">谁会使用这个产品？</label>
                    <Input 
                      type="text" 
                      value={productCanvas.userGroups}
                      onChange={(e) => handleCanvasChange('userGroups', e.target.value)}
                      className="border-2 border-green-200 focus:border-green-400 rounded-lg"
                      placeholder="唐僧？孙悟空？还是其他人？"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">这个产品能解决什么问题？</label>
                    <textarea 
                      value={productCanvas.problem}
                      onChange={(e) => handleCanvasChange('problem', e.target.value)}
                      className="w-full p-3 border-2 border-green-200 focus:border-green-400 rounded-lg text-md min-h-[80px]"
                      placeholder="西天路上遇到了什么困难？这个产品如何帮助解决？"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">产品是如何解决问题的？</label>
                    <textarea 
                      value={productCanvas.solution}
                      onChange={(e) => handleCanvasChange('solution', e.target.value)}
                      className="w-full p-3 border-2 border-green-200 focus:border-green-400 rounded-lg text-md min-h-[80px]"
                      placeholder="详细描述一下产品是怎么工作的..."
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">这个产品有什么特别之处？</label>
                    <textarea 
                      value={productCanvas.uniqueValue}
                      onChange={(e) => handleCanvasChange('uniqueValue', e.target.value)}
                      className="w-full p-3 border-2 border-green-200 focus:border-green-400 rounded-lg text-md min-h-[80px]"
                      placeholder="为什么这个产品与众不同？有什么创新的地方？"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">产品的主要功能有哪些？</label>
                    <textarea 
                      value={productCanvas.keyFeatures}
                      onChange={(e) => handleCanvasChange('keyFeatures', e.target.value)}
                      className="w-full p-3 border-2 border-green-200 focus:border-green-400 rounded-lg text-md min-h-[80px]"
                      placeholder="列出产品的3-5个最重要功能..."
                    />
                  </div>
                </div>
                
                {/* AI助手建议区域 */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 border-t-2 border-green-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-full shadow-md">
                      <Sparkles className="text-green-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-700">设计小助手提示</h3>
                      <p className="text-sm text-gray-600">想象一下如果你的产品真的存在，会给唐僧师徒带来什么变化？他们的旅程会变得更轻松吗？</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 底部导航按钮 */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={handlePrevStage}
                variant="outline"
                className="border-indigo-300 text-indigo-700"
              >
                <ChevronLeft className="mr-2" size={16} />
                返回上一步
              </Button>
              
              <Button
                onClick={handleNextStage}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
              >
                继续下一步
                <ChevronRight className="ml-2" size={16} />
              </Button>
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

  // 修改删除创意的处理函数
  const handleDeleteIdea = (ideaToDelete: string) => {
    // 如果当前没有等待确认的删除操作，则设置确认状态
    if (deleteConfirmation !== ideaToDelete) {
      setDeleteConfirmation(ideaToDelete);
      
      // 3秒后自动重置确认状态
      setTimeout(() => {
        setDeleteConfirmation(null);
      }, 3000);
      
      return;
    }
    
    // 已经确认删除，执行删除操作
    setProductIdeas(prev => prev.filter(idea => idea !== ideaToDelete));
    
    // 如果该创意在已选创意中，也从中移除
    if (selectedIdeas.includes(ideaToDelete)) {
      setSelectedIdeas(prev => prev.filter(idea => idea !== ideaToDelete));
    }
    
    // 重置确认状态
    setDeleteConfirmation(null);
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