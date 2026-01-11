
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Settings, 
  ClipboardList, 
  FileText, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Hash, 
  TypeIcon, 
  Pencil, 
  Edit 
} from './components/Icons';
import { Image as ImageIcon, Briefcase, Truck, HardDrive, List, Layers, Car, Bike, Construction, DollarSign, Wallet, Banknote, Search, PlusCircle, Star, Zap } from 'lucide-react';
import { FieldType, ChecklistField, ChecklistTemplate, ChecklistEntry, FieldOption } from './types';
import { extractVehicleInfo } from './services/geminiService';

const PRESET_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'preset-1',
    name: 'Instalação Empresa X',
    isFavorite: true,
    fields: [
      { id: 'p1-1', label: 'Dados do Veículo', type: FieldType.VEHICLE_INFO, required: true },
      { id: 'p1-2', label: 'Placa', type: FieldType.PLATE, required: true },
      { id: 'p1-3', label: 'IMEI do Rastreador', type: FieldType.IMEI, required: true },
      { id: 'p1-4', label: 'Foto da Instalação', type: FieldType.IMAGE, required: true },
    ]
  },
  {
    id: 'preset-2',
    name: 'Vistoria Rápida',
    isFavorite: true,
    fields: [
      { id: 'p2-1', label: 'Placa', type: FieldType.PLATE, required: true },
      { id: 'p2-2', label: 'Foto Frontal', type: FieldType.IMAGE, required: true },
      { id: 'p2-3', label: 'Foto Traseira', type: FieldType.IMAGE, required: true },
    ]
  }
];

const VEHICLE_DATABASE: Record<string, { icon: any, brands: Record<string, string[]> }> = {
  'Carro': { 
    icon: Car, 
    brands: {
      'Fiat': ['Uno', 'Palio', 'Argo', 'Cronos', 'Mobi', 'Toro', 'Strada', 'Pulse', 'Fastback'],
      'Volkswagen': ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Saveiro', 'Amarok', 'Jetta', 'Taos'],
      'Chevrolet': ['Onix', 'Onix Plus', 'Tracker', 'S10', 'Cruze', 'Spin', 'Montana', 'Equinox'],
      'Toyota': ['Corolla', 'Hilux', 'Yaris', 'SW4', 'Corolla Cross', 'Etios', 'Rav4'],
      'Honda': ['Civic', 'HR-V', 'City', 'Fit', 'CR-V', 'WR-V'],
      'Hyundai': ['HB20', 'HB20S', 'Creta', 'Tucson', 'Ix35', 'Santa Fe'],
      'Renault': ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Captur', 'Master'],
      'Jeep': ['Renegade', 'Compass', 'Commander', 'Grand Cherokee'],
    }
  },
  'Moto': { 
    icon: Bike, 
    brands: {
      'Honda': ['CG 160', 'Biz 125', 'NXR 160 Bros', 'CB 250F Twister', 'PCX 150', 'XRE 300'],
      'Yamaha': ['Fazer 250', 'Lander 250', 'Factor 150', 'NMAX 160', 'Crosser 150'],
      'BMW': ['G 310 GS', 'F 850 GS', 'R 1250 GS'],
    }
  },
  'Caminhão': { 
    icon: Truck, 
    brands: {
      'Mercedes-Benz': ['Accelo', 'Atego', 'Actros'],
      'Volvo': ['FH 460', 'FH 540', 'VM 270'],
      'Scania': ['R 450', 'R 500', 'G 410'],
    }
  }
};

