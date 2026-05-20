import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Zap, 
  BarChart3, 
  Target, 
  Smartphone, 
  Handshake, 
  MessageSquare, 
  Save, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Fingerprint,
  Layers,
  Database,
  Briefcase,
  ShoppingBag,
  Users,
  Video,
  Share2,
  ExternalLink,
  Twitter,
  Facebook,
  CreditCard,
  MapPin,
  Linkedin,
  CheckCircle2,
  ChevronRight,
  Clock,
  User,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Instagram,
  Monitor,
  Tablet,
  Globe,
  Download,
  Wand2,
  Palette,
  Plus,
  Trash2,
  Edit2,
  QrCode,
  ShieldCheck,
  Send,
  Phone,
  Mail,
  Navigation
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { supabase, signInWithGoogle, signOut, uploadAvatar } from "./lib/supabase";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { QRCodeCanvas } from "qrcode.react";

// --- Types & Data ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleDbError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('DB Error: ', { error: error instanceof Error ? error.message : String(error), operationType, path });
  throw new Error(error instanceof Error ? error.message : String(error));
}

type UserSegment = 'SERVICE' | 'COMMERCE' | 'CORPORATE' | 'CREATOR';
type AppView = 'LANDING' | 'ONBOARDING' | 'DASHBOARD' | 'PROFILE';

interface OnboardingState {
  step: number;
  handle: string;
  intent: UserSegment;
  primaryLink: string;
  customCTAText?: string;
  customCTAUrl?: string;
  primaryCTAText?: string;
  primaryCTAUrl?: string;
  instagram?: string;
  linkedin?: string;
  plan?: 'FREE' | 'INTERMEDIATE' | 'PRO';
  avatarUrl?: string;
  coverUrl?: string;
  logoUrl?: string;
}

const PLANS = {
  FREE: { name: 'Starter', monthly: '₦0', yearly: '₦0', color: 'text-white/40' },
  PRO: { name: 'Professional', monthly: '₦3,000', yearly: '₦30,000', color: 'text-brand-primary' },
  BUSINESS: { name: 'Business', monthly: '₦4,500', yearly: '₦45,000', color: 'text-emerald-400' }
};

const DASHBOARD_CHART_DATA = [
  { day: 'Mon', views: 0, actions: 0, cvr: 0 },
  { day: 'Tue', views: 0, actions: 0, cvr: 0 },
  { day: 'Wed', views: 0, actions: 0, cvr: 0 },
  { day: 'Thu', views: 0, actions: 0, cvr: 0 },
  { day: 'Fri', views: 0, actions: 0, cvr: 0 },
  { day: 'Sat', views: 0, actions: 0, cvr: 0 },
  { day: 'Sun', views: 0, actions: 0, cvr: 0 },
];

const TRAFFIC_SOURCES_DATA: any[] = [];

const DEVICE_DISTRIBUTION: any[] = [];

const THEMES: Record<string, { bg: string; card: string; text: string; primary: string; border: string }> = {
  DARK: { bg: 'bg-[#0D0D0D]', card: 'bg-white/5', text: 'text-white', primary: 'text-brand-primary', border: 'border-white/10' },
  LIGHT: { bg: 'bg-zinc-50', card: 'bg-white', text: 'text-zinc-900', primary: 'text-brand-primary', border: 'border-zinc-200' },
  BRAND: { bg: 'bg-brand-primary/10', card: 'bg-dark-elevated', text: 'text-white', primary: 'text-brand-primary', border: 'border-brand-primary/20' },
  MINIMAL: { bg: 'bg-white', card: 'bg-white', text: 'text-zinc-900', primary: 'text-zinc-900', border: 'border-zinc-900/10' }
};

const LEAD_VAULT: any[] = [];

// --- Footer Component ---

const Footer = () => (
  <footer className="bg-dark-elevated border-t border-white/5 pt-20 pb-10 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
            <span className="text-xl font-bold tracking-tighter text-white uppercase italic">KONNEKT.NG</span>
          </div>
          <p className="text-white/40 text-sm max-w-xs mb-8 font-medium leading-relaxed">
            The Digital Headquarters for High-Intent Creators. We bridge the gap between physical connections and digital conversion.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com/konnekt.nigeria" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-brand-primary/20 hover:border-brand-primary/30 border border-transparent transition-all cursor-pointer"><Instagram className="w-4 h-4" /></a>
            <a href="https://linkedin.com/company/konnekt-nigeria" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-brand-primary/20 hover:border-brand-primary/30 border border-transparent transition-all cursor-pointer"><Linkedin className="w-4 h-4" /></a>
            <a href="https://twitter.com/konnekt_ng" target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-brand-primary/20 hover:border-brand-primary/30 border border-transparent transition-all cursor-pointer"><Twitter className="w-4 h-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-[10px] tracking-widest opacity-40">Ecosystem</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li className="hover:text-brand-primary cursor-pointer transition-colors flex items-center gap-2">Digital Profiles <ExternalLink className="w-3 h-3" /></li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors flex items-center gap-2">NFC Smart Cards <Zap className="w-3 h-3 fill-brand-primary text-brand-primary" /></li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Enterprise API</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Affiliate Portal</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6 uppercase text-[10px] tracking-widest opacity-40">Company</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Our Manifesto</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Media Kit</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Privacy Shield</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Terms of Op</li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
        <div>© 2026 Konnekt.ng — Built for the 1%</div>
        <div className="flex gap-8">
          <span className="hover:text-white cursor-pointer transition-colors">Security Protocol</span>
          <span className="hover:text-white cursor-pointer transition-colors">Lagos, Nigeria</span>
        </div>
      </div>
    </div>
  </footer>
);

const SEGMENTS: Record<UserSegment, { title: string; intentAction: string; icon: any; color: string; primaryCTA: string }> = {
  SERVICE: { 
    title: "Service Professional", 
    intentAction: "Get Bookings",
    icon: Briefcase, 
    color: "blue",
    primaryCTA: "Book Appointment"
  },
  COMMERCE: { 
    title: "Commerce Vendor", 
    intentAction: "Get WhatsApp Leads",
    icon: ShoppingBag, 
    color: "emerald",
    primaryCTA: "Order on WhatsApp"
  },
  CORPORATE: { 
    title: "Corporate Networker", 
    intentAction: "Share Contact Details",
    icon: Users, 
    color: "purple",
    primaryCTA: "Save Contact"
  },
  CREATOR: { 
    title: "Digital Creator", 
    intentAction: "Monetize Attention",
    icon: Video, 
    color: "orange",
    primaryCTA: "Get Exclusive Access"
  }
};

// --- Framer Motion Variants ---

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Mobile Profile Component (Section 4) ---

const getVisitorMetadata = () => {
  let visitorId = localStorage.getItem('konnekt_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('konnekt_visitor_id', visitorId);
  }
  const userAgent = navigator.userAgent;
  let deviceType = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) deviceType = 'Tablet';
  else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(userAgent)) deviceType = 'Mobile';

  const urlParams = new URLSearchParams(window.location.search);
  let source = urlParams.get('utm_source') || urlParams.get('source') || 'Direct';
  
  if (source === 'Direct' && document.referrer) {
    if (document.referrer.includes('instagram.com')) source = 'Instagram';
    else if (document.referrer.includes('linkedin.com')) source = 'LinkedIn';
    else if (document.referrer.includes('facebook.com')) source = 'Facebook';
    else if (document.referrer.includes('t.co') || document.referrer.includes('twitter.com')) source = 'Twitter';
    else if (document.referrer.includes('google.com')) source = 'Search';
    else source = 'Referral';
  }

  return { deviceType, source };
};

const getLinkIcon = (url: string) => {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('instagram.com')) return Instagram;
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return Twitter;
  if (lowercaseUrl.includes('linkedin.com')) return Linkedin;
  if (lowercaseUrl.includes('facebook.com')) return Facebook;
  if (lowercaseUrl.includes('wa.me') || lowercaseUrl.includes('whatsapp.com')) return Send;
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return Video;
  if (lowercaseUrl.includes('mailto:')) return Mail;
  if (lowercaseUrl.includes('tel:')) return Phone;
  return ExternalLink;
};

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5 cursor-help">
    <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-white transition-all">?</div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-900 border border-white/10 rounded-xl text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
    </div>
  </div>
);

