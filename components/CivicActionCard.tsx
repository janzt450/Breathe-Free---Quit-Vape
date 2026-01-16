import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckSquare, Copy, Check, PenTool, MapPin, ChevronDown, ChevronUp, Landmark, Heart, Shield, Star, Users, Globe, HandHeart, Share2, Smartphone, Monitor, Code, Download, BookOpen, Phone, MessageCircle, DollarSign, Plus, TrendingDown } from 'lucide-react';

interface CivicActionCardProps {
  onAction: () => void;
  isCompleted: boolean;
  triggerShare?: number;
}

interface LetterTemplate {
  id: string;
  label: string;
  text: string;
}

const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'fiscal_accountability',
    label: 'Focus on Fiscal Accountability',
    text: "Subject: Constituent Request: Fiscal Accountability and Recouping Public Funds from the Tobacco Industry\n\nThe Honorable [Representative Name]\nU.S. House of Representatives\nWashington, DC 20515\n\nDear Representative [Name],\n\nI am writing to you today as a constituent from [City/Town] who is deeply grateful for your continued service to our district. I appreciate your efforts to navigate the complex challenges facing our nation.\n\nI am reaching out to share a specific concern regarding the tobacco industry. While I recognize the complexity of public health policy, I want to be clear: I am not writing to advocate for prohibition or bans. History has shown that bans often drive markets underground without solving the core issue.\n\nInstead, I am urging you to champion legislative mechanisms that force the tobacco industry to internalize the true cost of their products. For too long, the industry has privatized massive profits while socializing the costs of healthcare, addiction treatment, and lost economic productivity onto the American taxpayer.\n\nI respectfully request that you explore and support the following legal and fiscal mechanisms to extract public wealth back from this industry:\n\n1. Modernized Federal Excise Taxes: The federal tobacco tax has not kept pace with inflation or the rising costs of healthcare. I urge you to support legislation that significantly raises the federal excise tax on all tobacco and nicotine products, earmarking this revenue specifically for Medicare and Medicaid solvency.\n\n2. Cost-Recovery Legislation: We need federal statutes that make it easier for the government to recoup direct healthcare costs related to tobacco-induced illnesses. This includes strengthening the ability of federal agencies to pursue litigation against manufacturers for damages incurred by public health systems.\n\n3. Closing Corporate Tax Loopholes: Please support the elimination of any remaining tax subsidies or advertising deductions available to tobacco entities. It is fiscally irresponsible to allow tax breaks for an industry that generates such a high volume of public debt through healthcare expenses.\n\n4. Polluter-Pays Models: Just as environmental polluters face fees for cleanup, tobacco manufacturers should face mandatory \"health impact fees\" based on their market share to fund addiction cessation and prevention programs, relieving that burden from the taxpayer.\n\nThe Political Reality\nVoters right now are looking for tangible public wins. There is a profound appetite for holding powerful corporations accountable, particularly when their business models rely on offloading costs to the public. This is a matter of fiscal responsibility and justice that transcends party lines.\n\nWe need the tobacco industry to pay their fair share for the damage they cause, rather than asking the American family to pick up the tab.\n\nThank you for your time and for considering this perspective. I look forward to hearing your thoughts on how we can better protect our public funds.\n\nSincerely,\n\n[Your Name]\n[Your Address/Contact Info]"
  },
  {
    id: 'health_focus',
    label: 'Focus on Public Health',
    text: "Dear Representative,\n\nI am writing to express my deep concern regarding the proliferation of unregulated disposable vaping devices in our community. These products are often marketed to youth and contain unverified levels of nicotine and heavy metals.\n\nI urge you to support stricter enforcement of existing FDA regulations and to champion legislation that mandates transparency in the supply chain of these imported devices.\n\nSincerely,\n[Your Name]"
  },
  {
    id: 'env_focus',
    label: 'Focus on Environmental Impact',
    text: "Dear Representative,\n\nI am writing to call attention to the environmental disaster caused by single-use vaping devices. Millions of these lithium-ion battery-powered units are discarded weekly, leaching toxic chemicals into our soil and water.\n\nWe need legislation that holds manufacturers accountable for the full lifecycle of their products and bans the sale of disposable electronics that lack a recycling plan.\n\nSincerely,\n[Your Name]"
  }
];

