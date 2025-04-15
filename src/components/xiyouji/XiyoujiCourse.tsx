import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CharacterCard from './CharacterCard';
import AIChatBox, { ChatMessage } from './AIChatBox';
import CharacterStoryWithStyle from './CharacterStory';
import GlobalStyle from './GlobalStyle';
import FloatingChatButton from './FloatingChatButton';

interface XiyoujiCourseProps {
  onBack: () => void;
}

// 人物数据
const characters = [
  {
    id: 'tangseng',
    name: '唐僧',
    avatar: '/images/唐僧.png',
    strengths: ['善良', '坚持', '忠诚', '有信仰'],
    weaknesses: ['轻信他人', '缺乏判断力', '体弱多病', '缺乏自保能力'],
    stories: [
      {
        title: '三打白骨精',
        content: '唐僧看到白骨精变成的女子主动投怀送抱，哪怕孙悟空说破白骨精的真面目，他依然相信自己眼前所见，甚至为此逐出孙悟空。这个故事展示了唐僧轻信他人、缺乏判断力的特点，也显示了他对佛法的忠诚和坚持。',
      },
      {
        title: '收服八戒',
        content: '唐僧通过劝说和佛法感化高老庄的猪八戒，让他皈依佛门，做了自己的二徒弟。这个故事展示了唐僧善良、有信仰、以德服人的特点。',
      },
      {
        title: '金兜洞受难',
        content: '唐僧在金兜洞被黄袍怪抓走，坚持不吃肉，宁死不屈。即使在生命危险面前，他依然坚守自己的信仰和戒律，展现了他坚定的信念和对佛法的执着。',
      },
      {
        title: '女儿国情缘',
        content: '唐僧在女儿国遇到国王爱慕，面对女儿国国王的求爱，他坚持修行初心，拒绝了温柔富贵的诱惑。这展示了他对佛法的专注和坚守承诺的品质。',
      },
      {
        title: '莲花洞遇险',
        content: '在莲花洞被蜘蛛精抓住时，唐僧面对死亡威胁仍旧不忘念经，表现出了他在危险时刻的镇定与对佛法的虔诚。尽管他没有能力自救，但心中始终坚定。',
      },
      {
        title: '普济寺募捐',
        content: '唐僧途经普济寺时，看到寺庙年久失修，立即发心募捐重建，并亲自参与劳作。这个故事展示了他慈悲为怀、乐于助人的性格特点。'
      }
    ],
    needs: ['安全保障系统', '辨别真伪的AI助手', '身体健康管理APP', '准确的导航系统']
  },
  {
    id: 'wukong',
    name: '孙悟空',
    avatar: '/images/孙悟空.jpeg',
    strengths: ['战斗力强', '神通广大', '机智聪明', '忠心护主'],
    weaknesses: ['暴躁易怒', '傲慢自大', '叛逆', '缺乏耐心'],
    stories: [
      {
        title: '大闹天宫',
        content: '孙悟空因不满自己"弼马温"的职位，大闹天宫，自封为"齐天大圣"。这个故事展示了他叛逆、傲慢、不服管教的性格，同时也显示了他勇敢无惧、追求自由的一面。',
      },
      {
        title: '火眼金睛',
        content: '孙悟空用火眼金睛识破妖怪的伪装，保护师父的安全，如三打白骨精的故事。这展示了他的忠心护主、机智聪明，以及超凡的能力。',
      },
      {
        title: '三借芭蕉扇',
        content: '为了帮助师父渡过火焰山，孙悟空三次向铁扇公主借芭蕉扇，展现了他不畏困难、勇于尝试的精神，以及为达目的不惜使用各种智谋的特点。',
      },
      {
        title: '大战二郎神',
        content: '孙悟空与二郎神展开激烈对决，双方各显神通。在这场战斗中，他展示了非凡的战斗技巧和变化能力，但也显露出急躁冲动的一面。',
      },
      {
        title: '偷吃人参果',
        content: '在人参果园，孙悟空耐不住诱惑偷吃仙果，导致五庄观主人前来追究。这个故事展示了他有时冲动任性、不计后果的性格弱点。',
      },
      {
        title: '大战红孩儿',
        content: '面对火云洞的红孩儿，孙悟空初战失利，但不气馁，最终寻求帮助战胜对手。这表明他虽然骄傲，但在关键时刻也懂得寻求援助，有一定的团队意识。'
      }
    ],
    needs: ['情绪管理工具', '沟通技巧提升APP', '团队协作系统', '战斗力量监测器']
  },
  {
    id: 'bajie',
    name: '猪八戒',
    avatar: '/images/猪八戒.jpeg',
    strengths: ['力气大', '老实', '会水性', '有生活情趣'],
    weaknesses: ['贪吃', '好色', '懒惰', '胆小'],
    stories: [
      {
        title: '高老庄娶亲',
        content: '猪八戒变成女婿在高老庄生活，贪图安逸，不愿离开。这展示了他贪图享乐、懒惰的一面，但也说明他重视生活品质。',
      },
      {
        title: '偷人参果',
        content: '在人参果园里，猪八戒经不起美食的诱惑，偷吃人参果导致麻烦。这个故事生动地展示了他贪吃、缺乏自制力的特点。',
      },
      {
        title: '八戒浑天河',
        content: '在浑天河中，猪八戒凭借自己的水性优势，成功渡河并保护唐僧安全。这展示了他虽有缺点，但关键时刻也能发挥特长、保护师父。',
      },
      {
        title: '天竺招亲',
        content: '在天竺国，猪八戒受到公主青睐，被选为女婿，最终因为取经任务放弃了这场姻缘。这个故事展示了他对美色的向往，但也表明在关键时刻他能够克制自我欲望。',
      },
      {
        title: '智激美猴王',
        content: '当孙悟空离开师徒团队后，猪八戒想出计策让唐僧假装遇险，借此唤回孙悟空。这展示了他虽然表面鲁莽，但有时也能动脑筋解决问题。',
      },
      {
        title: '黑风山救师',
        content: '在黑风山，猪八戒虽然害怕黑风怪，但仍与孙悟空一起努力救出师父。在危险面前，他虽然胆小，但不会完全退缩，依然愿意尽自己的责任。'
      }
    ],
    needs: ['饮食管理系统', '意志力训练app', '体能提升工具', '任务提醒器']
  },
  {
    id: 'wujing',
    name: '沙僧',
    avatar: '/images/沙僧.jpeg',
    strengths: ['忠诚', '踏实', '有耐心', '做事稳重'],
    weaknesses: ['存在感低', '个性不突出', '缺乏特殊能力', '沟通技巧欠缺'],
    stories: [
      {
        title: '流沙河收服',
        content: '沙僧在流沙河吃唐僧肉的传言，实际上是在等待取经人过河，渴望被救赎。这个故事表明他虽有过错，但内心向善，渴望改变。',
      },
      {
        title: '挑担行李',
        content: '沙僧一路上默默无闻地挑担行李，尽职尽责地完成自己的任务。这反映了他踏实、负责、甘于奉献的特点。',
      },
      {
        title: '沙僧降妖',
        content: '在青牛精作乱时，沙僧虽战斗力不如孙悟空和猪八戒，但仍然坚守职责，保护唐僧周全。这展示了他忠诚可靠的性格特点。',
      },
      {
        title: '守护师父',
        content: '多次当孙悟空和猪八戒外出时，沙僧留下保护唐僧，从不抱怨，始终如一地履行职责。这表明他具有坚定的责任感和耐心。',
      },
      {
        title: '察言观色',
        content: '沙僧常常在孙悟空和猪八戒争吵时充当和事佬，调解矛盾，使团队能够继续前行。这表明他具有一定的情商和团队意识。',
      },
      {
        title: '独守行囊',
        content: '在师徒遇到危险时，沙僧常常被安排看守行李，虽然任务单调，但他从不抱怨。这表明他能够安于本分，踏实可靠。'
      }
    ],
    needs: ['个人形象提升系统', '特殊技能培训程序', '团队定位系统', '沟通辅助工具']
  }
];