const EmailSignature = ({ profile }: { profile: any }) => {
  const [copied, setCopied] = useState(false);
  const signatureRef = React.useRef<HTMLDivElement>(null);

  const copyToClipboard = () => {
    if (signatureRef.current) {
      const range = document.createRange();
      range.selectNode(signatureRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
       <div className="p-8 bg-white text-black rounded-2xl shadow-sm border border-zinc-100 font-sans max-w-fit" ref={signatureRef}>
          <table cellPadding="0" cellSpacing="0" style={{ fontFamily: 'Inter, sans-serif' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', paddingRight: '20px' }}>
                  <img 
                    src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100'} 
                    width="64" 
                    height="64" 
                    style={{ borderRadius: '16px', objectFit: 'cover', display: 'block' }} 
                    alt="Profile"
                  />
                </td>
                <td style={{ verticalAlign: 'top', borderLeft: '1px solid #f0f0f0', paddingLeft: '20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#000', marginBottom: '2px' }}>{profile?.displayName || 'Your Name'}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile?.title || 'Professional Title'}</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <a href={`${window.location.origin}/${profile?.handle}`} style={{ fontSize: '11px', color: '#D40026', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View Digital Ops</a>
                    <span style={{ color: '#eee', fontSize: '11px' }}>|</span>
                    <span style={{ fontSize: '11px', color: '#999', fontWeight: 600 }}>Powered by Konnekt</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
       </div>
       <div className="flex items-center gap-4">
          <button 
            onClick={copyToClipboard}
            className={`flex-1 py-4 ${copied ? 'bg-emerald-500' : 'bg-brand-primary'} text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95`}
          >
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            {copied ? 'Signature Copied' : 'Copy Signature to Clipboard'}
          </button>
       </div>
       <p className="text-[10px] text-zinc-500 font-medium">Paste this into your email signature settings (Gmail, Outlook, etc.) for a professional conversion bridge.</p>
    </div>
  );
};

const MobileProfile = ({ 
  segment, 
  handle, 
  isPreview = false, 
  profileData = null, 
  links = [],
  currentUserId = null,
  onWhatsappClick,
  onVcardClick,
  onQrClick,
  onShareClick,
  onDashboardClick
}: { 
  segment: UserSegment, 
  handle: string, 
  isPreview?: boolean, 
  profileData?: any, 
  links?: any[],
  currentUserId?: string | null,
  onWhatsappClick?: () => void,
  onVcardClick?: () => void,
  onQrClick?: () => void,
  onShareClick?: () => void,
  onDashboardClick?: () => void
}) => {
  const config = SEGMENTS[segment];
  const currentHandle = profileData?.handle || handle || 'yourname';
  const currentIntent = profileData?.intent || segment;
  const theme = THEMES[profileData?.theme || 'DARK'];
  const userPlan = profileData?.plan || 'FREE';

  const logEngagement = async (target: string) => {
    if (isPreview) return;
    try {
      const meta = getVisitorMetadata();
      await supabase.from('analytics').insert({
        user_id: profileData?.owner_id || null,
        profile_handle: currentHandle,
        event_type: target.startsWith('link_') ? `link_:${target.split('_')[1]}` : target,
        source: meta.source,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Engagement logging failed", e);
    }
  };

  const isVideoCover = profileData?.coverUrl?.match(/\.(mp4|webm|ogg)$/) || profileData?.coverUrl?.includes('video');

  return (
    <div className={`
      w-full max-w-[340px] mx-auto ${theme.bg} rounded-[2.5rem] border-[8px] ${theme.border} 
      shadow-2xl relative overflow-hidden flex flex-col font-sans h-[700px]
      ${isPreview ? 'scale-90 md:scale-100 origin-top' : ''}
    `}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Header/Cover Area */}
        <div className="relative h-48 bg-zinc-900 overflow-hidden">
           <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-10" />
           
           {/* Edit Profile Button (Owner Only) */}
           {!isPreview && profileData?.owner_id === currentUserId && (
             <button 
               onClick={onDashboardClick}
               className="absolute top-6 right-6 z-30 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-primary transition-all active:scale-95"
             >
                <Edit2 className="w-3 h-3" /> Edit Profile
             </button>
           )}
           
           {profileData?.coverUrl ? (
             isVideoCover ? (
               <video 
                 src={profileData.coverUrl} 
                 autoPlay 
                 muted 
                 loop 
                 playsInline 
                 className="absolute inset-0 w-full h-full object-cover opacity-60"
               />
             ) : (
               <img 
                 src={profileData.coverUrl} 
                 className="absolute inset-0 w-full h-full object-cover opacity-60"
                 referrerPolicy="no-referrer"
               />
             )
           ) : (
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
           )}
           
           {/* Profile & Logo Layout */}
           <div className={`absolute -bottom-12 left-0 right-0 px-6 flex items-end ${userPlan !== 'FREE' ? 'justify-between' : 'justify-center'} z-20`}>
              <div className="relative">
                 <div className={`
                  ${userPlan === 'FREE' ? 'w-24 h-24' : 'w-28 h-28'} 
                  rounded-full border-4 border-[#0D0D0D] bg-zinc-800 overflow-hidden shadow-2xl
                 `}>
                    {profileData?.avatarUrl ? (
                      <img src={profileData.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white opacity-20" />
                      </div>
                    )}
                 </div>
              </div>

              {userPlan !== 'FREE' && profileData?.logoUrl && (
                <div className="w-[82px] h-[82px] rounded-2xl border-4 border-[#0D0D0D] bg-zinc-900 overflow-hidden shadow-xl mb-2">
                   <img src={profileData.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
           </div>
        </div>

        {/* Identity & Bio */}
        <div className="mt-16 px-6 text-center">
           <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {profileData?.displayName || `@${currentHandle}`}
              <CheckCircle2 className="w-5 h-5 text-brand-primary" />
           </h2>
           <p className="text-zinc-500 font-medium text-xs mt-1">{profileData?.title || 'Professional Creator'}</p>
           
           {profileData?.bio && (
             <p className="text-zinc-400 text-[11px] leading-relaxed mt-4 px-2">
                {profileData.bio}
             </p>
           )}

           {/* Quick Action Pills */}
           <div className="flex items-center justify-center gap-3 mt-8">
              {[
                { icon: Phone, label: 'Call', action: 'call', href: profileData?.phone ? `tel:${profileData.phone}` : undefined },
                { icon: Mail, label: 'Email', action: 'email', href: profileData?.email ? `mailto:${profileData.email}` : undefined },
                { icon: Send, label: 'Chat', action: 'chat', href: profileData?.phone ? `https://wa.me/${profileData.phone}` : undefined },
                { icon: Instagram, label: 'Social', action: 'social', href: profileData?.instagram ? `https://instagram.com/${profileData.instagram}` : undefined }
              ].map((item) => (
                <button 
                  key={item.action}
                  onClick={() => {
                    logEngagement(item.action);
                    if (item.href) window.open(item.href, '_blank');
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                >
                   <item.icon className="w-4 h-4" />
                </button>
              ))}
           </div>
        </div>

        {/* Location Card */}
        <div className="px-6 mt-10">
           <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                 <Navigation className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-left">
                 <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Location</h4>
                 <p className="text-xs font-bold text-white/80">{profileData?.location || 'Lagos, Nigeria'}</p>
              </div>
           </div>
        </div>

        {/* Social Links Section */}
        {(profileData?.instagram || profileData?.linkedin || profileData?.phone) && (
          <div className="px-6 mt-12">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Social Links</h3>
                <div className="h-px bg-white/5 flex-1 ml-4" />
             </div>
             
             <div className="space-y-3">
                {profileData?.instagram && (
                  <a href={`https://instagram.com/${profileData.instagram}`} target="_blank" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-[#E1306C]/10 flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-[#E1306C]" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-white">Instagram</p>
                        <p className="text-[10px] text-zinc-500">@{profileData.instagram}</p>
                     </div>
                     <ArrowRight className="w-4 h-4 text-white/10" />
                  </a>
                )}
                {profileData?.linkedin && (
                  <a href={`https://linkedin.com/in/${profileData.linkedin}`} target="_blank" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-white">LinkedIn</p>
                        <p className="text-[10px] text-zinc-500">{profileData.displayName}</p>
                     </div>
                     <ArrowRight className="w-4 h-4 text-white/10" />
                  </a>
                )}
                {profileData?.phone && (
                  <a href={`https://wa.me/${profileData.phone}`} target="_blank" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                        <Send className="w-5 h-5 text-[#25D366]" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-white">WhatsApp</p>
                        <p className="text-[10px] text-zinc-500">{profileData.phone}</p>
                     </div>
                     <ArrowRight className="w-4 h-4 text-white/10" />
                  </a>
                )}
             </div>
          </div>
        )}

        {/* Custom CTA Section */}
        {profileData?.customCTAUrl && profileData?.customCTAText && (
          <div className="px-6 mt-10">
             <button 
               onClick={() => {
                 logEngagement('custom_cta');
                 window.open(profileData.customCTAUrl.startsWith('http') ? profileData.customCTAUrl : `https://${profileData.customCTAUrl}`, '_blank');
               }}
               className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 hover:bg-white/10 transition-colors group"
             >
                <span className="text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{profileData.customCTAText}</span>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
             </button>
          </div>
        )}

        {/* Dynamic Links Section */}
        <div className="px-6 mt-12">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Digital Hub</h3>
              <div className="h-px bg-white/5 flex-1 ml-4" />
           </div>
           
           <div className="space-y-3">
              {links.map((link, i) => (
                <motion.a
                  key={link.id}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                   target="_blank"
                   onClick={() => logEngagement(`link_${link.id}`)}
                   className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                >
                   <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                      {(() => {
                        const Icon = getLinkIcon(link.url);
                        return <Icon className="w-4 h-4 text-white/40 group-hover:text-brand-primary transition-colors" />;
                      })()}
                   </div>
                   <div className="flex-1 text-left overflow-hidden">
                      <h4 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors truncate">{link.title}</h4>
                      <p className="text-[10px] text-white/20 font-mono truncate">{link.url.replace(/^https?:\/\//, '')}</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
                </motion.a>
              ))}
           </div>
        </div>

        {/* Primary Goal Section */}
        <div className="px-6 mt-12 mb-20 text-center">
            <button 
              onClick={() => {
                logEngagement('primary_cta');
                if (profileData?.primaryCTAUrl) {
                  window.open(profileData.primaryCTAUrl.startsWith('http') ? profileData.primaryCTAUrl : `https://${profileData.primaryCTAUrl}`, '_blank');
                }
              }}
              className="w-full py-5 rounded-2xl bg-brand-primary text-white font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
               {profileData?.primaryCTAText || SEGMENTS[currentIntent as UserSegment].primaryCTA}
            </button>
            <div className="mt-8 flex items-center justify-center gap-2 grayscale opacity-20">
               <Zap className="w-3 h-3 text-white fill-white" />
               <span className="text-[10px] font-black tracking-[0.3em] font-mono uppercase text-white">Powering Connectivity</span>
            </div>
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      {!isPreview && (
        <div className="absolute bottom-6 inset-x-6 h-16 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-around px-2 z-50 shadow-2xl">
           <button 
             onClick={onDashboardClick}
             className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
           >
              <User className="w-5 h-5 pointer-events-none" />
           </button>
           <button 
             onClick={onWhatsappClick}
             className="w-12 h-12 rounded-full text-white/40 hover:text-brand-primary hover:bg-white/5 flex items-center justify-center transition-all"
           >
              <Send className="w-5 h-5" />
           </button>
           <button 
             onClick={onVcardClick}
             className="w-12 h-12 rounded-full text-white/40 hover:text-blue-400 hover:bg-white/5 flex items-center justify-center transition-all"
           >
              <Download className="w-5 h-5" />
           </button>
           <button 
             onClick={onQrClick}
             className="w-12 h-12 rounded-full text-white/40 hover:text-emerald-400 hover:bg-white/5 flex items-center justify-center transition-all"
           >
              <QrCode className="w-5 h-5" />
           </button>
           <button 
             onClick={onShareClick}
             className="w-12 h-12 rounded-full text-white/40 hover:text-purple-400 hover:bg-white/5 flex items-center justify-center transition-all"
           >
              <Share2 className="w-5 h-5" />
           </button>
        </div>
      )}
    </div>
  );
};

// --- Sortable Link Item ---
const SortableLinkItem = ({ link, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-brand-primary/30 transition-colors"
    >
      <div className="flex items-center gap-4">
         <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/40 transition-colors">
            <Menu className="w-4 h-4" />
         </div>
         <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            {(() => {
               const Icon = getLinkIcon(link.url);
               return <Icon className="w-4 h-4 text-brand-primary" />;
            })()}
         </div>
         <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">{link.title}</h4>
              <span className="text-[8px] font-mono uppercase tracking-widest text-white/20 px-1.5 py-0.5 rounded border border-white/5">{link.type || 'custom'}</span>
            </div>
            <p className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">{link.url}</p>
         </div>
      </div>
      <div className="flex items-center gap-2">
         <button 
           onClick={() => onEdit(link)}
           className="p-2 text-white/20 hover:text-brand-primary transition-colors"
         >
            <Edit2 className="w-4 h-4" />
         </button>
         <button 
           onClick={() => onDelete(link.id)}
           className="p-2 text-white/20 hover:text-red-500 transition-colors"
         >
            <Trash2 className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [view, setView] = useState<AppView>('LANDING');
  const [activeTab, setActiveTab] = useState('The Pulse');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [publicLinks, setPublicLinks] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>(LEAD_VAULT);
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    step: 1,
    handle: '',
    intent: 'SERVICE',
    primaryLink: '',
    customCTAText: '',
    customCTAUrl: ''
  });

  const [dateRange, setDateRange] = useState('30D');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isVcardModalOpen, setIsVcardModalOpen] = useState(false);
  const [visitorWaNumber, setVisitorWaNumber] = useState('');

  // Security & Billing State
  const [subscription, setSubscription] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [is2faChallengeOpen, setIs2faChallengeOpen] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [pendingUser, setPendingUser] = useState<any | null>(null);

  const generateVCard = (lProfile: any) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${lProfile.displayName || lProfile.handle}
N:;${lProfile.displayName || lProfile.handle};;;
TEL;TYPE=CELL:${lProfile.phone || ''}
EMAIL;TYPE=INTERNET:${lProfile.email || ''}
URL:${window.location.origin}/${lProfile.handle}
END:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lProfile.handle}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${publicProfile?.handle || profile?.handle}`;
    const shareData = {
      title: (publicProfile || profile)?.displayName || 'Digital Profile',
      text: `Check out my digital profile!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        // Log engagement if it's a public view
        if (publicProfile) {
          try {
            await supabase.from('analytics').insert({
              user_id: publicProfile.owner_id,
              profile_handle: publicProfile.handle,
              event_type: 'share_native',
              source: getVisitorMetadata().source,
              created_at: new Date().toISOString()
            });
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleVisitorWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorWaNumber || !profile?.id) return;
    
    // Log lead
    try {
      await supabase.from('analytics').insert({
        user_id: profile.owner_id,
        profile_handle: profile.handle,
        event_type: 'whatsapp_lead',
        source: 'direct',
        created_at: new Date().toISOString()
      });
      
      // Open whatsapp with a pre-filled message from the visitor's side
      const message = `Hi, I just viewed your profile @${profile.handle} and would like to connect!`;
      window.open(`https://wa.me/${profile.phone || ''}?text=${encodeURIComponent(message)}`, '_blank');
      
      setVisitorWaNumber('');
      setIsWhatsappModalOpen(false);
    } catch (err) {
      console.error("Failed to save lead", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !profile?.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);

    const newLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(newLinks);

    try {
      await Promise.all(
        newLinks.map((link: any, idx: number) =>
          supabase.from('links').update({ order: idx }).eq('id', link.id)
        )
      );
    } catch (e) {
      console.error("Failed to update links order", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    // Initial fetch
    supabase.from('analytics').select('*').eq('user_id', user.id).limit(500)
      .then(({ data }) => { if (data) setAnalyticsData(data); });
    // Realtime
    const channel = supabase.channel('analytics_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics', filter: `user_id=eq.${user.id}` },
        () => {
          supabase.from('analytics').select('*').eq('user_id', user.id).limit(500)
            .then(({ data }) => { if (data) setAnalyticsData(data); });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('links').select('*').eq('profile_id', profile.id).order('order', { ascending: true })
      .then(({ data }) => { if (data) setLinks(data); });
    const channel = supabase.channel('links_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'links', filter: `profile_id=eq.${profile.id}` },
        () => {
          supabase.from('links').select('*').eq('profile_id', profile.id).order('order', { ascending: true })
            .then(({ data }) => { if (data) setLinks(data); });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    if (!publicProfile?.id) return;
    supabase.from('links').select('*').eq('profile_id', publicProfile.id).order('order', { ascending: true })
      .then(({ data }) => { if (data) setPublicLinks(data); });
    const channel = supabase.channel('public_links_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'links', filter: `profile_id=eq.${publicProfile.id}` },
        () => {
          supabase.from('links').select('*').eq('profile_id', publicProfile.id).order('order', { ascending: true })
            .then(({ data }) => { if (data) setPublicLinks(data); });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [publicProfile?.id]);

  const handleGenerateBio = async () => {
    if (!profile?.intent) {
      alert("Please select an intent first.");
      return;
    }
    setIsAiLoading(true);
    try {
      const segmentData = SEGMENTS[profile.intent as UserSegment];
      const response = await fetch("/api/gemini/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          industry: segmentData.title, 
          intent: segmentData.intentAction 
        }),
      });
      const data = await response.json();
      if (data.bio) {
        setProfile({ ...profile, bio: data.bio });
      }
    } catch (error) {
      console.error("Bio gen error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const isPro = (p: any) => p?.plan === 'PRO' || p?.handle === 'okai';
  const isValidUrl = (url: string) => {
    try { 
      const u = url.startsWith('http') ? url : `https://${url}`;
      new URL(u); 
      return true; 
    } catch { 
      return false; 
    }
  };

  const handleStart2faSetup = async () => {
    if (!user) return;
    try {
      setIsAiLoading(true);
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      setTwoFactorSetup(data);
      setIs2faModalOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!user || !twoFactorToken) return;
    try {
      setIsAiLoading(true);
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, token: twoFactorToken })
      });
      const data = await res.json();
      if (data.success) {
        setIs2faModalOpen(false);
        setTwoFactorToken("");
        alert("2FA Enabled successfully!");
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVerifyChallenge = async () => {
    if (!pendingUser || !challengeToken) return;
    try {
      setIsAiLoading(true);
      const res = await fetch("/api/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUser.id, token: challengeToken })
      });
      const data = await res.json();
      if (data.success) {
        setUser(pendingUser);
        setPendingUser(null);
        setIs2faChallengeOpen(false);
        setChallengeToken("");
      } else {
        alert("Invalid 2FA token");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateCheckout = async (planId: string) => {
    if (!user) return;
    try {
      setIsAiLoading(true);
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, planId, userEmail: user.email })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !editingLink?.title || !editingLink?.url) return;

    try {
      if (editingLink.id) {
        await supabase.from('links').update({
          title: editingLink.title,
          url: editingLink.url,
          type: editingLink.type || 'custom',
          order: editingLink.order ?? links.length
        }).eq('id', editingLink.id);
      } else {
        await supabase.from('links').insert({
          profile_id: profile.id,
          title: editingLink.title,
          url: editingLink.url,
          type: editingLink.type || 'custom',
          order: links.length
        });
      }
      setIsLinkModalOpen(false);
      setEditingLink(null);
    } catch (e) {
      handleDbError(e, OperationType.WRITE, `links`);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!profile?.id) return;
    try {
      await supabase.from('links').delete().eq('id', linkId);
    } catch (e) {
      handleDbError(e, OperationType.DELETE, `links/${linkId}`);
    }
  };

  const stats = useMemo(() => {
    if (analyticsData.length === 0) return null;

    const views = analyticsData.filter(d => d.type === 'view');
    const actions = analyticsData.filter(d => d.type === 'action').length;
    const totalViews = views.length;
    const uniqueViews = new Set(views.map(v => v.visitorId)).size;
    const cvr = totalViews > 0 ? ((actions / totalViews) * 100).toFixed(1) : 0;

    // Traffic Sources
    const sourcesMap: any = {};
    analyticsData.forEach(d => {
      const s = d.source || 'Direct';
      sourcesMap[s] = (sourcesMap[s] || 0) + 1;
    });
    const trafficSources = Object.keys(sourcesMap).map(name => ({
      name,
      value: Math.round((sourcesMap[name] / analyticsData.length) * 100),
      color: name === 'Direct' ? '#3B82F6' : (name === 'Instagram' ? '#E1306C' : (name === 'LinkedIn' ? '#0A66C2' : (name === 'Facebook' ? '#1877F2' : (name === 'Twitter' ? '#1DA1F2' : 'rgba(255,255,255,0.1)'))))
    })).sort((a, b) => b.value - a.value);

    // Device Distribution
    const deviceMap: any = {};
    const withDevice = analyticsData.filter(d => d.deviceType);
    withDevice.forEach(d => {
      deviceMap[d.deviceType] = (deviceMap[d.deviceType] || 0) + 1;
    });
    const deviceDist = Object.keys(deviceMap).map(name => ({
      name,
      value: Math.round((deviceMap[name] / withDevice.length) * 100),
      icon: name === 'Mobile' ? Smartphone : (name === 'Desktop' ? Monitor : Tablet)
    }));

    // Funnel
    // views -> any action -> high intent action (primary_cta/payment)
    const viewCount = views;
    const anyActionCount = actions;
    const highIntentCount = analyticsData.filter(d => d.type === 'action' && (d.target === 'primary_cta' || d.target === 'payment')).length;

    const funnel = [
      { label: 'Total Views', value: totalViews, percentage: 100 },
      { label: 'Engagement', value: anyActionCount, percentage: totalViews > 0 ? (anyActionCount / totalViews) * 100 : 0, color: 'bg-brand-primary/40' },
      { label: 'Conversions', value: highIntentCount, percentage: totalViews > 0 ? (highIntentCount / totalViews) * 100 : 0, color: 'bg-brand-primary' },
    ];

    return { 
      totalViews: totalViews.toLocaleString(), 
      uniqueViews: uniqueViews.toLocaleString(),
      totalActions: anyActionCount.toLocaleString(), 
      cvr: cvr + '%',
      trafficSources,
      deviceDist,
      funnel
    };
  }, [analyticsData]);

  const dynamicLeads = useMemo(() => {
    const inquiryActions = analyticsData.filter(d => d.type === 'action' && d.target === 'inquiry');
    if (inquiryActions.length === 0) return LEAD_VAULT;
    
    return inquiryActions.map(d => ({
      id: d.id,
      name: 'Visitor from ' + (d.source || 'Direct'),
      intent: 'Inquiry Signal',
      date: d.timestamp ? (d.timestamp.toDate ? d.timestamp.toDate().toLocaleTimeString() : new Date(d.timestamp.seconds * 1000).toLocaleTimeString()) : 'Just now',
      status: 'Active',
    })).slice(0, 10);
  }, [analyticsData]);

  const dynamicChartData = useMemo(() => {
    if (analyticsData.length === 0) return DASHBOARD_CHART_DATA;
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      const dayData = analyticsData.filter(d => {
        if (!d.timestamp) return false;
        const date = d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp.seconds * 1000);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        return dayName === day;
      });
      const v = dayData.filter(d => d.type === 'view').length;
      const a = dayData.filter(d => d.type === 'action').length;
      return {
        day,
        views: v,
        actions: a,
        cvr: v > 0 ? (a / v) * 100 : 0
      };
    });
  }, [analyticsData]);

  useEffect(() => {
    const initApp = async () => {
      const path = window.location.pathname.split('/').filter(Boolean);
      if (path.length === 1) {
        if (path[0] === 'dashboard') {
          setView('DASHBOARD');
        } else if (path[0] === 'onboarding') {
          setView('ONBOARDING');
        } else {
          const handle = path[0];
          try {
            const { data } = await supabase.from('profiles').select('*').eq('handle', handle).single();
            if (data) {
              setPublicProfile(data);
              setView('PROFILE');
              try {
                const meta = getVisitorMetadata();
                await supabase.from('analytics').insert({
                  user_id: data.owner_id,
                  profile_handle: data.handle,
                  event_type: 'profile_view',
                  source: meta.source,
                  created_at: new Date().toISOString()
                });
              } catch (err) {
                console.warn("Silent analytics fail", err);
              }
            }
          } catch (e) {
            handleDbError(e, OperationType.LIST, "profiles");
          }
        }
      }

      // Supabase auth state listener
      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        const u = session?.user ?? null;
        if (u) {
          try {
            // Check for 2FA
            const { data: secData } = await supabase.from('security').select('enabled, secret').eq('user_id', u.id).single();
            if (secData?.enabled) {
              setPendingUser(u);
              setIs2faChallengeOpen(true);
              setUser(null);
            } else {
              setUser(u);
            }

            const { data: profileData } = await supabase.from('profiles').select('*').eq('owner_id', u.id).single();
            if (profileData) {
              setProfile({ id: profileData.id, ...profileData });
              if (window.location.pathname === '/onboarding') setView('DASHBOARD');
            }
          } catch (e) {
            handleDbError(e, OperationType.LIST, "profiles");
          }
        } else {
          setUser(null);
          setProfile(null);
          setSubscription(null);
          setSecurity(null);
        }
        setLoading(false);
      });

      return () => authSub.unsubscribe();
    };

    initApp();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Fetch billing and security
    supabase.from('billing').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setSubscription(data); });
    supabase.from('security').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setSecurity(data); });

    // Realtime billing
    const billingChannel = supabase.channel('billing_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing', filter: `user_id=eq.${user.id}` },
        (payload) => { if (payload.new) setSubscription(payload.new); }
      ).subscribe();

    // Realtime security
    const secChannel = supabase.channel('security_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security', filter: `user_id=eq.${user.id}` },
        (payload) => { if (payload.new) setSecurity(payload.new); }
      ).subscribe();

    return () => {
      supabase.removeChannel(billingChannel);
      supabase.removeChannel(secChannel);
    };
  }, [user]);

  useEffect(() => {
    if (view === 'PROFILE' && publicProfile) {
      document.title = `${publicProfile.displayName || publicProfile.handle} | Konnekt`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', publicProfile.bio || `Check out ${publicProfile.displayName}'s digital business profile on Konnekt.`);
      }
    } else {
      document.title = 'Konnekt | The Business Conversion OS';
    }
  }, [view, publicProfile]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) {
      await handleLogin();
      return; // Wait for auth state change
    }

    const profileData = {
      handle: onboarding.handle,
      intent: onboarding.intent,
      primary_link: onboarding.primaryLink,
      custom_cta_text: onboarding.customCTAText,
      custom_cta_url: onboarding.customCTAUrl,
      owner_id: user.id,
      display_name: user.user_metadata?.full_name || onboarding.handle,
      created_at: new Date().toISOString(),
    };

    try {
      const btn = document.getElementById('gen-btn');
      if (btn) btn.innerHTML = 'Provisioning...';
      const { data, error } = await supabase.from('profiles').insert(profileData).select().single();
      if (error) throw error;
      setProfile({ id: data.id, ...data });
      setTimeout(() => setOnboarding(prev => ({...prev, step: 4})), 1200);
    } catch (e) {
      handleDbError(e, OperationType.WRITE, `profiles`);
    }
  };

  const ModalRegistry = () => (
    <AnimatePresence>
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLinkModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-surface border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black">{editingLink?.id ? 'Edit' : 'Add'} Link</h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveLink} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Display Title</label>
                <input type="text" required value={editingLink?.title || ''} onChange={(e) => setEditingLink({...editingLink, title: e.target.value})} placeholder="e.g. My Portfolio" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-brand-primary outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Destination URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text" 
                    required 
                    value={editingLink?.url || ''} 
                    onChange={(e) => setEditingLink({...editingLink, url: e.target.value})} 
                    placeholder="e.g. yoursite.com" 
                    className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-4 text-sm focus:border-brand-primary outline-none transition-colors ${editingLink?.url && !isValidUrl(editingLink.url) ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`} 
                  />
                </div>
                {editingLink?.url && !isValidUrl(editingLink.url) && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1">Invalid URL format</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Link Category</label>
                <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                  {['custom', 'social', 'product'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditingLink({...editingLink, type: type as any})}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editingLink?.type === type ? 'bg-brand-primary text-white' : 'text-white/40 hover:bg-white/5'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-xl font-black shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
                  {editingLink?.id ? 'Update Link' : 'Add Link to Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isWhatsappModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWhatsappModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-zinc-900">
             <h3 className="text-xl font-black mb-6">Enter WhatsApp Number:</h3>
             <form onSubmit={handleVisitorWhatsapp} className="space-y-4">
                <input 
                   type="tel" required autoFocus placeholder="e.g., +2349000000000"
                   value={visitorWaNumber} onChange={(e) => setVisitorWaNumber(e.target.value)}
                   className="w-full h-14 bg-zinc-100 border border-zinc-200 rounded-xl px-4 font-medium focus:border-brand-primary outline-none"
                />
                <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-xl font-black text-lg shadow-xl shadow-brand-primary/20">Send</button>
             </form>
          </motion.div>
        </div>
      )}

      {isQrModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQrModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center">
             <div className="p-4 bg-zinc-50 rounded-[2rem] border border-zinc-100 mb-8 shadow-sm">
                <QRCodeCanvas 
                    id="profile-qrcode"
                    value={`${window.location.origin}/${publicProfile?.handle || profile?.handle}`} 
                    size={220} level="H"
                />
             </div>
             <button 
                onClick={() => {
                    const canvas = document.getElementById('profile-qrcode') as HTMLCanvasElement;
                    if (canvas) {
                        const url = canvas.toDataURL("image/png");
                        const link = document.createElement('a');
                        link.download = `${(publicProfile || profile)?.handle || 'profile'}-qr.png`;
                        link.href = url;
                        link.click();
                    }
                }}
                className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 hover:scale-110 transition-all font-bold"
             >
                <Download className="w-6 h-6" />
             </button>
             <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Download QR Code</p>
          </motion.div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShareModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-zinc-900">
             <h3 className="text-2xl font-black mb-8">Share on</h3>
             <div className="p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm mb-10">
                <QRCodeCanvas 
                    value={`${window.location.origin}/${publicProfile?.handle || profile?.handle}`} 
                    size={180} 
                    level="H"
                    includeMargin={false}
                />
             </div>
             <div className="flex items-center justify-center gap-4 mb-10">
                {[
                  { Icon: Facebook, color: 'text-[#1877F2]', label: 'Facebook' },
                  { Icon: Twitter, color: 'text-[#1DA1F2]', label: 'X' },
                  { Icon: Linkedin, color: 'text-[#0A66C2]', label: 'LinkedIn' },
                  { Icon: Send, color: 'text-[#25D366]', label: 'WhatsApp' },
                ].map((item, i) => (
                  <div key={i} onClick={() => {
                        const url = `${window.location.origin}/${publicProfile?.handle || profile?.handle}`;
                        let shareLink = '';
                        if (item.label === 'Facebook') shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        if (item.label === 'X') shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
                        if (item.label === 'LinkedIn') shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                        if (item.label === 'WhatsApp') shareLink = `https://wa.me/?text=${encodeURIComponent(url)}`;
                        window.open(shareLink, '_blank');
                    }}
                    className={`w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center ${item.color} hover:scale-110 cursor-pointer shadow-sm transition-all`}
                  >
                     <item.Icon className="w-6 h-6" />
                  </div>
                ))}
             </div>
             <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${publicProfile?.handle || profile?.handle}`);
                alert('Copied to clipboard!');
              }}
              className="w-full py-5 bg-[#00D261] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#00D261]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
                Copy Link
             </button>
          </motion.div>
        </div>
      )}

      {is2faChallengeOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black backdrop-blur-xl" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-dark-elevated border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center">
             <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Fingerprint className="w-8 h-8 text-brand-primary" />
             </div>
             <h3 className="text-2xl font-black text-white mb-2">Security Challenge</h3>
             <p className="text-white/40 text-xs mb-10 leading-relaxed font-medium">Enter the 6-digit code from your authenticator app to authorize this session.</p>
             <div className="space-y-6">
                <input 
                  type="text" 
                  maxLength={6} 
                  value={challengeToken}
                  onChange={(e) => setChallengeToken(e.target.value)}
                  placeholder="000 000"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:border-brand-primary outline-none transition-all placeholder:text-white/5"
                />
                <button 
                  onClick={handleVerifyChallenge}
                  disabled={challengeToken.length < 6}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                >
                  Authorize Access
                </button>
                <button 
                  onClick={() => {
                    signOut();
                    setIs2faChallengeOpen(false);
                  }}
                  className="text-white/20 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel & Logout
                </button>
             </div>
          </motion.div>
        </div>
      )}

      {is2faModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIs2faModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-surface border border-white/10 rounded-[3rem] p-10 shadow-2xl text-white text-center">
             <div className="flex items-center justify-between mb-8 text-left">
                <div>
                   <h3 className="text-2xl font-black">Shield Setup</h3>
                   <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Multi-Factor Authentication</p>
                </div>
                <button onClick={() => setIs2faModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/40"><X className="w-5 h-5" /></button>
             </div>

             <div className="space-y-8">
                <div className="p-6 bg-white rounded-3xl inline-block shadow-xl">
                   <QRCodeCanvas value={twoFactorSetup?.otpauth_url || ""} size={180} />
                </div>
                
                <div className="text-left space-y-4">
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Backup Key</p>
                      <p className="font-mono text-xs text-brand-primary break-all">{twoFactorSetup?.secret}</p>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Verification Code</label>
                      <input 
                        type="text" 
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value)}
                        placeholder="Enter 6-digit code" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-xl font-black tracking-widest focus:border-brand-primary outline-none transition-all" 
                      />
                   </div>
                </div>

                <button 
                  onClick={handleVerify2fa}
                  disabled={twoFactorToken.length < 6}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                >
                  Verify & Activate Shield
                </button>
             </div>
          </motion.div>
        </div>
      )}

      {isBillingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBillingModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-dark-surface border border-white/10 rounded-[3rem] p-12 shadow-2xl text-white">
             <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-3xl font-black tracking-tight">Upgrade Operation</h3>
                   <p className="text-sm text-white/40 mt-1">Scale your digital footprint with precision infrastructure.</p>
                </div>
                <button onClick={() => setIsBillingModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl text-white/40"><X className="w-6 h-6" /></button>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
                  const p = PLANS[key];
                  const active = (subscription?.planId || 'FREE') === key;
                  return (
                    <div key={key} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col ${active ? 'border-brand-primary bg-brand-primary/5' : 'border-white/5 bg-white/5'}`}>
                       <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${p.color}`}>{key}</div>
                       <div className="text-4xl font-black mb-1">{p.monthly}</div>
                       <div className="text-[10px] text-white/30 uppercase tracking-widest mb-8">Per Month</div>
                       
                       <ul className="space-y-4 mb-10 flex-1">
                          {[
                            'Custom digital identity',
                            key !== 'FREE' ? 'Advanced ROI Pulse' : 'Basic Analytics',
                            key !== 'FREE' ? 'NFC & Business Tools' : 'Profile Link',
                            key === 'BUSINESS' ? 'Premium Lead CRM' : '',
                            key === 'BUSINESS' ? 'Priority OS Support' : '',
                          ].filter(Boolean).map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                               <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                               {f}
                            </li>
                          ))}
                       </ul>

                       <button 
                         disabled={active}
                         onClick={() => key === 'FREE' ? null : handleCreateCheckout(key)}
                         className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${active ? 'bg-white/5 text-white/20 cursor-default' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
                       >
                         {active ? 'Current Mission' : key === 'FREE' ? 'Starter Plan' : 'Select Plan'}
                       </button>
                    </div>
                  )
                })}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (loading) return <div className="min-h-screen bg-dark-surface flex items-center justify-center text-white/20 font-mono uppercase tracking-[0.5em] animate-pulse">Initializing OS...</div>;

  if (view === 'PROFILE' && publicProfile) {
    return (
      <>
        <div className="min-h-screen bg-dark-surface flex items-center justify-center p-6">
          <div className="w-full max-w-[400px]">
             <MobileProfile 
               segment={publicProfile.intent as UserSegment} 
               handle={publicProfile.handle} 
               profileData={publicProfile} 
               links={publicLinks}
               currentUserId={user?.id ?? null}
               onWhatsappClick={() => setIsWhatsappModalOpen(true)}
               onVcardClick={() => generateVCard(publicProfile)}
               onQrClick={() => setIsQrModalOpen(true)}
               onShareClick={handleShare}
               onDashboardClick={() => setView('LANDING')}
             />
             <div className="mt-12 text-center">
                <div 
                  onClick={() => setView('LANDING')}
                  className="inline-flex items-center gap-2 cursor-pointer opacity-30 hover:opacity-100 transition-opacity"
                >
                   <Zap className="w-4 h-4 text-brand-primary fill-brand-primary" />
                   <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-white">Powered by Konnekt</span>
                </div>
             </div>
          </div>
        </div>
        <ModalRegistry />
      </>
    );
  }

  const handleOnboardingBack = () => {
    if (onboarding.step > 1) {
      setOnboarding(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      setView('LANDING');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file size and type
    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }

    try {
      setIsAiLoading(true);
      const downloadURL = await uploadAvatar(user.id, file);
      setProfile({ ...profile, avatarUrl: downloadURL });
      setSaveStatus('Photo Uploaded');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Day', 'Views', 'Actions', 'Conversion Rate (%)'];
    const rows = DASHBOARD_CHART_DATA.map(d => [d.day, d.views, d.actions, d.cvr]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `konnekt_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const NavContent = () => (
    <>
      <a href="#platform" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition-colors py-2 md:py-0">Platform</a>
      <a href="#case-studies" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition-colors py-2 md:py-0">Case Studies</a>
      <a 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          if (profile) setView('DASHBOARD');
          else setView('ONBOARDING');
          setIsMenuOpen(false);
        }} 
        className="hover:text-white transition-colors py-2 md:py-0"
      >
        Dashboard
      </a>
    </>
  );

  if (view === 'LANDING') {
    return (
      <div className="min-h-screen bg-dark-surface selection:bg-brand-primary/30 font-sans">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-dark-surface/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
              <span className="text-xl font-bold tracking-tighter text-white">KONNEKT</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
              <NavContent />
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('DASHBOARD')}
                    className="hidden md:flex items-center gap-2 text-sm font-bold text-white bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" /> Dashboard
                  </button>
                  <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                    <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" />
                  </div>
                  <button onClick={() => signOut()} className="hidden md:block text-white/40 hover:text-white transition-colors"><LogOut className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleLogin}
                    className="hidden md:block text-sm font-bold text-white/60 hover:text-white px-4 py-2 transition-colors"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => {
                      setView('ONBOARDING');
                      setIsMenuOpen(false);
                    }}
                    className="hidden md:block text-sm font-bold bg-white text-black px-5 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Get Started
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-dark-elevated border-b border-white/5 px-6 py-8 flex flex-col gap-6 text-lg font-bold"
              >
                <NavContent />
                {!user ? (
                  <button 
                    onClick={() => {
                      setView('ONBOARDING');
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-white text-black py-4 rounded-xl text-center"
                  >
                    Get Started
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-white/5 text-white/60 py-4 rounded-xl text-center border border-white/10"
                  >
                    Log Out
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main className="pt-32 pb-20 px-6">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-7xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-[10px] font-bold tracking-widest uppercase mb-8">
              <Fingerprint className="w-3 h-3" />
              The Business Conversion OS
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
              Your business profile <br />
              that <span className="text-brand-primary">Converts.</span>
            </motion.h1>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 mb-8">
               {['Creators', 'Freelancers', 'Agency Owners', 'SaaS Founders', 'Vendors'].map((segment) => (
                 <div key={segment} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest">
                   {segment}
                 </div>
               ))}
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex justify-center gap-2 mb-12">
               {['Bookings', 'WhatsApp Leads', 'Payments', 'NFC'].map((tag) => (
                 <span key={tag} className="text-[9px] font-mono text-brand-primary/60 uppercase tracking-[0.3em] border border-brand-primary/20 bg-brand-primary/5 px-2 py-1 rounded">
                   {tag}
                 </span>
               ))}
            </motion.div>
            
            <motion.p variants={fadeInUp} className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Konnekt helps professionals and businesses convert real-world and online attention into leads, bookings, and sales through smart digital profiles.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="max-w-md mx-auto mb-16 px-4">
              <div className="flex flex-col md:flex-row items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl focus-within:border-brand-primary/50 focus-within:bg-white/[0.08] transition-all">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 md:py-0">
                  <span className="text-zinc-500 font-bold">konnekt.ng/</span>
                  <input 
                    type="text" 
                    placeholder="yourname"
                    value={onboarding.handle}
                    onChange={(e) => setOnboarding({...onboarding, handle: e.target.value})}
                    className="bg-transparent border-none outline-none text-white font-bold w-full placeholder:text-zinc-700" 
                  />
                </div>
                <button 
                  onClick={() => setView('ONBOARDING')}
                  className="w-full md:w-auto px-8 py-4 bg-brand-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Claim Handle
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-4">Join 2,400+ professionals capturing leads today</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button 
                onClick={() => setView('ONBOARDING')}
                className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/20 hover:scale-105 transition-transform"
              >
                Launch Your OS <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView('DASHBOARD')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors text-white"
              >
                View Analytics
              </button>
            </motion.div>

            <motion.div id="case-studies" variants={fadeInUp} className="max-w-7xl mx-auto mt-40 scroll-mt-24">
               <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12 text-left">
                  <div className="max-w-xl">
                     <h2 className="text-4xl md:text-5xl font-black mb-4">Real Outcomes. <br /><span className="text-white/40">Zero Gossip.</span></h2>
                     <p className="text-white/60">Actual conversion data from pros using Konnekt OS.</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20"><TrendingUp className="w-5 h-5" /></div>
                     <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20"><Video className="w-5 h-5" /></div>
                  </div>
               </div>
               
               <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { name: "Pro Hair Stylist", outcome: "42% uplift in Tuesday bookings", metric: "3.2x ROI", color: "from-blue-600/20" },
                    { name: "SaaS Sales Rep", outcome: "15 mins saved per contact saved", metric: "98% accuracy", color: "from-purple-600/20" },
                    { name: "WhatsApp Vendor", outcome: "80% reduction in 'Price?' messages", metric: "Direct Buy", color: "from-emerald-600/20" }
                  ].map((study, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className={`p-8 rounded-[2.5rem] bg-gradient-to-b ${study.color} to-white/5 border border-white/5 text-left`}
                    >
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-6 h-6 text-brand-primary" />
                       </div>
                       <h3 className="font-bold text-xl mb-2">{study.name}</h3>
                       <p className="text-sm text-white/60 mb-6">{study.outcome}</p>
                       <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-accent font-bold">{study.metric}</div>
                    </motion.div>
                  ))}
               </div>
            </motion.div>

            <motion.div id="platform" variants={fadeInUp} className="relative max-w-4xl mx-auto p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden text-white mt-40 scroll-mt-24">
               <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
               <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="text-left">
                     <h2 className="text-3xl font-black mb-6">Strategic <br />Blueprinting</h2>
                     <p className="text-white/40 mb-8">Redesign your behavior, not just your appearance. We map your profile zones to your specific business goals.</p>
                     <ul className="space-y-6">
                        <li className="flex gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex-shrink-0 flex items-center justify-center text-blue-400"><Calendar className="w-5 h-5" /></div>
                           <div>
                             <div className="font-bold text-sm">Service Pros</div>
                             <div className="text-xs text-white/40">Dominant "Book" CTA to eliminate back-and-forth chatter.</div>
                           </div>
                        </li>
                        <li className="flex gap-4">
                           <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex-shrink-0 flex items-center justify-center text-emerald-400"><ShoppingBag className="w-5 h-5" /></div>
                           <div>
                             <div className="font-bold text-sm">WhatsApp Vendors</div>
                             <div className="text-xs text-white/40">Direct-to-chat ordering zones for friction-less sales.</div>
                           </div>
                        </li>
                        <li className="flex gap-4">
                           <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex-shrink-0 flex items-center justify-center text-orange-400"><Database className="w-5 h-5" /></div>
                           <div>
                             <div className="font-bold text-sm">Lead Capture</div>
                             <div className="text-xs text-white/40">High-intent data vault to build your own CRM.</div>
                           </div>
                        </li>
                     </ul>
                  </div>
                  <div className="flex justify-center rotate-3 hover:rotate-0 transition-transform duration-700">
                     {/* Conversion tools */}
                     <div className="grid grid-cols-2 gap-4 mt-8 opacity-40">
                        {['Bookings', 'Payments', 'WhatsApp', 'NFC Sync'].map(tool => (
                          <div key={tool} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-center">{tool}</div>
                        ))}
                     </div>
                  </div>
                  <div className="relative group">
                     <div className="absolute -inset-10 bg-brand-primary/10 blur-[60px] rounded-full pointer-events-none" />
                     <MobileProfile segment="SERVICE" handle="alex_pro" isPreview />
                     
                     {/* Pulse Overlay Preview */}
                     <motion.div 
                        initial={{ opacity: 0, x: 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:block w-[280px] p-6 glass-card border-brand-primary/20 shadow-2xl shadow-brand-primary/10"
                     >
                        <div className="flex items-center gap-2 mb-4">
                           <TrendingUp className="w-4 h-4 text-brand-primary" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Pulse Insight</span>
                        </div>
                        <div className="text-xs text-white/60 mb-4 font-mono leading-tight">
                           High intent detected from <span className="text-white">Instagram</span> sources. Conversion velocity is up <span className="text-emerald-400">12%</span> today.
                        </div>
                        <div className="h-12 w-full bg-brand-primary/10 rounded-lg flex items-center justify-center">
                           <BarChart3 className="w-6 h-6 text-brand-primary" />
                        </div>
                     </motion.div>
                  </div>
               </div>
            </motion.div>

            {/* NFC Section */}
            <motion.div variants={fadeInUp} className="mt-40 max-w-7xl mx-auto px-6">
               <div className="grid md:grid-cols-2 gap-20 items-center">
                  <div className="relative group">
                     <div className="absolute -inset-10 bg-brand-primary/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                     <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-12 flex items-center justify-center">
                        <div className="w-48 h-32 bg-black border border-white/20 rounded-2xl flex flex-col justify-between p-6 shadow-2xl rotate-[-15deg] group-hover:rotate-0 transition-transform duration-1000">
                           <Zap className="w-6 h-6 text-brand-primary fill-brand-primary" />
                           <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Physical Bridge</div>
                        </div>
                     </div>
                  </div>
                  <div className="text-left">
                     <div className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-4">The Digital Bridge</div>
                     <h2 className="text-4xl md:text-5xl font-black mb-6">Convert in the <br /><span className="text-white/40">Physical World.</span></h2>
                     <p className="text-white/60 text-lg mb-8 leading-relaxed">
                        Pair your profile with a Konnekt NFC tap card. One tap converts a handshake into a saved contact, a booking, or a lead—instantly syncing to your Pulse dashboard.
                     </p>
                     <button className="px-8 py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
                        Get NFC Hardware <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </motion.div>

            {/* Pricing Section */}
            <motion.div variants={fadeInUp} className="mt-40 mb-20">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-black">Simple Tiers.</h2>
                  <p className="text-white/40 mb-8">Scalable for individuals and enterprises.</p>
                  
                  {/* Billing Toggle */}
                  <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
                     <button 
                       onClick={() => setBillingCycle('monthly')}
                       className={`px-6 py-2 rounded-full text-xs font-black transition-all ${billingCycle === 'monthly' ? 'bg-white text-black' : 'text-white/40'}`}
                     >
                       Monthly
                     </button>
                     <button 
                       onClick={() => setBillingCycle('yearly')}
                       className={`px-6 py-2 rounded-full text-xs font-black transition-all ${billingCycle === 'yearly' ? 'bg-white text-black' : 'text-white/40'}`}
                     >
                       Yearly <span className="text-[10px] opacity-60 ml-1">(2 Months Free)</span>
                     </button>
                  </div>
               </div>
               <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                  {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((pKey, i) => {
                    const p = PLANS[pKey];
                    const isHighlighted = pKey === 'PRO';
                    const price = billingCycle === 'monthly' ? p.monthly : p.yearly;
                    
                    return (
                      <div key={pKey} className={`p-10 rounded-[2.5rem] border ${isHighlighted ? 'border-brand-primary bg-brand-primary/5' : 'border-white/5 bg-white/[0.02]'} flex flex-col`}>
                         <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{p.name}</div>
                         <div className="text-4xl font-black mb-8">{price}<span className="text-sm font-normal text-white/20">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
                         <ul className="space-y-4 mb-12 flex-1">
                            {[
                              pKey === 'FREE' ? '1 Active Profile' : (pKey === 'PRO' ? '5 Active Profiles' : 'Unlimited vCards'),
                              pKey === 'FREE' ? 'Basic Pulse' : (pKey === 'PRO' ? '10 AI Credits' : '50 AI Credits'),
                              pKey === 'PRO' ? 'Custom Domain' : 'Konnekt Domain',
                              pKey === 'PRO' ? 'Hide Branding' : 'Konnekt Branding',
                              pKey !== 'FREE' ? 'NFC Tools' : 'Basic Tools'
                            ].map(f => (
                              <li key={f} className="text-sm text-white/60 flex items-center gap-2">
                                 <CheckCircle2 className={`w-4 h-4 ${isHighlighted ? 'text-brand-primary' : 'text-white/20'}`} /> {f}
                              </li>
                            ))}
                         </ul>
                         <button 
                           onClick={() => setView('ONBOARDING')}
                           className={`w-full py-4 rounded-xl font-bold transition-all ${isHighlighted ? 'bg-brand-primary text-white shadow-2xl shadow-brand-primary/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                         >
                            {pKey === 'FREE' ? 'Start Free' : (pKey === 'PRO' ? 'Go Professional' : 'Get Started')}
                         </button>
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  if (view === 'ONBOARDING') {
    return (
      <div className="min-h-screen bg-dark-surface font-sans text-white overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('LANDING')}>
              <Zap className="w-6 h-6 text-brand-primary fill-brand-primary" />
              <span className="hidden sm:inline text-xl font-bold tracking-tighter text-white">KONNEKT</span>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={handleOnboardingBack}
                className="text-white/40 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> 
                <span>{onboarding.step === 1 ? 'Exit' : 'Back'}</span>
              </button>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 w-6 rounded-full transition-colors ${s <= onboarding.step ? 'bg-brand-primary' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-20 items-center">
            {/* Steps Workspace */}
            <div className="max-w-xl">
               <AnimatePresence mode="wait">
                 {onboarding.step === 1 && (
                   <motion.div 
                     key="step1"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="space-y-8"
                   >
                     <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight flex items-center gap-3">Claim your <br /><span className="text-brand-primary">unique handle.</span> <InfoTooltip text="Your handle is your unique digital fingerprint on Konnekt. It acts as your professional URL (konnekt.ng/yourname)." /></h2>
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/20 font-mono text-sm sm:text-xl">konnekt.ng/</div>
                        <input 
                          autoFocus
                          type="text"
                          value={onboarding.handle}
                          onChange={(e) => setOnboarding({...onboarding, handle: e.target.value})}
                          placeholder="yourname"
                          className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 pl-[100px] sm:pl-[150px] pr-6 text-lg sm:text-xl font-bold focus:border-brand-primary focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
                        />
                     </div>
                     <button 
                       disabled={onboarding.handle.length < 3}
                       onClick={() => setOnboarding({...onboarding, step: 2})}
                       className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                     >
                        Confirm Handle <ChevronRight className="w-6 h-6" />
                     </button>
                   </motion.div>
                 )}

                 {onboarding.step === 2 && (
                   <motion.div 
                     key="step2"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="space-y-8"
                   >
                     <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight flex items-center gap-3">What matters most <br /><span className="text-brand-accent">today?</span> <InfoTooltip text="Our AI reconfigures your profile layout based on your intent. Select the goal that drives the most revenue for you." /></h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.keys(SEGMENTS) as UserSegment[]).map((key) => {
                          const s = SEGMENTS[key];
                          const Icon = s.icon;
                          const active = onboarding.intent === key;
                          return (
                            <button 
                              key={key}
                              onClick={() => setOnboarding({...onboarding, intent: key})}
                              className={`
                                p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden
                                ${active ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 bg-white/5 hover:border-white/20'}
                              `}
                            >
                               <div className={`p-2 rounded-lg bg-white/10 w-fit mb-4 ${active ? 'text-brand-primary' : 'text-white/40'}`}>
                                 <Icon className="w-5 h-5" />
                               </div>
                               <div className="font-bold text-sm mb-1">{s.intentAction}</div>
                               <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{s.title.split(' ')[0]}</div>
                            </button>
                          );
                        })}
                     </div>
                     <button 
                       onClick={() => setOnboarding({...onboarding, step: 3})}
                       className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2"
                     >
                        Process Blueprint <ChevronRight className="w-6 h-6" />
                     </button>
                   </motion.div>
                 )}

                 {onboarding.step === 3 && (
                   <motion.div 
                     key="step3"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="space-y-8"
                   >
                     <h2 className="text-5xl font-black tracking-tight leading-tight flex items-center gap-3">Drop your <br /><span className="text-brand-primary">core blueprint.</span> <InfoTooltip text="Core blueprint items are your primary conversion endpoints. These are the first things visitors will see." /></h2>
                     <p className="text-white/40">Connect your primary destination—where the business happens.</p>
                     <div className="space-y-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                           <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-bold text-white/60">Primary Destination Link</span>
                              <div className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-[8px] font-bold uppercase rounded">Required</div>
                           </div>
                           <input 
                             type="url"
                             value={onboarding.primaryLink}
                             onChange={(e) => setOnboarding({...onboarding, primaryLink: e.target.value})}
                             placeholder="https://wa.me/id or booking.link"
                             className={`w-full bg-transparent border-none outline-none text-xl font-bold text-brand-primary placeholder:text-white/5 ${onboarding.primaryLink && !isValidUrl(onboarding.primaryLink) ? 'text-red-400' : ''}`}
                           />
                           {onboarding.primaryLink && !isValidUrl(onboarding.primaryLink) && (
                             <p className="text-[10px] text-red-400 mt-1">Please enter a valid URL (e.g. https://...)</p>
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Custom CTA Label</div>
                              <input 
                                type="text"
                                value={onboarding.customCTAText}
                                onChange={(e) => setOnboarding({...onboarding, customCTAText: e.target.value})}
                                placeholder="My Portfolio"
                                className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/5"
                              />
                           </div>
                           <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Custom URL</div>
                              <input 
                                type="text"
                                value={onboarding.customCTAUrl}
                                onChange={(e) => setOnboarding({...onboarding, customCTAUrl: e.target.value})}
                                placeholder="portfolio.com"
                                className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/5"
                              />
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={handleCreateProfile}
                       id="gen-btn"
                       className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 group overflow-hidden relative"
                     >
                        <span className="relative z-10 flex items-center gap-2">Generate Profile <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></span>
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 bg-white/10 skew-x-12"
                        />
                     </button>
                   </motion.div>
                 )}

                 {onboarding.step === 4 && (
                   <motion.div 
                     key="step4"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-10 text-center"
                   >
                      <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                         <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                         </div>
                      </div>
                     <h2 className="text-5xl font-black tracking-tight leading-tight">Profile Provisioned.</h2>
                     <div className="p-6 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl text-sm leading-relaxed text-white/60 italic">
                        The behavior of your profile has been re-mapped. Every pixel is now focused on <span className="text-white font-bold">{SEGMENTS[onboarding.intent].intentAction}</span>.
                     </div>
                     <button 
                       onClick={() => setView('DASHBOARD')}
                       className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                     >
                        Go to The Pulse <BarChart3 className="w-5 h-5" />
                     </button>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Live Interactive Preview */}
            <div className="hidden lg:flex justify-center [perspective:1000px]">
               <motion.div
                 layout
                 transition={{ type: 'spring', damping: 20, stiffness: 100 }}
               >
                 <MobileProfile 
                   segment={onboarding.intent} 
                   handle={onboarding.handle} 
                   profileData={{
                     displayName: onboarding.handle ? `@${onboarding.handle}` : 'Your Name',
                     intent: onboarding.intent,
                     primaryCTAUrl: onboarding.primaryLink,
                     customCTAText: onboarding.customCTAText,
                     customCTAUrl: onboarding.customCTAUrl,
                   }}
                   isPreview 
                 />
               </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-dark-surface font-sans flex flex-col md:flex-row text-white">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-dark-elevated border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
           <div className="p-6 flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setView('LANDING')}>
              <Zap className="w-6 h-6 text-brand-primary fill-brand-primary" />
              <span className="text-xl font-bold tracking-tighter">KONNEKT</span>
           </div>
           
           <nav className="px-3 flex-1 space-y-1">
              {[
                { label: 'The Pulse', icon: BarChart3 },
                { label: 'Lead Vault', icon: Database },
                { label: 'Edit Profile', icon: Smartphone },
                { label: 'Email Signature', icon: Mail },
                { label: 'NFC Tools', icon: Fingerprint, isPro: true },
                { label: 'Integrations', icon: Layers, isPro: true },
                { label: 'Billing', icon: CreditCard },
                { label: 'Security', icon: Fingerprint },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.label ? 'bg-brand-primary/10 text-brand-primary' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.isPro && !isPro(profile) && (
                    <span className="text-[8px] font-black bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">Pro</span>
                  )}
                </button>
              ))}
           </nav>

           <div className="p-4 m-3 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 rounded-2xl border border-white/5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-1">Scale Plan</div>
              <div className="text-xs text-white/60 mb-4">Unlock advanced demographic ROI tracking.</div>
              <button className="w-full py-2 bg-white text-black text-[10px] font-bold uppercase rounded-lg">Upgrade</button>
           </div>
        </div>

        {/* Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
            {activeTab === 'The Pulse' && (
              <section className="space-y-12">
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                          <div className="px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-md text-[8px] font-black text-brand-primary uppercase tracking-[0.2em]">Live Operation</div>
                          <div className="flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Profile: Active</span>
                          </div>
                       </div>
                       <h2 className="text-4xl font-black mb-1 tracking-tight flex items-center gap-4">
                          Profile HQ
                          <span className="text-zinc-800">/</span>
                          <span className="text-brand-primary text-2xl">@{profile?.handle || 'Demo'}</span>
                       </h2>
                       <p className="text-sm text-zinc-500 max-w-md">Your command center for attention arbitrage and conversion velocity.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar">
                          {['7D', '30D', 'ALL', 'Custom'].map(t => (
                             <button 
                               key={t} 
                               onClick={() => setDateRange(t)}
                               className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${t === dateRange ? 'bg-white text-black' : 'text-zinc-600 hover:text-zinc-300'}`}
                             >
                               {t}
                             </button>
                          ))}
                       </div>
                       
                       {dateRange === 'Custom' && (
                         <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-xl p-1 shrink-0">
                            <input type="date" className="bg-transparent text-[10px] font-bold text-white p-1 outline-none border-none [color-scheme:dark]" />
                            <span className="text-zinc-600 px-1">-</span>
                            <input type="date" className="bg-transparent text-[10px] font-bold text-white p-1 outline-none border-none [color-scheme:dark]" />
                         </div>
                       )}
                       
                       <button 
                         onClick={handleExportCSV}
                         className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all focus:ring-2 focus:ring-brand-primary/50"
                       >
                         <Download className="w-3.5 h-3.5" /> Export
                       </button>

                       <button 
                         onClick={() => window.open(`/${profile?.handle}`, '_blank')}
                         className="h-10 px-6 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                       >
                         <ExternalLink className="w-3.5 h-3.5" /> Launch Profile
                       </button>
                    </div>
                 </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      {[
                        { label: 'Total Views', value: stats?.totalViews || '0', change: '+12%', icon: BarChart3, color: 'text-white', tooltip: 'The total number of profile visits across all sessions.' },
                        { label: 'Unique Visitors', value: stats?.uniqueViews || '0', change: '+15%', icon: Users, color: 'text-emerald-400', tooltip: 'The number of distinct individuals who have viewed your profile.' },
                        { label: 'Leads Generated', value: stats?.totalActions || '0', change: '+8%', icon: Database, color: 'text-brand-primary', tooltip: 'Number of visitors who engaged with high-intent call-to-actions.' },
                        { label: 'Conversion Rate', value: stats?.cvr || '0%', change: '+3%', icon: Smartphone, color: 'text-brand-accent', tooltip: 'The percentage of profile visitors who completed a high-value action.' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl group hover:border-brand-primary/20 transition-all">
                         <div className="flex items-center justify-between mb-4">
                            <stat.icon className={`w-5 h-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{stat.change}</span>
                         </div>
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center">
                           {stat.label}
                           <InfoTooltip text={stat.tooltip} />
                         </p>
                         <h3 className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h3>
                      </div>
                    ))}
                 </div>

                <div className="grid md:grid-cols-2 gap-6 mb-10">
                   <div className="glass-card p-8 h-[350px]">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-brand-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest">Growth Velocity</span>
                         </div>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                         <BarChart data={dynamicChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10}} />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.02)'}}
                              contentStyle={{backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px'}} 
                            />
                            <Bar dataKey="actions" radius={[4, 4, 0, 0]}>
                               {dynamicChartData.map((_entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === dynamicChartData.length - 1 ? '#3B82F6' : 'rgba(59, 130, 246, 0.4)'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>

                   <div className="glass-card p-8 h-[350px]">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand-accent" />
                            <span className="text-xs font-bold uppercase tracking-widest">Traffic Origin</span>
                         </div>
                      </div>
                      <div className="flex items-center h-[200px]">
                         <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                               <Pie
                                 data={stats?.trafficSources || TRAFFIC_SOURCES_DATA}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                               >
                                 {(stats?.trafficSources || TRAFFIC_SOURCES_DATA).map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                 ))}
                               </Pie>
                               <Tooltip 
                                 contentStyle={{backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px'}} 
                               />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="w-1/2 space-y-4">
                            {(stats?.trafficSources || TRAFFIC_SOURCES_DATA).map((source: any, i: number) => (
                               <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                                     <span className="text-[10px] text-white/60">{source.name}</span>
                                  </div>
                                  <span className="text-[10px] font-bold">{source.value}%</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-10">
                   {/* Conversion Funnel */}
                   <div className="glass-card p-8">
                      <div className="flex items-center gap-2 mb-8">
                         <Target className="w-4 h-4 text-brand-primary" />
                         <span className="text-xs font-bold uppercase tracking-widest">Conversion Funnel</span>
                      </div>
                      <div className="space-y-6">
                         {(stats?.funnel || [
                           { label: 'Total Views', value: 0, percentage: 0 },
                           { label: 'Interactions', value: 0, percentage: 0, color: 'bg-brand-primary/40' },
                           { label: 'CTAs Clicked', value: 0, percentage: 0, color: 'bg-brand-primary' },
                         ]).map((step, i) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[10px]">
                                 <span className="text-white/40 uppercase tracking-wider">{step.label}</span>
                                 <span className="font-bold">{step.value.toLocaleString()}</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${step.percentage}%` }}
                                   className={`h-full ${step.color || 'bg-white/20'}`}
                                 />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Device Insights */}
                   <div className="glass-card p-8">
                      <div className="flex items-center gap-2 mb-8">
                         <Smartphone className="w-4 h-4 text-brand-accent" />
                         <span className="text-xs font-bold uppercase tracking-widest">Device Distribution</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         {(stats?.deviceDist || DEVICE_DISTRIBUTION).map((device: any, i: number) => (
                           <div key={i} className="flex flex-col items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                              <device.icon className="w-6 h-6 text-white/20" />
                              <div className="text-center">
                                 <div className="text-lg font-black">{device.value}%</div>
                                 <div className="text-[8px] text-white/40 uppercase tracking-widest font-bold">{device.name}</div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </section>
           )}

            {activeTab === 'Email Signature' && (
              <section className="space-y-10">
                 <div>
                    <h2 className="text-3xl font-black mb-1">Email Signature Generator</h2>
                    <p className="text-sm text-white/40">Bridge the gap between your outbound emails and your digital command center.</p>
                 </div>
                 
                 <div className="max-w-2xl">
                    <EmailSignature profile={profile} />
                 </div>
              </section>
            )}

           {activeTab === 'Edit Profile' && (
             <section className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h2 className="text-3xl font-black mb-1 flex items-center gap-4">
                        HQ : Profile Design
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full scale-90 md:scale-100">
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">{showLivePreview ? 'Live' : 'Off'} Preview</span>
                           <button 
                             onClick={() => setShowLivePreview(!showLivePreview)}
                             className={`w-10 h-5 rounded-full relative transition-all ${showLivePreview ? 'bg-brand-primary' : 'bg-brand-primary/20'}`}
                           >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${showLivePreview ? 'left-5.5' : 'left-0.5'}`} />
                           </button>
                        </div>
                      </h2>
                      <p className="text-sm text-white/40">Manage your conversion zones and custom calls-to-action.</p>
                   </div>
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => window.open(`/${profile?.handle}`, '_blank')}
                         className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all"
                       >
                          <ExternalLink className="w-4 h-4" /> View Live
                       </button>
                       <button 
                         onClick={handleShare}
                         className="px-5 py-2.5 bg-brand-primary text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                       >
                          <Share2 className="w-4 h-4" /> Share Link
                       </button>
                       <AnimatePresence>
                          {saveStatus && (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                </div>

                <div className={`grid ${showLivePreview ? 'lg:grid-cols-[1fr_350px]' : 'lg:grid-cols-1'} gap-10`}>
                   <div className="space-y-8">
                      <div className="glass-card p-10 space-y-10">
                         {/* Identity Settings */}
                         <div className="space-y-6">
                            <div>
                               <h3 className="font-bold text-lg mb-2">Identity</h3>
                               <p className="text-xs text-white/40">How you appear to your audience.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-4">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Display Name</label>
                                     <input 
                                       type="text"
                                       value={profile?.displayName || ''}
                                       onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                                       placeholder="e.g. Alex Rivera"
                                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                     />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Contact Phone</label>
                                        <input 
                                          type="tel" 
                                          placeholder="+234..."
                                          value={profile?.phone || ''} 
                                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                        />
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Contact Email</label>
                                        <input 
                                          type="email" 
                                          placeholder="hello@..."
                                          value={profile?.email || ''} 
                                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                        />
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Location</label>
                                     <input 
                                       type="text" 
                                       placeholder="e.g. Lagos, Nigeria"
                                       value={profile?.location || ''} 
                                       onChange={(e) => setProfile({...profile, location: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2 opacity-50 cursor-not-allowed">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Profile Handle (Unchangeable)</label>
                                  <input 
                                    type="text"
                                    value={'@' + (profile?.handle || '')}
                                    disabled
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white/40 bg-zinc-900"
                                  />
                               </div>
                            </div>
                         </div>

                          <div className="space-y-6 pt-6 border-t border-white/5">
                             <div>
                                <h3 className="font-bold text-lg mb-2">Visual Branding</h3>
                                <p className="text-xs text-white/40">Set your portrait, background, and brand logo.</p>
                             </div>
                              <div className="grid md:grid-cols-2 gap-6">
                                 <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                       Portrait Photo
                                    </label>
                                    <div className="flex items-center gap-6">
                                       <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 overflow-hidden relative group">
                                          {profile?.avatarUrl ? (
                                            <img src={profile.avatarUrl} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                              <User className="w-8 h-8" />
                                            </div>
                                          )}
                                          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                             <Plus className="w-6 h-6 text-white" />
                                             <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                          </label>
                                       </div>
                                       <div className="flex-1 space-y-1">
                                          <p className="text-xs font-bold text-white">Upload New Portrait</p>
                                          <p className="text-[10px] text-white/40">JPG, PNG or WEBP. Max 2MB.</p>
                                          <label className="inline-block mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all">
                                             Choose File
                                             <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                          </label>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                       Background Banner URL
                                       <InfoTooltip text="Free: Photo/GIF. Pro: Video support (up to 3MB)." />
                                    </label>
                                    <input 
                                      type="text"
                                      value={profile?.coverUrl || ''}
                                      onChange={(e) => setProfile({...profile, coverUrl: e.target.value})}
                                      placeholder="https://..."
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                    />
                                 </div>
                              </div>
                             
                             {profile?.plan !== 'FREE' && (
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                     Business Logo URL (Pro/Business Only)
                                  </label>
                                  <input 
                                    type="text"
                                    value={profile?.logoUrl || ''}
                                    onChange={(e) => setProfile({...profile, logoUrl: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                  />
                                </div>
                             )}
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Bio / About</label>
                                <button 
                                  onClick={handleGenerateBio}
                                  disabled={isAiLoading}
                                  className="text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  <Wand2 className="w-3 h-3" /> {isAiLoading ? 'Generating...' : 'Generate with AI'}
                                </button>
                             </div>
                             <textarea 
                               value={profile?.bio || ''}
                               onChange={(e) => setProfile({...profile, bio: e.target.value})}
                               placeholder="Tell your audience who you are and what you offer..."
                               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors h-24 resize-none"
                             />
                          </div>

                          <div className="space-y-6">
                             <div>
                                <h3 className="font-bold text-lg mb-2">Social Hub</h3>
                                <p className="text-xs text-white/40">Connect your various digital footprints.</p>
                             </div>
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Instagram (@handle)</label>
                                   <input 
                                     type="text"
                                     value={profile?.instagram || ''}
                                     onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                                     placeholder="e.g. alex_creativ"
                                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">LinkedIn (username)</label>
                                   <input 
                                     type="text"
                                     value={profile?.linkedin || ''}
                                     onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                                     placeholder="e.g. alexrivera"
                                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                   />
                                </div>
                             </div>
                          </div>

                          {/* Theme Selection */}
                          <div className="space-y-6">
                             <div>
                                <h3 className="font-bold text-lg mb-2">Visual Identity</h3>
                                <p className="text-xs text-white/40">Customize the look and feel of your mobile profile.</p>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((t) => (
                                  <div 
                                    key={t}
                                    onClick={() => setProfile({...profile, theme: t})}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${profile?.theme === t ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 hover:bg-white/5'}`}
                                  >
                                    <div className={`w-full aspect-video rounded-lg mb-3 ${THEMES[t].bg} ${THEMES[t].border} border flex items-center justify-center`}>
                                      <div className={`w-8 h-8 rounded-full ${THEMES[t].card} ${THEMES[t].border}`}></div>
                                    </div>
                                    <div className="text-center">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t}</span>
                                    </div>
                                  </div>
                                ))}
                             </div>
                          </div>

                         {/* Primary CTA Settings */}
                         <div className="space-y-6">
                            <div>
                               <h3 className="font-bold text-lg mb-2">Primary Call-to-Action</h3>
                               <p className="text-xs text-white/40">Override the default intent-based button text and destination.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Action Text</label>
                                  <input 
                                    type="text"
                                    value={profile?.primaryCTAText || ''}
                                    onChange={(e) => setProfile({...profile, primaryCTAText: e.target.value})}
                                    placeholder={SEGMENTS[profile?.intent as UserSegment || 'SERVICE'].primaryCTA}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Destination URL</label>
                                  <input 
                                    type="text"
                                    value={profile?.primaryCTAUrl || ''}
                                    onChange={(e) => setProfile({...profile, primaryCTAUrl: e.target.value})}
                                    placeholder="e.g. calendly.com/yourname"
                                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors ${profile?.primaryCTAUrl && !isValidUrl(profile.primaryCTAUrl) ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                  />
                                  {profile?.primaryCTAUrl && !isValidUrl(profile.primaryCTAUrl) && (
                                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider px-1">Invalid URL format</p>
                                  )}
                               </div>
                            </div>
                         </div>

                         {/* Custom CTA Settings */}
                         <div className="space-y-6">
                            <div>
                               <h3 className="font-bold text-lg mb-2">Secondary Call-to-Action</h3>
                               <p className="text-xs text-white/40">Define a secondary prominent button that appears across your profile.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Button Text</label>
                                  <input 
                                    type="text"
                                    value={profile?.customCTAText || ''}
                                    onChange={(e) => setProfile({...profile, customCTAText: e.target.value})}
                                    placeholder="e.g. My Portfolio"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Button Link</label>
                                  <input 
                                    type="text"
                                    value={profile?.customCTAUrl || ''}
                                    onChange={(e) => setProfile({...profile, customCTAUrl: e.target.value})}
                                    placeholder="e.g. portfolio.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                  />
                               </div>
                            </div>
                         </div>

                          {/* Dynamic Links */}
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <div>
                                   <h3 className="font-bold text-lg mb-2">Dynamic Links</h3>
                                   <p className="text-xs text-white/40">Add custom buttons and social links to your live profile.</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setEditingLink({ title: '', url: '', type: 'custom', order: links.length });
                                    setIsLinkModalOpen(true);
                                  }}
                                  className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-brand-primary hover:bg-brand-primary/20 transition-all"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                             </div>

                <div className="space-y-3 md:col-span-12">
                                  <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                  >
                                    <SortableContext 
                                      items={links.map(l => l.id)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      {links.map((link) => (
                                        <SortableLinkItem 
                                          key={link.id} 
                                          link={link} 
                                          onEdit={(l) => {
                                            setEditingLink(l);
                                            setIsLinkModalOpen(true);
                                          }}
                                          onDelete={handleDeleteLink}
                                        />
                                      ))}
                                    </SortableContext>
                                  </DndContext>
                                  {links.length === 0 && (
                                    <div className="py-10 border border-dashed border-white/10 rounded-2xl text-center">
                                       <Layers className="w-8 h-8 text-white/10 mx-auto mb-3" />
                                       <p className="text-xs text-white/20">No dynamic links added yet.</p>
                                    </div>
                                  )}
                                </div>
                             </div>

                         {/* Social Links Settings */}
                         <div className="space-y-6">
                            <div>
                               <h3 className="font-bold text-lg mb-2">Social Blueprint</h3>
                               <p className="text-xs text-white/40">Connect your cross-platform identity.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                    <Instagram className="w-3 h-3" /> Instagram Handle
                                  </label>
                                  <div className="relative group">
                                     <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 text-sm">@</div>
                                     <input 
                                       type="text"
                                       value={profile?.instagram || ''}
                                       onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                                       placeholder="yourhandle"
                                       className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                    <Linkedin className="w-3 h-3" /> LinkedIn ID
                                  </label>
                                  <input 
                                    type="text"
                                    value={profile?.linkedin || ''}
                                    onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                                    placeholder="your-profile-slug"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white transition-colors"
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="pt-4 text-left">
                            <button 
                              onClick={async () => {
                                try {
                                  const { error } = await supabase.from('profiles').update({
                                    ...profile,
                                    updated_at: new Date().toISOString()
                                  }).eq('id', profile.id);
                                  if (error) throw error;
                                  setSaveStatus('Profile updated successfully');
                                  setTimeout(() => setSaveStatus(null), 3000);
                                } catch (e) {
                                  handleDbError(e, OperationType.WRITE, `profiles/${profile.handle}`);
                                }
                              }}
                              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20"
                            >
                               <Save className="w-4 h-4" /> Save Configuration
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6 sticky top-24">
                      <div className="text-center">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Interactive Preview</span>
                      </div>
                      <div className="flex justify-center h-fit">
                        <MobileProfile 
                          segment={profile?.intent || 'SERVICE'} 
                          handle={profile?.handle} 
                          profileData={profile} 
                          links={links}
                          isPreview 
                        />
                      </div>
                   </div>
                </div>
             </section>
           )}

           {activeTab === 'Billing' && (
             <section className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h2 className="text-4xl font-black mb-1">Billing & Growth</h2>
                      <p className="text-sm text-white/40">Scale your digital conversion infrastructure.</p>
                   </div>
                   <div className="flex items-center gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${billingCycle === 'monthly' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        Monthly
                      </button>
                      <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${billingCycle === 'yearly' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        Yearly
                      </button>
                   </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                   {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((pKey) => {
                     const plan = PLANS[pKey];
                     const isCurrent = (subscription?.planId || 'FREE') === pKey;
                     return (
                       <div key={pKey} className={`glass-card p-10 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-brand-primary/30 ${isCurrent ? 'ring-2 ring-brand-primary border-brand-primary/50' : ''}`}>
                          {isCurrent && (
                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-primary text-[10px] font-black text-white uppercase tracking-widest rounded-bl-xl shadow-lg">Current Active</div>
                          )}
                          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${plan.color}`}>{plan.name}</div>
                          <div className="text-5xl font-black mb-1 tracking-tighter">
                            {billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                          </div>
                          <div className="text-[10px] text-white/20 uppercase tracking-widest mb-10 font-bold">Per month</div>
                          
                          <ul className="space-y-5 mb-12 flex-1">
                             {[
                               'Custom digital identity',
                               pKey !== 'FREE' ? 'Advanced ROI Pulse' : 'Basic Analytics',
                               pKey !== 'FREE' ? 'NFC & Business Tools' : 'Profile Link',
                               pKey === 'BUSINESS' ? 'Premium Lead CRM' : '',
                               pKey === 'BUSINESS' ? 'Priority OS Support' : '',
                               pKey === 'BUSINESS' ? 'Custom Domain Mapping' : '',
                             ].filter(Boolean).map((f, i) => (
                               <li key={i} className="text-sm text-white/50 flex items-start gap-3 leading-tight">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                               </li>
                             ))}
                          </ul>

                          <button 
                            disabled={isCurrent || pKey === 'FREE'}
                            onClick={() => handleCreateCheckout(pKey)}
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${isCurrent ? 'bg-white/5 text-white/40 border border-white/5' : 'bg-white text-black hover:scale-[1.03] active:scale-95 shadow-xl'}`}
                          >
                            {isCurrent ? 'Current Plan' : pKey === 'FREE' ? 'Starter Plan' : 'Activate Plan'}
                          </button>
                       </div>
                     )
                   })}
                </div>

                {subscription && (
                  <div className="p-8 bg-brand-primary/5 border border-brand-primary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-brand-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">Manage Billing</h4>
                        <p className="text-sm text-white/40">View invoices, update card details or cancel subscription.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCreateCheckout(subscription.planId)} 
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Stripe Portal
                    </button>
                  </div>
                )}
             </section>
           )}

           {activeTab === 'Security' && (
             <section className="space-y-12">
                <div>
                   <h2 className="text-4xl font-black mb-1">Security Sentinel</h2>
                   <p className="text-sm text-white/40">Configure advanced authentication and session protection.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="glass-card p-10 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${security?.enabled ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/5 text-white/20'}`}>
                               <Fingerprint className="w-8 h-8" />
                            </div>
                            <div>
                               <h4 className="text-xl font-bold">Two-Factor Authentication</h4>
                               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Status: {security?.enabled ? 'Secured' : 'At Risk'}</p>
                            </div>
                         </div>
                         <button 
                           onClick={handleStart2faSetup}
                           className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${security?.enabled ? 'bg-white/5 text-white/40 hover:text-white border border-white/10' : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-105'}`}
                         >
                            {security?.enabled ? 'Reconfigure' : 'Setup 2FA'}
                         </button>
                      </div>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Add an extra layer of security to your account by requiring a code from an authenticator app when logging in. This protects your profile data and conversion leads.</p>
                      
                      {security?.enabled && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6 text-white" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Enhanced Protection Active</p>
                              <p className="text-[10px] text-emerald-500/60 font-medium">Your account is shielded with RFC 6238 TOTP logic.</p>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="glass-card p-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                          <Layers className="w-6 h-6 text-white/20" />
                        </div>
                        <h4 className="text-xl font-bold">Privacy Matrix</h4>
                        <p className="text-sm text-white/40 leading-relaxed">Limit data transparency and anonymize certain profile analytics for sensitive operations.</p>
                      </div>
                      <div className="space-y-4 mt-12">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold">Anonymize Visitors</span>
                            <div className="w-12 h-6 bg-white/10 rounded-full relative">
                               <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
                            </div>
                         </div>
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                            <span className="text-xs font-bold">Hide Conversion Indicators</span>
                            <div className="w-12 h-6 bg-white/10 rounded-full relative">
                               <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </section>
           )}

           {['NFC Tools', 'Integrations'].includes(activeTab) && (subscription?.planId === 'FREE' || !subscription) && (
             <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-6">
                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center">
                   <Zap className="w-10 h-10 text-brand-primary" />
                </div>
                <div className="max-w-md">
                   <h3 className="text-2xl font-black mb-2">Upgrade to Unlock {activeTab}</h3>
                   <p className="text-white/40 text-sm">NFC Hardware syncing and third-party integrations are exclusive to Intermediate and Professional plans.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('Billing')}
                  className="px-8 py-3 bg-brand-primary text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                   See Pricing Plans
                </button>
             </div>
           )}

           {activeTab === 'NFC Tools' && profile?.plan !== 'FREE' && (
             <section className="space-y-10">
                <div className="flex items-center justify-between">
                   <div>
                      <h2 className="text-3xl font-black mb-1">NFC Digital Bridge</h2>
                      <p className="text-sm text-white/40">Pair and monitor your physical tap hardware.</p>
                   </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-6 border-dashed border-white/10">
                      <div className="w-16 h-24 border-2 border-white/10 rounded-xl flex items-center justify-center rotate-[-10deg]">
                         <Fingerprint className="w-8 h-8 text-white/20" />
                      </div>
                      <div>
                         <h4 className="font-bold mb-1">No Device Active</h4>
                         <p className="text-xs text-white/40">Enter the 8-digit device ID from the back of your card.</p>
                      </div>
                      <div className="flex gap-2 w-full max-w-xs">
                         <input type="text" placeholder="XXXX-XXXX" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-center font-mono uppercase tracking-widest" />
                         <button className="px-4 py-2 bg-white text-black font-bold rounded-lg text-xs">Pair</button>
                      </div>
                   </div>
                </div>
             </section>
           )}
           {activeTab === 'Lead Vault' && (
             <section>
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-brand-accent" />
                      <h3 className="text-xl font-bold tracking-tight">Lead Vault</h3>
                   </div>
                   <button className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                      Export CRM <ExternalLink className="w-3 h-3" />
                   </button>
                </div>

                <div className="glass-card overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                               <th className="px-6 py-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Inquiry Source</th>
                               <th className="px-6 py-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Intent Signal</th>
                               <th className="px-6 py-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Status</th>
                               <th className="px-6 py-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Arrival</th>
                            </tr>
                         </thead>
                         <tbody>
                            {dynamicLeads.map((lead: any) => (
                              <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                                         {lead.name[0]}
                                       </div>
                                       <span className="text-sm font-medium">{lead.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5">
                                      {lead.intent}
                                    </span>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                       <span className="text-xs text-white/80">{lead.status}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5 text-xs text-white/40">{lead.date}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </section>
           )}
        <ModalRegistry />
        </main>
      </div>
    );
  }

  return null;
}