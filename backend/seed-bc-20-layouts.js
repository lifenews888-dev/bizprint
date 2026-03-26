/**
 * Seed 20 unique business card layouts with varied zone positions
 * Run: node seed-bc-20-layouts.js
 */
const PRODUCT_ID = '57229fb9-12d5-4104-863f-d95e619f30d8'
const API = 'http://localhost:4000'

async function getToken() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bizprint.mn', password: 'Admin@2026' }),
  })
  const data = await res.json()
  return data.access_token || data.data?.access_token
}

const LAYOUTS = [
  { name: 'Classic Left', name_mn: 'Сонгодог зүүн', type: 'business', canvas_data: { accent: '#0EA5E9', bg: '#FFFFFF', textDark: '#1E293B', textLight: '#64748B' },
    front_json: [
      { key:'company_name',x:20,y:15,w:200,h:24,fontSize:14,fontWeight:'bold',fill:'accent'},
      { key:'company_message',x:20,y:40,w:200,h:18,fontSize:10,fill:'light'},
      { key:'full_name',x:20,y:75,w:240,h:30,fontSize:22,fontWeight:'bold',fill:'accent'},
      { key:'job_title',x:20,y:108,w:200,h:20,fontSize:12,fill:'light'},
      { key:'phone',x:20,y:170,w:160,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:190,w:200,h:18,fontSize:11,fill:'light'},
      { key:'address1',x:20,y:210,w:200,h:18,fontSize:10,fill:'light'},
      { key:'address2',x:20,y:228,w:200,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'light'},
      { key:'logo',x:350,y:15,w:80,h:80,type:'logo'},
      { key:'qr',x:362,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:60,w:100,h:100,type:'logo'},
      { key:'company_name',x:130,y:170,w:190,h:26,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:160,y:210,w:130,h:40,type:'social'},
    ],
  },
  { name: 'Right Aligned', name_mn: 'Баруун зэрэгцүүлэлт', type: 'corporate', canvas_data: { accent: '#1E3A8A', bg: '#FFFFFF', textDark: '#1E3A8A', textLight: '#64748B' },
    front_json: [
      { key:'logo',x:20,y:20,w:70,h:70,type:'logo'},
      { key:'company_name',x:200,y:15,w:230,h:24,fontSize:14,fontWeight:'bold',fill:'accent',align:'right'},
      { key:'full_name',x:180,y:80,w:250,h:30,fontSize:22,fontWeight:'bold',fill:'accent',align:'right'},
      { key:'job_title',x:250,y:112,w:180,h:20,fontSize:12,fill:'light',align:'right'},
      { key:'phone',x:280,y:170,w:150,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'email',x:250,y:190,w:180,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'address1',x:230,y:215,w:200,h:18,fontSize:10,fill:'light',align:'right'},
      { key:'website',x:280,y:248,w:150,h:18,fontSize:10,fill:'light',align:'right'},
    ],
    back_json: [
      { key:'logo',x:185,y:70,w:80,h:80,type:'logo'},
      { key:'company_name',x:120,y:165,w:210,h:26,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'qr',x:193,y:200,w:64,h:64,type:'qr'},
    ],
  },
  { name: 'Centered Modern', name_mn: 'Голчилсон орчин', type: 'creative', canvas_data: { accent: '#8B5CF6', bg: '#FFFFFF', textDark: '#1F1F1F', textLight: '#6B7280' },
    front_json: [
      { key:'full_name',x:100,y:30,w:250,h:32,fontSize:24,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'job_title',x:130,y:65,w:190,h:20,fontSize:12,fill:'light',align:'center'},
      { key:'company_name',x:120,y:90,w:210,h:22,fontSize:13,fontWeight:'bold',fill:'dark',align:'center'},
      { key:'phone',x:50,y:160,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:250,y:160,w:180,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'address1',x:120,y:200,w:210,h:18,fontSize:10,fill:'light',align:'center'},
      { key:'website',x:140,y:240,w:170,h:18,fontSize:10,fill:'accent',align:'center'},
      { key:'qr',x:20,y:200,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:50,w:100,h:100,type:'logo'},
      { key:'company_message',x:100,y:170,w:250,h:20,fontSize:12,fill:'light',align:'center'},
      { key:'social',x:150,y:210,w:150,h:40,type:'social'},
    ],
  },
  { name: 'Dark Gold', name_mn: 'Хар алтан', type: 'dark', canvas_data: { accent: '#F59E0B', bg: '#111111', textDark: '#FFFFFF', textLight: '#9CA3AF' },
    front_json: [
      { key:'company_name',x:20,y:15,w:200,h:22,fontSize:11,fontWeight:'bold',fill:'accent'},
      { key:'full_name',x:20,y:50,w:260,h:34,fontSize:26,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:88,w:200,h:20,fontSize:12,fill:'accent'},
      { key:'phone',x:20,y:180,w:160,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:200,w:200,h:18,fontSize:11,fill:'light'},
      { key:'website',x:20,y:220,w:170,h:18,fontSize:11,fill:'accent'},
      { key:'address1',x:20,y:248,w:200,h:18,fontSize:10,fill:'light'},
      { key:'logo',x:360,y:15,w:70,h:70,type:'logo'},
      { key:'qr',x:365,y:200,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:185,y:60,w:80,h:80,type:'logo'},
      { key:'company_name',x:120,y:155,w:210,h:24,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:170,y:215,w:110,h:40,type:'social'},
    ],
  },
  { name: 'Split Left', name_mn: 'Хуваагдсан зүүн', type: 'bold', canvas_data: { accent: '#EF4444', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
    front_json: [
      { key:'full_name',x:20,y:20,w:180,h:28,fontSize:20,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:52,w:180,h:18,fontSize:11,fill:'accent'},
      { key:'company_name',x:20,y:80,w:180,h:20,fontSize:12,fontWeight:'bold',fill:'dark'},
      { key:'phone',x:240,y:30,w:190,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'email',x:240,y:52,w:190,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'website',x:240,y:74,w:190,h:18,fontSize:11,fill:'light',align:'right'},
      { key:'address1',x:240,y:100,w:190,h:18,fontSize:10,fill:'light',align:'right'},
      { key:'logo',x:20,y:190,w:60,h:60,type:'logo'},
      { key:'qr',x:370,y:200,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:70,w:100,h:100,type:'logo'},
      { key:'social',x:155,y:195,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Minimal Clean', name_mn: 'Энгийн цэвэр', type: 'minimal', canvas_data: { accent: '#111111', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
    front_json: [
      { key:'full_name',x:30,y:40,w:250,h:30,fontSize:22,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:30,y:74,w:200,h:18,fontSize:11,fill:'light'},
      { key:'phone',x:30,y:170,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:30,y:192,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'website',x:30,y:214,w:170,h:18,fontSize:11,fill:'light'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'company_name',x:120,y:100,w:210,h:30,fontSize:20,fontWeight:'bold',fill:'dark',align:'center'},
      { key:'company_message',x:130,y:140,w:190,h:20,fontSize:11,fill:'light',align:'center'},
      { key:'logo',x:195,y:30,w:60,h:60,type:'logo'},
    ],
  },
  { name: 'Bold Name', name_mn: 'Том нэр', type: 'bold', canvas_data: { accent: '#FF6B00', bg: '#1F2937', textDark: '#FFFFFF', textLight: '#9CA3AF' },
    front_json: [
      { key:'full_name',x:20,y:20,w:350,h:40,fontSize:32,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:65,w:200,h:20,fontSize:13,fill:'accent'},
      { key:'company_name',x:20,y:90,w:200,h:20,fontSize:12,fill:'light'},
      { key:'phone',x:20,y:185,w:160,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:207,w:200,h:18,fontSize:11,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:360,y:20,w:70,h:70,type:'logo'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:60,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:175,w:250,h:28,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:155,y:215,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Green Nature', name_mn: 'Ногоон байгаль', type: 'creative', canvas_data: { accent: '#16A34A', bg: '#F0FDF4', textDark: '#14532D', textLight: '#4B7A5E' },
    front_json: [
      { key:'logo',x:20,y:20,w:60,h:60,type:'logo'},
      { key:'company_name',x:90,y:25,w:200,h:22,fontSize:13,fontWeight:'bold',fill:'dark'},
      { key:'company_message',x:90,y:50,w:200,h:18,fontSize:10,fill:'light'},
      { key:'full_name',x:20,y:110,w:250,h:28,fontSize:20,fontWeight:'bold',fill:'accent'},
      { key:'job_title',x:20,y:142,w:200,h:18,fontSize:11,fill:'light'},
      { key:'phone',x:20,y:195,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:20,y:215,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:20,y:245,w:200,h:18,fontSize:10,fill:'light'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:185,y:60,w:80,h:80,type:'logo'},
      { key:'company_name',x:120,y:160,w:210,h:24,fontSize:15,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'website',x:140,y:190,w:170,h:18,fontSize:11,fill:'light',align:'center'},
      { key:'social',x:160,y:220,w:130,h:35,type:'social'},
    ],
  },
  { name: 'Pink Modern', name_mn: 'Ягаан орчин', type: 'creative', canvas_data: { accent: '#EC4899', bg: '#FFF1F2', textDark: '#831843', textLight: '#9D174D' },
    front_json: [
      { key:'full_name',x:130,y:20,w:250,h:28,fontSize:20,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'job_title',x:150,y:52,w:210,h:18,fontSize:11,fill:'light',align:'center'},
      { key:'company_name',x:140,y:75,w:230,h:22,fontSize:12,fontWeight:'bold',fill:'dark',align:'center'},
      { key:'logo',x:20,y:20,w:80,h:80,type:'logo'},
      { key:'phone',x:30,y:180,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:30,y:200,w:180,h:18,fontSize:11,fill:'dark'},
      { key:'website',x:30,y:220,w:160,h:18,fontSize:10,fill:'accent'},
      { key:'social',x:300,y:170,w:80,h:80,type:'social'},
      { key:'qr',x:370,y:10,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:50,w:100,h:100,type:'logo'},
      { key:'company_message',x:100,y:170,w:250,h:20,fontSize:12,fill:'light',align:'center'},
    ],
  },
  { name: 'Gold Luxury', name_mn: 'Алтан тансаг', type: 'dark', canvas_data: { accent: '#D97706', bg: '#1C1917', textDark: '#FFFFFF', textLight: '#A8A29E' },
    front_json: [
      { key:'company_name',x:130,y:15,w:190,h:22,fontSize:12,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'full_name',x:100,y:55,w:250,h:32,fontSize:24,fontWeight:'bold',fill:'dark',align:'center'},
      { key:'job_title',x:140,y:92,w:170,h:18,fontSize:11,fill:'accent',align:'center'},
      { key:'phone',x:20,y:195,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:215,w:180,h:18,fontSize:11,fill:'light'},
      { key:'address1',x:20,y:245,w:200,h:18,fontSize:10,fill:'light'},
      { key:'website',x:290,y:245,w:140,h:18,fontSize:10,fill:'accent',align:'right'},
      { key:'qr',x:365,y:190,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:55,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:170,w:250,h:26,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:160,y:210,w:130,h:40,type:'social'},
    ],
  },
  { name: 'Sky Fresh', name_mn: 'Тэнгэрийн цэнхэр', type: 'business', canvas_data: { accent: '#38BDF8', bg: '#F0F9FF', textDark: '#0C4A6E', textLight: '#0369A1' },
    front_json: [
      { key:'logo',x:15,y:100,w:70,h:70,type:'logo'},
      { key:'company_name',x:100,y:15,w:230,h:22,fontSize:13,fontWeight:'bold',fill:'dark'},
      { key:'full_name',x:100,y:50,w:250,h:28,fontSize:20,fontWeight:'bold',fill:'accent'},
      { key:'job_title',x:100,y:82,w:200,h:18,fontSize:11,fill:'light'},
      { key:'phone',x:100,y:140,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:100,y:160,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:100,y:200,w:220,h:18,fontSize:10,fill:'light'},
      { key:'website',x:100,y:245,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'qr',x:370,y:200,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:180,y:60,w:90,h:90,type:'logo'},
      { key:'company_name',x:100,y:165,w:250,h:24,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'qr',x:193,y:200,w:64,h:64,type:'qr'},
    ],
  },
  { name: 'Dark Purple', name_mn: 'Хар нил ягаан', type: 'dark', canvas_data: { accent: '#A855F7', bg: '#0F0F1A', textDark: '#FFFFFF', textLight: '#9CA3AF' },
    front_json: [
      { key:'full_name',x:20,y:25,w:300,h:35,fontSize:28,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:65,w:200,h:20,fontSize:13,fill:'accent'},
      { key:'company_name',x:20,y:95,w:200,h:20,fontSize:11,fill:'light'},
      { key:'phone',x:20,y:190,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:212,w:200,h:18,fontSize:11,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:360,y:15,w:70,h:70,type:'logo'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:50,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:170,w:250,h:28,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:155,y:210,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Cyan Tech', name_mn: 'Технологи цэнхэр', type: 'corporate', canvas_data: { accent: '#06B6D4', bg: '#0F1A2E', textDark: '#FFFFFF', textLight: '#94A3B8' },
    front_json: [
      { key:'logo',x:20,y:15,w:60,h:60,type:'logo'},
      { key:'company_name',x:90,y:20,w:200,h:22,fontSize:13,fontWeight:'bold',fill:'accent'},
      { key:'company_message',x:90,y:46,w:200,h:18,fontSize:10,fill:'light'},
      { key:'full_name',x:20,y:100,w:260,h:30,fontSize:22,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:134,w:200,h:18,fontSize:11,fill:'accent'},
      { key:'phone',x:20,y:185,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:207,w:200,h:18,fontSize:11,fill:'light'},
      { key:'address1',x:20,y:245,w:200,h:18,fontSize:10,fill:'light'},
      { key:'social',x:340,y:100,w:80,h:80,type:'social'},
      { key:'qr',x:365,y:200,w:55,h:55,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:185,y:60,w:80,h:80,type:'logo'},
      { key:'company_name',x:100,y:160,w:250,h:24,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
    ],
  },
  { name: 'Rose Gold', name_mn: 'Ягаан алтан', type: 'creative', canvas_data: { accent: '#F43F5E', bg: '#FFF5F7', textDark: '#881337', textLight: '#BE123C' },
    front_json: [
      { key:'company_name',x:20,y:15,w:200,h:22,fontSize:11,fontWeight:'bold',fill:'accent'},
      { key:'full_name',x:20,y:55,w:260,h:30,fontSize:22,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:90,w:200,h:20,fontSize:12,fill:'accent'},
      { key:'phone',x:250,y:180,w:180,h:18,fontSize:11,fill:'dark',align:'right'},
      { key:'email',x:250,y:200,w:180,h:18,fontSize:11,fill:'dark',align:'right'},
      { key:'website',x:250,y:245,w:180,h:18,fontSize:10,fill:'accent',align:'right'},
      { key:'logo',x:370,y:10,w:65,h:65,type:'logo'},
      { key:'qr',x:20,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:55,w:100,h:100,type:'logo'},
      { key:'company_name',x:110,y:170,w:230,h:26,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:155,y:210,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Forest Dark', name_mn: 'Ойн ногоон', type: 'dark', canvas_data: { accent: '#22C55E', bg: '#0A1A0D', textDark: '#FFFFFF', textLight: '#86EFAC' },
    front_json: [
      { key:'company_name',x:20,y:12,w:200,h:22,fontSize:12,fontWeight:'bold',fill:'accent'},
      { key:'full_name',x:20,y:50,w:280,h:34,fontSize:26,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:90,w:200,h:18,fontSize:12,fill:'light'},
      { key:'phone',x:20,y:180,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:202,w:200,h:18,fontSize:11,fill:'light'},
      { key:'address1',x:20,y:230,w:200,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:250,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:355,y:15,w:75,h:75,type:'logo'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:185,y:55,w:80,h:80,type:'logo'},
      { key:'company_name',x:100,y:150,w:250,h:26,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:165,y:215,w:120,h:35,type:'social'},
    ],
  },
  { name: 'Indigo Clean', name_mn: 'Цэвэр индиго', type: 'corporate', canvas_data: { accent: '#4F46E5', bg: '#FFFFFF', textDark: '#312E81', textLight: '#6366F1' },
    front_json: [
      { key:'logo',x:20,y:15,w:65,h:65,type:'logo'},
      { key:'full_name',x:100,y:20,w:230,h:28,fontSize:20,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:100,y:52,w:200,h:18,fontSize:11,fill:'accent'},
      { key:'company_name',x:100,y:72,w:200,h:20,fontSize:12,fontWeight:'bold',fill:'dark'},
      { key:'phone',x:20,y:150,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:20,y:172,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:20,y:200,w:220,h:18,fontSize:10,fill:'light'},
      { key:'address2',x:20,y:218,w:220,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'qr',x:368,y:195,w:58,h:58,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:60,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:175,w:250,h:24,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:155,y:215,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Midnight Blue', name_mn: 'Шөнийн цэнхэр', type: 'dark', canvas_data: { accent: '#60A5FA', bg: '#0C1929', textDark: '#FFFFFF', textLight: '#93C5FD' },
    front_json: [
      { key:'full_name',x:20,y:30,w:300,h:35,fontSize:28,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:70,w:200,h:20,fontSize:13,fill:'accent'},
      { key:'company_name',x:20,y:100,w:200,h:20,fontSize:12,fill:'light'},
      { key:'phone',x:20,y:180,w:150,h:18,fontSize:11,fill:'light'},
      { key:'email',x:20,y:200,w:200,h:18,fontSize:11,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:360,y:20,w:70,h:70,type:'logo'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:55,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:170,w:250,h:26,fontSize:18,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:160,y:215,w:130,h:35,type:'social'},
    ],
  },
  { name: 'Warm Brown', name_mn: 'Дулаан хүрэн', type: 'business', canvas_data: { accent: '#B45309', bg: '#FFFBEB', textDark: '#78350F', textLight: '#92400E' },
    front_json: [
      { key:'company_name',x:20,y:12,w:200,h:22,fontSize:12,fontWeight:'bold',fill:'accent'},
      { key:'company_message',x:20,y:36,w:200,h:18,fontSize:10,fill:'light'},
      { key:'full_name',x:20,y:70,w:260,h:28,fontSize:20,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:102,w:200,h:18,fontSize:11,fill:'accent'},
      { key:'phone',x:20,y:170,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:20,y:192,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:20,y:220,w:220,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:350,y:15,w:80,h:80,type:'logo'},
      { key:'qr',x:362,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:185,y:60,w:80,h:80,type:'logo'},
      { key:'company_name',x:110,y:160,w:230,h:24,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:160,y:200,w:130,h:40,type:'social'},
    ],
  },
  { name: 'Slate Corporate', name_mn: 'Саарал корпорат', type: 'corporate', canvas_data: { accent: '#475569', bg: '#F8FAFC', textDark: '#1E293B', textLight: '#64748B' },
    front_json: [
      { key:'logo',x:20,y:15,w:65,h:65,type:'logo'},
      { key:'company_name',x:95,y:20,w:200,h:22,fontSize:13,fontWeight:'bold',fill:'dark'},
      { key:'company_message',x:95,y:45,w:200,h:18,fontSize:10,fill:'light'},
      { key:'full_name',x:20,y:105,w:250,h:28,fontSize:20,fontWeight:'bold',fill:'accent'},
      { key:'job_title',x:20,y:137,w:200,h:18,fontSize:11,fill:'light'},
      { key:'phone',x:20,y:185,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:20,y:205,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:20,y:230,w:220,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:250,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'qr',x:365,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:55,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:170,w:250,h:26,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'social',x:155,y:210,w:140,h:40,type:'social'},
    ],
  },
  { name: 'Teal Modern', name_mn: 'Орчин үеийн ногоон', type: 'business', canvas_data: { accent: '#14B8A6', bg: '#FFFFFF', textDark: '#111827', textLight: '#6B7280' },
    front_json: [
      { key:'company_name',x:20,y:15,w:200,h:22,fontSize:12,fontWeight:'bold',fill:'accent'},
      { key:'full_name',x:20,y:50,w:260,h:30,fontSize:22,fontWeight:'bold',fill:'dark'},
      { key:'job_title',x:20,y:85,w:200,h:20,fontSize:12,fill:'accent'},
      { key:'phone',x:20,y:150,w:150,h:18,fontSize:11,fill:'dark'},
      { key:'email',x:20,y:172,w:200,h:18,fontSize:11,fill:'dark'},
      { key:'address1',x:20,y:200,w:220,h:18,fontSize:10,fill:'light'},
      { key:'address2',x:20,y:218,w:220,h:18,fontSize:10,fill:'light'},
      { key:'website',x:20,y:248,w:170,h:18,fontSize:10,fill:'accent'},
      { key:'logo',x:350,y:15,w:80,h:80,type:'logo'},
      { key:'qr',x:362,y:195,w:60,h:60,type:'qr'},
    ],
    back_json: [
      { key:'logo',x:175,y:50,w:100,h:100,type:'logo'},
      { key:'company_name',x:100,y:165,w:250,h:26,fontSize:16,fontWeight:'bold',fill:'accent',align:'center'},
      { key:'company_message',x:120,y:195,w:210,h:18,fontSize:10,fill:'light',align:'center'},
      { key:'social',x:160,y:225,w:130,h:35,type:'social'},
    ],
  },
]

async function seed() {
  const token = await getToken()
  if (!token) { console.error('Login failed'); return }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // Delete existing layouts
  console.log('Fetching existing product...')
  const existing = await fetch(`${API}/admin/business-cards/${PRODUCT_ID}`, { headers }).then(r => r.json()).catch(() => null)
  if (existing?.layouts?.length) {
    console.log(`Deleting ${existing.layouts.length} existing layouts...`)
    for (const l of existing.layouts) {
      await fetch(`${API}/admin/business-cards/${PRODUCT_ID}/layouts/${l.id}`, { method: 'DELETE', headers }).catch(() => {})
    }
  }

  // Create 20 new layouts
  for (let i = 0; i < LAYOUTS.length; i++) {
    const l = LAYOUTS[i]
    const res = await fetch(`${API}/admin/business-cards/${PRODUCT_ID}/layouts`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...l, sort_order: i + 1 }),
    })
    const data = await res.json()
    console.log(`${i + 1}/20 ✓ ${l.name_mn} (${l.name})`, data?.id ? 'OK' : 'FAIL')
  }
  console.log('\nDone! 20 layouts created.')
}

seed().catch(console.error)