// 定义课程阶段
const courseStages = [
  { id: 'character-analysis', title: '人物分析', description: '分析师徒四人的特点、优缺点和需求' },
  { id: 'product-canvas', title: '产品画布', description: '头脑风暴，确定最适合的产品创意' },
  { id: 'flow-chart', title: '流程图', description: '使用Excalidraw绘制产品流程图' },
  { id: 'website-creation', title: '网站制作', description: '构建产品原型网站' }
];

const XiyoujiCourse: React.FC<XiyoujiCourseProps> = ({ onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [aiResponses, setAiResponses] = useState<ChatMessage[]>([
    { role: 'ai' as 'ai', content: `你好！我是你的AI助手，可以帮你思考${selectedCharacter.name}的需求。告诉我你的想法吧！` }
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
  const [characterTraits, setCharacterTraits] = useState<{[key: string]: string[]}>({
    tangseng: [],
    wukong: [],
    bajie: [],
    wujing: []
  });
  
  // 获取分析完成的角色数量
  const getAnalyzedCount = () => {
    return Object.values(analyzedCharacters).filter(Boolean).length;
  };
  
  // 检查是否所有角色都已分析
  const allCharactersAnalyzed = getAnalyzedCount() === 4;
  
  // 选择角色时的处理函数
  const handleSelectCharacter = (character: typeof characters[0]) => {
    setSelectedCharacter(character);
    // 重置需求显示
    setShowNeeds(false);
    setCharacterNeeds([]);
    // 重置聊天消息
    setAiResponses([
      { role: 'ai' as 'ai', content: `你好！我是你的AI助手，可以帮你思考${character.name}的需求。告诉我你的想法吧！` }
    ]);
  };
  
  // 处理聊天消息发送
  const handleSendMessage = (message: string) => {
    // 添加用户消息
    const updatedMessages = [...aiResponses, { role: 'user' as 'user', content: message }];
    
    // 模拟AI回复
    setTimeout(() => {
      let aiResponse = '';
      
      // 根据当前阶段提供不同的回复
      if (currentStage === 0) {
        // 人物分析阶段
        if (message.includes('需求') || message.includes('功能')) {
          aiResponse = `根据${selectedCharacter.name}的性格特点，我认为他需要的软件功能可能包括：
1. ${selectedCharacter.needs[0]}
2. ${selectedCharacter.needs[1]}
3. ${selectedCharacter.needs[2]}

你觉得还有什么其他功能可以帮助他吗？`;
          // 显示需求列表
          setShowNeeds(true);
          setCharacterNeeds(selectedCharacter.needs);
        } else if (message.includes('弱点') || message.includes('缺点')) {
          aiResponse = `${selectedCharacter.name}的主要弱点包括：${selectedCharacter.weaknesses.join('、')}。我们可以设计软件来弥补这些不足，你有什么想法吗？`;
        } else if (message.includes('优点') || message.includes('长处')) {
          aiResponse = `${selectedCharacter.name}的优势包括：${selectedCharacter.strengths.join('、')}。我们可以基于这些优势设计更适合的功能，你觉得可以如何利用这些优势呢？`;
        } else {
          aiResponse = `你提到了关于${selectedCharacter.name}的看法，很有趣！基于他的性格特点，你认为什么样的软件功能可以帮助他解决西天取经路上的问题呢？`;
        }
      } else if (currentStage === 1) {
        // 产品画布阶段
        if (message.toLowerCase().includes('idea') || message.includes('想法') || message.includes('创意')) {
          const newIdea = message.replace(/.*?[:：]/, '').trim();
          if (newIdea) {
            // 添加新创意
            setProductIdeas(prev => [...prev, newIdea]);
            aiResponse = `我已添加你的创意：${newIdea}。还有其他想法吗？或者你可以从已有的创意中选择最有潜力的3个进行深入开发。`;
          } else {
            aiResponse = `请分享一下你的具体创意，比如"创意：一个能够识别妖怪的AR系统"。`;
          }
        } else if (message.toLowerCase().includes('select') || message.includes('选择')) {
          aiResponse = `好的，请从你的创意列表中选择最有潜力的3个。然后我们可以开始填写产品画布。`;
        } else {
          aiResponse = `在这个阶段，我们需要发散思维，提出尽可能多的创意。你可以说"创意：xxx"来添加一个新的产品想法。当你有足够的创意后，可以选择最好的3个进入下一步。`;
        }
      } else if (currentStage === 2) {
        // 流程图阶段
        aiResponse = `在流程图阶段，我们需要绘制产品的使用流程。你可以使用Excalidraw来创建流程图。有什么需要我帮助解释的吗？`;
      } else {
        // 网站制作阶段
        aiResponse = `在网站制作阶段，我们需要根据你的产品创意和流程图设计一个原型网站。你想从哪个方面开始？比如用户界面、功能实现或者技术选择？`;
      }
      
      // 添加AI响应
      setAiResponses([...updatedMessages, { role: 'ai' as 'ai', content: aiResponse }]);
    }, 1000);
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
    // 只有当所有角色都已分析或不在第一阶段时才能进入下一阶段
    if (currentStage === 0 && !allCharactersAnalyzed) {
      return;
    }
    
    if (currentStage < courseStages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  // 处理发现的新特质
  const handleTraitDiscovered = (trait: string) => {
    // 将新特质添加到当前角色
    const characterId = selectedCharacter.id;
    if (!characterTraits[characterId].includes(trait)) {
      const updatedTraits = {...characterTraits};
      updatedTraits[characterId] = [...updatedTraits[characterId], trait];
      setCharacterTraits(updatedTraits);
      
      // 如果角色特质达到至少3个，将该角色标记为已分析
      if (updatedTraits[characterId].length >= 3 && !analyzedCharacters[characterId]) {
        const updatedAnalyzed = {...analyzedCharacters};
        updatedAnalyzed[characterId] = true;
        setAnalyzedCharacters(updatedAnalyzed);
      }
    }
  };

  // 渲染当前阶段内容
  const renderStageContent = () => {
    switch (currentStage) {
      case 0: // 人物分析
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-w-[1200px] mx-auto px-4">
            {/* 左侧区域：人物选择 */}
            <div className="bg-white rounded-xl shadow-sm p-4 h-fit">
              <div className="mb-4 text-indigo-700 flex items-center gap-2 font-medium">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full text-xs">1</span>
                选择人物
              </div>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    avatar={char.avatar}
                    name={char.name}
                    strengths={char.strengths}
                    weaknesses={char.weaknesses}
                    isSelected={selectedCharacter.id === char.id}
                    onClick={() => handleSelectCharacter(char)}
                    isAnalyzed={analyzedCharacters[char.id]}
                    customTraits={characterTraits[char.id]}
                  />
                ))}
              </div>
              
              {/* 分析完成进度 */}
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">分析进度</h4>
                <div className="w-full bg-white rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(getAnalyzedCount() / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-indigo-600 text-center">
                  {getAnalyzedCount()}/4 人物分析完成
                </p>
                {allCharactersAnalyzed && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 text-center">
                    恭喜！你已完成所有人物分析，可以进入下一阶段
                  </div>
                )}
              </div>
            </div>
            
            {/* 中间区域：人物特点和故事 */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-white rounded-t-xl overflow-hidden grid grid-cols-2 p-0">
                  <TabsTrigger value="analysis" className="py-3 rounded-none data-[state=active]:bg-indigo-50">
                    人物特点
                  </TabsTrigger>
                  <TabsTrigger value="story" className="py-3 rounded-none data-[state=active]:bg-indigo-50">
                    相关故事
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="m-0 bg-white rounded-b-xl shadow-sm p-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">{selectedCharacter.name}的特点分析</h3>
                    
                    {/* 显示自定义特质 */}
                    {characterTraits[selectedCharacter.id].length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span> 
                          发现的特质
                        </h4>
                        <ul className="grid grid-cols-2 gap-2">
                          {characterTraits[selectedCharacter.id].map((trait, index) => (
                            <li 
                              key={index}
                              className="bg-blue-50 px-3 py-2 rounded text-sm text-blue-700 flex items-center gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span>
                              {trait}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">+</span> 
                        优点
                      </h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {selectedCharacter.strengths.map((strength, index) => (
                          <li 
                            key={index}
                            className="bg-green-50 px-3 py-2 rounded text-sm text-green-700 flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">+</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">-</span>
                        弱点
                      </h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {selectedCharacter.weaknesses.map((weakness, index) => (
                          <li 
                            key={index}
                            className="bg-red-50 px-3 py-2 rounded text-sm text-red-600 flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">-</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {showNeeds && (
                      <div className="mt-4 animate-fadeIn">
                        <h4 className="text-sm font-medium text-indigo-600 mb-2 flex items-center gap-1">
                          <Sparkles size={16} className="text-indigo-500" />
                          可能的需求
                        </h4>
                        <ul className="space-y-2">
                          {characterNeeds.map((need, index) => (
                            <li 
                              key={index}
                              className="bg-indigo-50 px-3 py-2 rounded text-sm text-indigo-700 flex items-center gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{index + 1}</span>
                              {need}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="story" className="m-0 bg-white rounded-b-xl shadow-sm p-4">
                  <CharacterStoryWithStyle 
                    stories={selectedCharacter.stories} 
                    characterName={selectedCharacter.name}
                    onTraitDiscovered={handleTraitDiscovered}
                  />
                </TabsContent>
              </Tabs>
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
            
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-0 backdrop-blur-sm bg-white/90 mt-4">
              <AIChatBox 
                messages={aiResponses}
                onSendMessage={handleSendMessage}
                aiName="流程图设计助手"
                placeholder="询问AI关于流程图设计的问题..."
              />
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
            
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-0 backdrop-blur-sm bg-white/90 mt-4">
              <AIChatBox 
                messages={aiResponses}
                onSendMessage={handleSendMessage}
                aiName="网站设计助手"
                placeholder="询问AI关于网站设计的问题..."
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-auto">
      <GlobalStyle />
      
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex justify-between items-center py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-indigo-800">西游记PBL项目课程</h1>
              <p className="text-xs text-gray-500">假如你穿越到古代，成为师徒四人的技术负责人</p>
            </div>
          </div>
          
          {/* 课程阶段导航 */}
          <div className="hidden md:flex items-center gap-3">
            {courseStages.map((stage, index) => (
              <div 
                key={stage.id} 
                className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}
              >
                {index > 0 && (
                  <div className="h-0.5 w-8 bg-gray-200 -ml-10"></div>
                )}
                <div className={`flex flex-col items-center`}>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      index === currentStage 
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-700' 
                        : index < currentStage
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-300 bg-gray-100 text-gray-500'
                    } text-xs`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs mt-1 whitespace-nowrap text-gray-600">{stage.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto py-6">
        {renderStageContent()}
      </div>
      
      {/* 底部导航 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevStage}
            disabled={currentStage === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            上一步
          </Button>
          
          <div className="text-sm text-gray-500">
            阶段 {currentStage + 1}/{courseStages.length}: {courseStages[currentStage].title}
          </div>
          
          <Button
            onClick={handleNextStage}
            disabled={currentStage === 0 && !allCharactersAnalyzed}
            className={`flex items-center gap-1 ${
              currentStage === 0 && !allCharactersAnalyzed ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            下一步
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      
      {/* 浮动聊天按钮 */}
      <FloatingChatButton 
        characterName={selectedCharacter.name}
        initialMessages={aiResponses}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default function XiyoujiCourseWithStyle(props: XiyoujiCourseProps) {
  return (
    <XiyoujiCourse {...props} />
  );
} 