const CHARITIES = [
  {
    id: 'ash',
    name: 'Action on Smoking & Health',
    url: 'https://ash.org/support-our-work/make-a-donation/',
    description: 'ASH takes legal action against the tobacco industry and advocates for policy changes at the global level.',
    impact: 'Fighting the industry in court so you don\'t have to.',
    rating: 'Charity Navigator: 4/4 Stars',
    icon: <Globe size={18} className="text-blue-400" />
  },
  {
    id: 'ala',
    name: 'American Lung Association',
    url: 'https://action.lung.org/site/Donation2?df_id=31271',
    description: 'The leading organization working to save lives by improving lung health and preventing lung disease.',
    impact: 'Funds critical research and cessation programs.',
    rating: 'Charity Navigator: 4/4 Stars',
    icon: <Heart size={18} className="text-rose-400" />
  },
  {
    id: 'cbhe',
    name: 'Center for Black Health & Equity',
    url: 'https://centerforblackhealth.org/support/',
    description: 'Directly counters the tobacco industry\'s predatory targeting of African American communities with menthol products.',
    impact: 'Advocating for social justice and health equity.',
    rating: 'Trusted Community Leader',
    icon: <Users size={18} className="text-amber-400" />
  }
];

const CivicActionCard: React.FC<CivicActionCardProps> = ({ onAction, isCompleted, triggerShare }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'pledge' | 'share' | 'resources'>('contact');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(LETTER_TEMPLATES[0].id);
  const [targetOfficial, setTargetOfficial] = useState<'representative' | 'senator'>('representative');
  const [copied, setCopied] = useState(false);
  const [linkFeedback, setLinkFeedback] = useState(false);

  useEffect(() => {
    if (triggerShare) {
      setIsExpanded(true);
      setActiveTab('share');
    }
  }, [triggerShare]);

  const activeTemplate = LETTER_TEMPLATES.find(t => t.id === selectedTemplateId) || LETTER_TEMPLATES[0];

  const getDisplayText = () => {
      let text = activeTemplate.text;
      if (targetOfficial === 'senator') {
          text = text.replace(/U.S. House of Representatives/g, "U.S. Senate");
          text = text.replace(/Washington, DC 20515/g, "Washington, DC 20510");
          text = text.replace(/Representative/g, "Senator");
      }
      return text;
  };

  const displayText = getDisplayText();

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkClick = () => {
    onAction();
    setLinkFeedback(true);
    setTimeout(() => setLinkFeedback(false), 3000);
  };

  return (
    <div className="w-full bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-800 transition-colors duration-300 relative overflow-hidden group">
      
      <div className="flex justify-between items-start cursor-pointer relative z-10" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-900/20 rounded-xl text-blue-500 shadow-inner">
            <Landmark size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200 group-hover:text-blue-400 transition-colors">Civic Action!</h3>
             <p className="text-xs font-medium text-slate-500">Make Your Voice Heard</p>
          </div>
        </div>
        <button 
           className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-slate-800"
        >
           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 animate-scale-in origin-top relative z-10">
             
             {/* Tab Navigation */}
             <div className="flex p-1 bg-slate-800 rounded-xl mb-6 overflow-x-auto custom-scrollbar gap-1">
                <button 
                  onClick={() => setActiveTab('contact')}
                  className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px] ${activeTab === 'contact' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <PenTool size={14} /> Draft Message
                </button>
                <button 
                  onClick={() => setActiveTab('pledge')}
                  className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px] ${activeTab === 'pledge' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <HandHeart size={14} /> Make a Pledge
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px] ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <BookOpen size={14} /> Resources
                </button>
                <button 
                  onClick={() => setActiveTab('share')}
                  className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px] ${activeTab === 'share' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Share2 size={14} /> Share App
                </button>
             </div>

             {/* TAB 1: DRAFT MESSAGE */}
             {activeTab === 'contact' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                              <PenTool size={16} className="text-slate-400" />
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Template Editor</span>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                              <select 
                                  value={targetOfficial}
                                  onChange={(e) => setTargetOfficial(e.target.value as 'representative' | 'senator')}
                                  className="flex-1 sm:flex-none bg-slate-900 text-xs text-slate-300 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50"
                              >
                                  <option value="representative">Representative</option>
                                  <option value="senator">Senator</option>
                              </select>

                              <select 
                                  value={selectedTemplateId}
                                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                                  className="flex-[2] sm:flex-none bg-slate-900 text-xs text-slate-300 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50 max-w-[150px] sm:max-w-none truncate"
                              >
                                  {LETTER_TEMPLATES.map(t => (
                                      <option key={t.id} value={t.id}>{t.label}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <div className="p-4 space-y-4">
                          <div className="relative">
                              <textarea 
                                  readOnly
                                  value={displayText}
                                  className="w-full h-40 bg-slate-900/50 text-slate-400 text-xs p-3 rounded-xl border border-slate-700/50 resize-none font-mono leading-relaxed focus:outline-none"
                              />
                              <button 
                                  onClick={handleCopy}
                                  className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                      copied 
                                      ? 'bg-emerald-500 text-white shadow-lg' 
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  }`}
                              >
                                  {copied ? <Check size={12} /> : <Copy size={12} />}
                                  {copied ? 'Copied' : 'Copy'}
                              </button>
                          </div>
                      </div>
                  </div>

                  <div>
                      <a 
                          href={targetOfficial === 'representative' 
                              ? "https://www.house.gov/representatives/find-your-representative" 
                              : "https://www.senate.gov/senators/senators-contact.htm"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={handleLinkClick}
                          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 ${
                              linkFeedback
                              ? 'bg-emerald-600 text-white scale-[0.98]'
                              : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]'
                          }`}
                      >
                          {linkFeedback ? (
                              <>Action Taken <CheckSquare size={16} /></>
                          ) : (
                              <>Contact your {targetOfficial === 'representative' ? 'Representative' : 'Senator'} <ExternalLink size={16} /></>
                          )}
                      </a>
                      
                      <div className="flex flex-col items-center mt-4">
                          <a 
                              href="https://tools.usps.com/zip-code-lookup.htm" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wide bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600"
                          >
                              <MapPin size={12} /> Find my ZIP Code
                          </a>
                      </div>
                  </div>
               </div>
             )}

             {/* TAB 2: MAKE A PLEDGE */}
             {activeTab === 'pledge' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="flex gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg h-fit shrink-0 text-blue-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 text-sm mb-1">Offset The Damage</h4>
                                <p className="text-xs leading-relaxed text-slate-400">
                                    The tobacco industry spends over $8 billion annually on marketing. Donating to these highly-rated organizations helps fund the legal, scientific, and social battles necessary to hold them accountable.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {CHARITIES.map((charity) => (
                            <div key={charity.id} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {charity.icon}
                                        <h4 className="font-bold text-slate-200 text-sm">{charity.name}</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                                        {charity.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[9px] font-bold bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Star size={10} className="text-yellow-500" /> {charity.rating}
                                        </span>
                                        <span className="text-[9px] font-bold bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded">
                                            {charity.impact}
                                        </span>
                                    </div>
                                </div>
                                <a 
                                    href={charity.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
                                >
                                    Donate <ExternalLink size={12} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* TAB 3: RESOURCES */}
             {activeTab === 'resources' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 shrink-0 relative">
                            <DollarSign size={20} />
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-slate-900 rounded-full p-[1px]">
                                <Plus size={8} strokeWidth={4} />
                            </div>
                        </div>
                        <div>
                            <h5 className="font-bold text-emerald-400 text-sm mb-1">Financial Assistance Available</h5>
                            <p className="text-xs text-emerald-100/80 leading-relaxed">
                                Many regions have programs that will provide <strong className="text-white">COMPLETELY FREE</strong> assistance in terms of nicotine patches, gum, support, and other methods to help you stop.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <a 
                            href="https://smokefree.gov/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-800/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-blue-400" />
                                    <h5 className="font-bold text-slate-200 text-sm">Smokefree.gov</h5>
                                </div>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                The National Cancer Institute's dedicated website for quitting. Offers quit plans, text message programs, and apps.
                            </p>
                        </a>

                        <a 
                            href="https://www.thetruth.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-800/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={16} className="text-orange-400" />
                                    <h5 className="font-bold text-slate-200 text-sm">Truth Initiative</h5>
                                </div>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Text <strong className="text-orange-400">DITCHVAPE</strong> to <strong className="text-white">88709</strong>. A 24/7 anonymous text message program specifically for quitting vaping.
                            </p>
                        </a>

                        <a 
                            href="https://www.cdc.gov/tobacco/campaign/tips/index.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-800/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-emerald-400" />
                                    <h5 className="font-bold text-slate-200 text-sm">1-800-QUIT-NOW</h5>
                                </div>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                A free telephone portal to a network of state quitlines. Connects you with trained coaches in your area.
                            </p>
                        </a>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <div className="bg-red-950/30 rounded-2xl p-5 border border-red-900/30">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown size={20} className="text-red-500" />
                                <h4 className="font-bold text-slate-200 text-sm">The Economic Toll of Big Tobacco</h4>
                            </div>
                            
                            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                                <p>
                                    The tobacco industry isn't just harming health; they are an economic parasite. They privatize billions in profits while socializing the devastating costs onto the public workforce and healthcare systems.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <strong className="text-red-400 block mb-1">Workforce Drain</strong>
                                        <p className="text-[11px]">Addiction reduces productivity through absenteeism and health complications, weakening the labor force while corporations count their cash.</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <strong className="text-red-400 block mb-1">Healthcare Strain</strong>
                                        <p className="text-[11px]">Taxpayers foot the bill for treating preventable tobacco-induced diseases, diverting critical funds from education and infrastructure.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {/* TAB 4: SHARE APP */}
             {activeTab === 'share' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <h4 className="font-bold text-slate-200 text-sm mb-1">Spread the Word</h4>
                        <p className="text-xs leading-relaxed text-slate-400">
                            Help others break free from nicotine addiction. Share this tool with friends, family, or your community.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-200 text-sm">Web App</h5>
                                    <p className="text-[10px] text-slate-500">Run in browser</p>
                                </div>
                            </div>
                            <button className="mt-auto w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-70">
                                <ExternalLink size={12} /> Coming Soon
                            </button>
                        </div>

                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Monitor size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-200 text-sm">Windows</h5>
                                    <p className="text-[10px] text-slate-500">Desktop Installer (.exe)</p>
                                </div>
                            </div>
                            
                            <div className="mt-auto flex flex-col gap-2">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Download Mirrors</div>
                                <div className="flex flex-wrap gap-2">
                                    <a href="https://mega.nz/folder/0TlDWCgT#M9AJxXJXu6pVBdAglg2y3w" target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors">
                                        Mega.nz
                                    </a>
                                    <a href="https://drive.google.com/drive/folders/1ADD7evG1AGvO-Fd-geApPJzOU4djoDlt?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-900/30 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors">
                                        Google Drive
                                    </a>
                                    <a href="https://www.mediafire.com/folder/941nnkvwms9r2/Breathe_Free_App" target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-400 border border-sky-900/30 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors">
                                        MediaFire
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-200 text-sm">Android</h5>
                                    <p className="text-[10px] text-slate-500">Mobile App (.apk)</p>
                                </div>
                            </div>
                            <button className="mt-auto w-full py-2 bg-slate-700/50 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 opacity-50">
                                Coming Soon
                            </button>
                        </div>

                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                                    <Code size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-200 text-sm">Source Code</h5>
                                    <p className="text-[10px] text-slate-500">GitHub Repository</p>
                                </div>
                            </div>
                            <a 
                                href="https://github.com/janzt450/Breathe-Free---Quit-Vape"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={12} /> View Code
                            </a>
                        </div>
                    </div>
                </div>
             )}

        </div>
      )}
    </div>
  );
};

export default CivicActionCard;