const FIELD_TYPE_CONFIG: Record<FieldType, { label: string, icon: any, color: string }> = {
  [FieldType.TEXT]: { label: 'Texto', icon: TypeIcon, color: 'text-blue-500' },
  [FieldType.NUMBER]: { label: 'Número', icon: Hash, color: 'text-orange-500' },
  [FieldType.DATE]: { label: 'Data', icon: Calendar, color: 'text-purple-500' },
  [FieldType.CHECKBOX]: { label: 'Check', icon: CheckCircle2, color: 'text-green-500' },
  [FieldType.PLATE]: { label: 'Placa', icon: Car, color: 'text-slate-700' },
  [FieldType.IMEI]: { label: 'IMEI', icon: HardDrive, color: 'text-cyan-500' },
  [FieldType.SELECT]: { label: 'Lista', icon: List, color: 'text-indigo-500' },
  [FieldType.MULTIPLE]: { label: 'Múltiplo', icon: Layers, color: 'text-pink-500' },
  [FieldType.VEHICLE_INFO]: { label: 'Veículo', icon: Truck, color: 'text-amber-500' },
  [FieldType.IMAGE]: { label: 'Foto', icon: Camera, color: 'text-rose-500' },
  [FieldType.CURRENCY]: { label: 'Preço', icon: DollarSign, color: 'text-emerald-500' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'builder' | 'runner' | 'history'>('home');
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [currentEntry, setCurrentEntry] = useState<Partial<ChecklistEntry>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('templates');
    const savedEntries = localStorage.getItem('entries');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(PRESET_TEMPLATES); // Load defaults on first run
    }
    if (savedEntries) setEntries(JSON.parse(savedEntries));
  }, []);

  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  const calculatedTotal = useMemo(() => {
    if (!activeTemplate || !currentEntry.data) return 0;
    let sum = 0;
    activeTemplate.fields.forEach(field => {
      const selection = currentEntry.data![field.id];
      if (field.type === FieldType.SELECT && field.options) {
        const option = field.options.find(o => o.label === selection);
        if (option?.price) sum += option.price;
      } else if (field.type === FieldType.MULTIPLE && Array.isArray(selection) && field.options) {
        selection.forEach(selLabel => {
          const option = field.options?.find(o => o.label === selLabel);
          if (option?.price) sum += option.price;
        });
      } else if (field.type === FieldType.CURRENCY) {
        sum += Number(selection || 0);
      }
    });
    return sum;
  }, [activeTemplate, currentEntry.data]);

  const createNewTemplate = () => {
    const newTemplate: ChecklistTemplate = {
      id: crypto.randomUUID(),
      name: 'Novo Check-list',
      isFavorite: false,
      fields: [
        { id: crypto.randomUUID(), label: 'Dados do Veículo', type: FieldType.VEHICLE_INFO, required: true },
        { id: crypto.randomUUID(), label: 'Placa', type: FieldType.PLATE, required: true },
        { id: crypto.randomUUID(), label: 'Foto', type: FieldType.IMAGE, required: true },
      ]
    };
    setActiveTemplate(newTemplate);
    setView('builder');
  };

  const addFieldToTemplate = (type: FieldType) => {
    if (!activeTemplate) return;
    const newField: ChecklistField = {
      id: crypto.randomUUID(),
      label: FIELD_TYPE_CONFIG[type].label,
      type,
      required: false,
      options: (type === FieldType.SELECT || type === FieldType.MULTIPLE) ? [] : undefined
    };
    setActiveTemplate({
      ...activeTemplate,
      fields: [...activeTemplate.fields, newField]
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    setActiveTemplate({ ...activeTemplate, fields: newFields });
  };

  const updateFieldOptions = (fieldIndex: number, options: FieldOption[]) => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    newFields[fieldIndex].options = options;
    setActiveTemplate({ ...activeTemplate, fields: newFields });
  };

  const startChecklist = (template: ChecklistTemplate) => {
    setActiveTemplate(template);
    setCurrentEntry({
      id: crypto.randomUUID(),
      templateId: template.id,
      templateName: template.name,
      timestamp: Date.now(),
      data: {},
      photos: [],
      totalValue: 0
    });
    setView('runner');
  };

  const handleGlobalPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const result = await extractVehicleInfo(base64);
        const newData = { ...(currentEntry.data || {}) };
        if (activeTemplate) {
          activeTemplate.fields.forEach(field => {
            if (field.type === FieldType.PLATE && result.plate) newData[field.id] = result.plate;
            if (field.type === FieldType.VEHICLE_INFO) {
              const currentVal = newData[field.id] || { type: '', brand: '', model: '' };
              newData[field.id] = { ...currentVal, brand: result.brand || currentVal.brand, model: result.model || currentVal.model };
            }
            if (field.type === FieldType.IMEI && result.imei) newData[field.id] = result.imei;
          });
        }
        setCurrentEntry(prev => ({ ...prev, data: newData, photos: [...(prev.photos || []), base64] }));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setCurrentEntry(prev => ({ ...prev, data: { ...(prev.data || {}), [fieldId]: value } }));
  };

  const finalizeEntry = () => {
    if (!currentEntry.id || !activeTemplate) return;
    const final: ChecklistEntry = { ...(currentEntry as ChecklistEntry), timestamp: Date.now(), totalValue: calculatedTotal };
    setEntries(prev => [final, ...prev]);
    setView('home');
  };

  const renderVehicleInfoField = (field: ChecklistField) => {
    const val = (currentEntry.data?.[field.id] as any) || { type: '', brand: '', model: '' };
    const currentConfig = val.type ? VEHICLE_DATABASE[val.type] : null;
    const availableBrands = currentConfig ? Object.keys(currentConfig.brands) : [];
    const availableModels = (currentConfig && val.brand) ? currentConfig.brands[val.brand] || [] : [];

    return (
      <div className="space-y-6 p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-inner">
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(VEHICLE_DATABASE).map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = val.type === type;
            return (
              <button key={type} type="button" onClick={() => handleInputChange(field.id, { type, brand: '', model: '' })} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-transparent text-slate-400 hover:bg-slate-100'}`}>
                <Icon className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">{type}</span>
              </button>
            );
          })}
        </div>
        {val.type && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</p>
            <div className="flex flex-wrap gap-2">
              {availableBrands.map(brand => (
                <button key={brand} onClick={() => handleInputChange(field.id, { ...val, brand, model: '' })} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${val.brand === brand ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>{brand}</button>
              ))}
            </div>
          </div>
        )}
        {val.brand && (
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelos</p>
             <div className="flex flex-wrap gap-2">
               {availableModels.map(model => (
                 <button key={model} onClick={() => handleInputChange(field.id, { ...val, model })} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border-2 ${val.model === model ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>{model}</button>
               ))}
             </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
           <input type="text" value={val.brand || ''} onChange={e => handleInputChange(field.id, { ...val, brand: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm" placeholder="Marca" />
           <input type="text" value={val.model || ''} onChange={e => handleInputChange(field.id, { ...val, model: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm" placeholder="Modelo" />
        </div>
      </div>
    );
  };

  const favoriteTemplates = useMemo(() => templates.filter(t => t.isFavorite), [templates]);

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto bg-white shadow-xl relative font-sans">
      <header className="bg-indigo-600 text-white p-5 sticky top-0 z-50 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-white/20 p-2 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">CheckMaster</h1>
        </div>
        {view === 'home' && (
          <button onClick={() => setView('history')} className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition-all"><FileText className="w-5 h-5" /></button>
        )}
      </header>

      <main className="p-4">
        {view === 'home' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Quick Access Section */}
            {favoriteTemplates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Atalhos Rápidos</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {favoriteTemplates.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => startChecklist(t)}
                      className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-200 rounded-[2.5rem] text-left group hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                      <div className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-slate-800 uppercase text-sm leading-tight group-hover:text-indigo-700">{t.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Clique para iniciar</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Meus Modelos</h2>
                <button onClick={createNewTemplate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all uppercase tracking-widest"><Plus className="w-4 h-4" /> NOVO MODELO</button>
              </div>
              <div className="grid gap-4">
                {templates.map(t => (
                  <div key={t.id} className="bg-white border-2 border-slate-50 p-6 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                    <div className="flex-1 cursor-pointer" onClick={() => startChecklist(t)}>
                      <h3 className="font-black text-slate-800 uppercase text-lg group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{t.fields.length} campos</span>
                        {t.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setActiveTemplate(t); setView('builder'); }} className="p-3 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { if(confirm('Excluir modelo?')) setTemplates(prev => prev.filter(x => x.id !== t.id)); }} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'builder' && activeTemplate && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b pb-6 gap-4">
              <div className="flex-1 flex items-center gap-4">
                <button 
                  onClick={() => setActiveTemplate({...activeTemplate, isFavorite: !activeTemplate.isFavorite})} 
                  className={`p-3 rounded-2xl transition-all ${activeTemplate.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`}
                >
                  <Star className={`w-6 h-6 ${activeTemplate.isFavorite ? 'fill-amber-500' : ''}`} />
                </button>
                <input value={activeTemplate.name} onChange={e => setActiveTemplate({...activeTemplate, name: e.target.value})} className="text-2xl font-black outline-none w-full bg-transparent text-indigo-600 uppercase placeholder:text-slate-200" placeholder="NOME DO MODELO" />
              </div>
              <button onClick={() => setView('home')} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-6">
              {activeTemplate.fields.map((f, i) => (
                <div key={f.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6 relative group shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveField(i, 'up')} disabled={i === 0} className={`p-1 rounded-md transition-all ${i === 0 ? 'text-slate-200' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}><ChevronUp className="w-5 h-5" /></button>
                      <button onClick={() => moveField(i, 'down')} disabled={i === activeTemplate.fields.length - 1} className={`p-1 rounded-md transition-all ${i === activeTemplate.fields.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}><ChevronDown className="w-5 h-5" /></button>
                    </div>
                    <input value={f.label} onChange={e => {
                      const n = [...activeTemplate.fields]; n[i].label = e.target.value; setActiveTemplate({...activeTemplate, fields: n});
                    }} className="font-bold outline-none bg-transparent flex-1 text-slate-800 text-lg" placeholder="Nome do Campo" />
                    <button onClick={() => setActiveTemplate({...activeTemplate, fields: activeTemplate.fields.filter(x => x.id !== f.id)})} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Campo</label>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {Object.values(FieldType).map((type) => {
                        const config = FIELD_TYPE_CONFIG[type];
                        const isSelected = f.type === type;
                        const Icon = config.icon;
                        return (
                          <button 
                            key={type} 
                            onClick={() => {
                              const n = [...activeTemplate.fields];
                              n[i].type = type;
                              if (type === FieldType.SELECT || type === FieldType.MULTIPLE) n[i].options = n[i].options || [];
                              setActiveTemplate({...activeTemplate, fields: n});
                            }}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-transparent text-slate-400 hover:bg-slate-100'}`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : config.color}`} />
                            <span className="text-[8px] font-black uppercase text-center leading-tight">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(f.type === FieldType.SELECT || f.type === FieldType.MULTIPLE) && (
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Opções da Lista</label>
                        <button onClick={() => {
                          const n = [...(f.options || [])]; n.push({ label: '', price: 0 }); updateFieldOptions(i, n);
                        }} className="text-indigo-600 text-[9px] font-black uppercase flex items-center gap-1 hover:underline"><PlusCircle className="w-4 h-4" /> Adicionar Opção</button>
                      </div>
                      <div className="space-y-2">
                        {f.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input value={opt.label} onChange={e => {
                              const n = [...f.options!]; n[optIdx].label = e.target.value; updateFieldOptions(i, n);
                            }} className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold border-0 outline-none focus:ring-2 ring-indigo-200" placeholder="Nome" />
                            <input type="number" value={opt.price || ''} onChange={e => {
                              const n = [...f.options!]; n[optIdx].price = Number(e.target.value); updateFieldOptions(i, n);
                            }} className="w-20 p-3 bg-slate-50 rounded-xl text-xs font-bold border-0 outline-none focus:ring-2 ring-indigo-200 text-right" placeholder="0" />
                            <button onClick={() => {
                              const n = f.options!.filter((_, idx) => idx !== optIdx); updateFieldOptions(i, n);
                            }} className="p-2 text-slate-200 hover:text-red-500"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <input type="checkbox" id={`req-${f.id}`} checked={f.required} onChange={e => {
                      const n = [...activeTemplate.fields]; n[i].required = e.target.checked; setActiveTemplate({...activeTemplate, fields: n});
                    }} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor={`req-${f.id}`} className="text-[10px] font-black uppercase text-slate-400 cursor-pointer select-none">Obrigatório</label>
                  </div>
                </div>
              ))}
              <button onClick={() => addFieldToTemplate(FieldType.TEXT)} className="w-full border-2 border-dashed border-slate-200 p-8 rounded-[3rem] text-slate-300 font-black uppercase text-[11px] hover:border-indigo-200 hover:text-indigo-400 transition-all">+ Adicionar Campo</button>
            </div>
            
            <button onClick={() => { setTemplates(prev => [...prev.filter(x => x.id !== activeTemplate.id), activeTemplate]); setView('home'); }} className="w-full bg-indigo-600 text-white p-7 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"><Save className="w-6 h-6" /> SALVAR FORMULÁRIO</button>
          </div>
        )}

        {view === 'runner' && activeTemplate && (
          <div className="space-y-8 pb-48 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black uppercase text-slate-800 leading-tight">{activeTemplate.name}</h2>
              </div>
              <button onClick={() => setView('home')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex gap-4 sticky top-20 z-40 bg-white/95 p-3 rounded-[2.5rem] backdrop-blur-md border-2 border-slate-50 shadow-2xl">
              <button onClick={() => cameraInputRef.current?.click()} className="flex-1 bg-indigo-600 text-white p-6 rounded-[2rem] flex flex-col items-center shadow-lg active:scale-95 transition-all"><Camera className="w-8 h-8 mb-1" /><span className="text-[9px] font-black uppercase tracking-widest">Scanner IA</span></button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex-1 bg-slate-100 text-slate-600 p-6 rounded-[2rem] flex flex-col items-center active:scale-95 transition-all"><ImageIcon className="w-8 h-8 mb-1" /><span className="text-[9px] font-black uppercase tracking-widest">Galeria</span></button>
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleGlobalPhoto} />
              <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleGlobalPhoto} />
            </div>

            {isProcessing && (
              <div className="p-16 bg-indigo-50 border-4 border-dashed border-indigo-200 rounded-[3.5rem] flex flex-col items-center gap-6 text-indigo-600 animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="font-black text-xs uppercase tracking-widest">Processando Inteligência Artificial...</p>
              </div>
            )}

            <div className="space-y-12">
              {activeTemplate.fields.map(f => (
                <div key={f.id} className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-400 ml-5 tracking-widest flex items-center gap-2">
                    {f.label} {f.required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  
                  {f.type === FieldType.VEHICLE_INFO ? (
                    renderVehicleInfoField(f)
                  ) : f.type === FieldType.SELECT ? (
                    <div className="grid grid-cols-2 gap-3">
                       {f.options?.map(opt => (
                         <button key={opt.label} onClick={() => handleInputChange(f.id, opt.label)} className={`p-5 rounded-[1.8rem] text-xs font-black transition-all border-2 text-center shadow-sm uppercase ${currentEntry.data?.[f.id] === opt.label ? 'bg-indigo-600 border-indigo-600 text-white scale-[1.03]' : 'bg-white border-slate-100 text-slate-500'}`}>
                           {opt.label} {opt.price ? `(+R$ ${opt.price})` : ''}
                         </button>
                       ))}
                    </div>
                  ) : f.type === FieldType.MULTIPLE ? (
                    <div className="grid grid-cols-2 gap-3">
                       {f.options?.map(opt => {
                         const selections = (currentEntry.data?.[f.id] as string[]) || [];
                         const isSelected = selections.includes(opt.label);
                         return (
                           <button key={opt.label} onClick={() => {
                             const n = isSelected ? selections.filter(s => s !== opt.label) : [...selections, opt.label];
                             handleInputChange(f.id, n);
                           }} className={`p-5 rounded-[1.8rem] text-xs font-black transition-all border-2 text-center shadow-sm uppercase ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>
                             {opt.label} {opt.price ? `(+R$ ${opt.price})` : ''}
                           </button>
                         );
                       })}
                    </div>
                  ) : f.type === FieldType.PLATE ? (
                    <div className="relative">
                       <input value={String(currentEntry.data?.[f.id] || '')} onChange={e => handleInputChange(f.id, e.target.value.toUpperCase())} className="w-full p-10 bg-slate-900 text-white rounded-[3rem] font-mono text-5xl text-center uppercase tracking-[0.2em] border-8 border-slate-800 focus:border-indigo-600 outline-none shadow-2xl transition-all" placeholder="ABC-1234" />
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest border-4 border-slate-900 shadow-xl">BRASIL</div>
                    </div>
                  ) : f.type === FieldType.IMAGE ? (
                    <div className="relative aspect-square md:aspect-video bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3.5rem] overflow-hidden group/img hover:border-indigo-300 transition-all">
                      {currentEntry.data?.[f.id] ? (
                        <>
                          <img src={currentEntry.data[f.id]} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => handleInputChange(f.id, null)} className="p-8 bg-red-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"><Trash2 className="w-10 h-10" /></button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-8 cursor-pointer" onClick={() => {
                            const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.capture = 'environment';
                            i.onchange = (ev: any) => { const fr = new FileReader(); fr.onload = (re) => handleInputChange(f.id, re.target?.result as string); fr.readAsDataURL(ev.target.files[0]); }; i.click();
                        }}>
                          <div className="p-10 bg-white rounded-[2.5rem] shadow-xl text-indigo-600 hover:scale-105 active:scale-95 transition-all"><Camera className="w-14 h-14" /></div>
                          <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Tirar Foto Obrigatória</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input value={String(currentEntry.data?.[f.id] || '')} onChange={e => handleInputChange(f.id, e.target.value)} className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] outline-none focus:border-indigo-600 font-black text-slate-800 text-xl shadow-sm transition-all" placeholder="Toque para digitar..." />
                  )}
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto p-8 bg-white/95 backdrop-blur-2xl border-t-4 border-slate-50 z-50 rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
               <div className="flex items-center justify-between mb-8 px-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Ganhos neste Checklist</p>
                    <p className="text-4xl font-black text-indigo-600">{formatCurrency(calculatedTotal)}</p>
                  </div>
                  <div className={`p-5 rounded-3xl transition-all ${activeTemplate.fields.length === Object.keys(currentEntry.data || {}).length ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-200'}`}>
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
               </div>
               <button onClick={finalizeEntry} className="w-full bg-indigo-600 text-white p-8 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-sm tracking-[0.3em] flex items-center justify-center gap-4">
                 FINALIZAR E ENVIAR <Zap className="w-5 h-5 fill-white" />
               </button>
            </div>
          </div>
        )}

        {view === 'history' && (
           <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <div className="flex items-center gap-5">
                 <button onClick={() => setView('home')} className="p-4 bg-white border-2 border-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                 <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight">Fluxo de Caixa</h2>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[4rem] text-white shadow-2xl flex items-center justify-between relative overflow-hidden">
                 <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Total Recebido</p>
                    <h3 className="text-5xl font-black">{formatCurrency(entries.reduce((a,c) => a + (c.totalValue || 0), 0))}</h3>
                    <div className="mt-4 inline-block px-4 py-1.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">{entries.length} serviços realizados</div>
                 </div>
                 <Banknote className="w-20 h-20 opacity-30 relative z-10" />
              </div>
              <div className="grid gap-6">
                 {entries.map(e => (
                    <div key={e.id} className="p-8 bg-white border-4 border-slate-50 rounded-[4rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-indigo-100 hover:shadow-xl transition-all">
                       <div className="flex gap-6 items-center flex-1">
                          <div className="w-24 h-24 flex-shrink-0">
                             {e.photos?.[0] ? <img src={e.photos[0]} className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-lg" /> : <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300"><ImageIcon className="w-10 h-10" /></div>}
                          </div>
                          <div>
                             <h4 className="font-black uppercase text-slate-800 text-xl tracking-tight leading-tight">{e.templateName}</h4>
                             <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4 text-slate-300" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(e.timestamp).toLocaleString('pt-BR')}</p>
                             </div>
                          </div>
                       </div>
                       <div className="text-center md:text-right flex flex-col gap-3">
                          <p className="text-3xl font-black text-green-600">{formatCurrency(e.totalValue)}</p>
                          <div className="flex gap-2 justify-center md:justify-end">
                             <button onClick={() => { startChecklist(templates.find(t => t.id === e.templateId) || templates[0]); setCurrentEntry(e); setView('runner'); }} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><ChevronRight className="w-6 h-6" /></button>
                             <button onClick={() => { if(confirm('Remover registro?')) setEntries(prev => prev.filter(x => x.id !== e.id)); }} className="p-4 text-slate-100 hover:text-red-500 transition-colors"><Trash2 className="w-6 h-6" /></button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t-2 border-slate-50 flex items-center justify-around p-6 max-w-2xl mx-auto z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-2 p-4 flex-1 rounded-[2.5rem] transition-all duration-300 ${view === 'home' || view === 'builder' ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-slate-300'}`}>
          <Zap className={`w-8 h-8 ${view === 'home' || view === 'builder' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Painel</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-2 p-4 flex-1 rounded-[2.5rem] transition-all duration-300 ${view === 'history' ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-slate-300'}`}>
          <DollarSign className={`w-8 h-8 ${view === 'history' ? 'scale-110' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Ganhos</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
