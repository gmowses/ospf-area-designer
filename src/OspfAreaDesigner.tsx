import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Plus, Trash2, Network } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'OSPF Area Designer',
    subtitle: 'Visually design OSPF areas, inspect LSA propagation rules and identify ABR/ASBR roles.',
    addArea: 'Add Area',
    areas: 'Areas',
    areaId: 'Area ID',
    areaType: 'Area Type',
    hasAsbr: 'Has ASBR',
    isAbr: 'Is ABR',
    removeArea: 'Remove',
    noAreas: 'No areas added yet. Add an area to get started.',
    diagram: 'Visual Diagram',
    lsaTable: 'LSA Propagation by Area Type',
    lsaType: 'LSA Type',
    backbone: 'Backbone',
    normal: 'Normal',
    stub: 'Stub',
    totallyStub: 'Totally Stub',
    nssa: 'NSSA',
    totallyNssa: 'Totally NSSA',
    areaTypes: { backbone: 'Backbone (0)', normal: 'Normal', stub: 'Stub', totallyStub: 'Totally Stub', nssa: 'NSSA', totallyNssa: 'Totally NSSA' },
    lsaTypes: {
      'Type 1': 'Router LSA',
      'Type 2': 'Network LSA',
      'Type 3': 'Summary Net LSA',
      'Type 4': 'Summary ASBR LSA',
      'Type 5': 'AS-External LSA',
      'Type 7': 'NSSA External LSA',
    },
    yes: 'Yes',
    no: 'No',
    partial: 'Default only',
    abrNote: 'ABR: connects this area to Area 0 (Backbone)',
    asbrNote: 'ASBR: redistributes external routes into OSPF',
    configureArea: 'Configure Area',
    areaIdPlaceholder: 'e.g. 1',
    references: 'References',
    refList: ['RFC 2328 - OSPF Version 2', 'RFC 3101 - OSPF NSSA Option'],
    builtBy: 'Built by',
  },
  pt: {
    title: 'Designer de Areas OSPF',
    subtitle: 'Projete areas OSPF visualmente, inspecione regras de propagacao de LSA e identifique papeis ABR/ASBR.',
    addArea: 'Adicionar Area',
    areas: 'Areas',
    areaId: 'ID da Area',
    areaType: 'Tipo de Area',
    hasAsbr: 'Tem ASBR',
    isAbr: 'E ABR',
    removeArea: 'Remover',
    noAreas: 'Nenhuma area adicionada. Adicione uma area para comecar.',
    diagram: 'Diagrama Visual',
    lsaTable: 'Propagacao de LSA por Tipo de Area',
    lsaType: 'Tipo de LSA',
    backbone: 'Backbone',
    normal: 'Normal',
    stub: 'Stub',
    totallyStub: 'Totalmente Stub',
    nssa: 'NSSA',
    totallyNssa: 'Totalmente NSSA',
    areaTypes: { backbone: 'Backbone (0)', normal: 'Normal', stub: 'Stub', totallyStub: 'Totalmente Stub', nssa: 'NSSA', totallyNssa: 'Totalmente NSSA' },
    lsaTypes: {
      'Type 1': 'LSA de Roteador',
      'Type 2': 'LSA de Rede',
      'Type 3': 'LSA Sumario de Rede',
      'Type 4': 'LSA Sumario ASBR',
      'Type 5': 'LSA Externo AS',
      'Type 7': 'LSA Externo NSSA',
    },
    yes: 'Sim',
    no: 'Nao',
    partial: 'Apenas rota padrao',
    abrNote: 'ABR: conecta esta area a Area 0 (Backbone)',
    asbrNote: 'ASBR: redistribui rotas externas no OSPF',
    configureArea: 'Configurar Area',
    areaIdPlaceholder: 'ex: 1',
    references: 'Referencias',
    refList: ['RFC 2328 - OSPF Versao 2', 'RFC 3101 - Opcao NSSA do OSPF'],
    builtBy: 'Criado por',
  },
} as const

type Lang = keyof typeof translations
type AreaType = 'backbone' | 'normal' | 'stub' | 'totallyStub' | 'nssa' | 'totallyNssa'

interface OspfArea {
  id: string
  areaId: string
  type: AreaType
  hasAsbr: boolean
  isAbr: boolean
}

// LSA propagation matrix: [T1, T2, T3, T4, T5, T7]
const LSA_RULES: Record<AreaType, (string)[]> = {
  backbone:    ['yes', 'yes', 'yes', 'yes', 'yes', 'no'],
  normal:      ['yes', 'yes', 'yes', 'yes', 'yes', 'no'],
  stub:        ['yes', 'yes', 'yes', 'no',  'no',  'no'],
  totallyStub: ['yes', 'yes', 'partial', 'no', 'no', 'no'],
  nssa:        ['yes', 'yes', 'yes', 'no',  'no',  'yes'],
  totallyNssa: ['yes', 'yes', 'partial', 'no', 'no', 'yes'],
}

const AREA_COLORS: Record<AreaType, string> = {
  backbone:    'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  normal:      'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
  stub:        'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300',
  totallyStub: 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300',
  nssa:        'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
  totallyNssa: 'bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-300',
}

const AREA_DOT: Record<AreaType, string> = {
  backbone:    'bg-blue-500',
  normal:      'bg-green-500',
  stub:        'bg-yellow-500',
  totallyStub: 'bg-orange-500',
  nssa:        'bg-purple-500',
  totallyNssa: 'bg-pink-500',
}

const LSA_COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'Type 1', label: 'T1' },
  { key: 'Type 2', label: 'T2' },
  { key: 'Type 3', label: 'T3' },
  { key: 'Type 4', label: 'T4' },
  { key: 'Type 5', label: 'T5' },
  { key: 'Type 7', label: 'T7' },
]

let uid = 0

export default function OspfAreaDesigner() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [areas, setAreas] = useState<OspfArea[]>([
    { id: 'default-0', areaId: '0', type: 'backbone', hasAsbr: false, isAbr: false },
  ])
  const [newAreaId, setNewAreaId] = useState('')
  const [newAreaType, setNewAreaType] = useState<AreaType>('normal')
  const [newHasAsbr, setNewHasAsbr] = useState(false)
  const [newIsAbr, setNewIsAbr] = useState(false)

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const addArea = () => {
    const id = newAreaId.trim()
    if (!id) return
    setAreas(prev => [...prev, { id: `area-${uid++}`, areaId: id, type: newAreaType, hasAsbr: newHasAsbr, isAbr: newIsAbr }])
    setNewAreaId('')
    setNewAreaType('normal')
    setNewHasAsbr(false)
    setNewIsAbr(false)
  }

  const removeArea = (id: string) => setAreas(prev => prev.filter(a => a.id !== id))

  const areaTypeOptions: AreaType[] = ['backbone', 'normal', 'stub', 'totallyStub', 'nssa', 'totallyNssa']

  function cellVal(val: string) {
    if (val === 'yes') return { text: t.yes, cls: 'text-green-600 dark:text-green-400 font-semibold' }
    if (val === 'no') return { text: t.no, cls: 'text-red-500 dark:text-red-400' }
    return { text: t.partial, cls: 'text-yellow-600 dark:text-yellow-400 text-[10px]' }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Network size={18} className="text-white" />
            </div>
            <span className="font-semibold">OSPF Area Designer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/ospf-area-designer" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Add Area Panel */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <h2 className="font-semibold">{t.configureArea}</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{t.areaId}</label>
                  <input
                    type="text"
                    value={newAreaId}
                    onChange={e => setNewAreaId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addArea()}
                    placeholder={t.areaIdPlaceholder}
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{t.areaType}</label>
                  <select
                    value={newAreaType}
                    onChange={e => setNewAreaType(e.target.value as AreaType)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {areaTypeOptions.map(at => (
                      <option key={at} value={at}>{t.areaTypes[at]}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newIsAbr} onChange={e => setNewIsAbr(e.target.checked)} className="h-4 w-4 accent-blue-500 rounded" />
                  <span className="text-sm">{t.isAbr}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newHasAsbr} onChange={e => setNewHasAsbr(e.target.checked)} className="h-4 w-4 accent-blue-500 rounded" />
                  <span className="text-sm">{t.hasAsbr}</span>
                </label>

                <button
                  onClick={addArea}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={15} />{t.addArea}
                </button>
              </div>

              {/* Legend */}
              <div className="pt-2 space-y-1.5">
                {areaTypeOptions.map(at => (
                  <div key={at} className="flex items-center gap-2 text-xs">
                    <span className={`w-3 h-3 rounded-full ${AREA_DOT[at]}`} />
                    <span className="text-zinc-500 dark:text-zinc-400">{t.areaTypes[at]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagram */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h2 className="font-semibold mb-4">{t.diagram}</h2>
                {areas.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">{t.noAreas}</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {/* Backbone always shown if present */}
                    {areas.map(area => (
                      <div key={area.id} className={`relative rounded-xl border-2 p-4 min-w-[130px] ${AREA_COLORS[area.type]}`}>
                        <div className="text-xs font-bold uppercase tracking-wide mb-1">{t.areaTypes[area.type]}</div>
                        <div className="text-lg font-mono font-bold">Area {area.areaId}</div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {area.isAbr && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-500/40">ABR</span>
                          )}
                          {area.hasAsbr && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/30 text-red-700 dark:text-red-300 font-medium border border-red-500/40">ASBR</span>
                          )}
                        </div>
                        {area.id !== 'default-0' && (
                          <button
                            onClick={() => removeArea(area.id)}
                            className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            title={t.removeArea}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <p><span className="font-semibold text-blue-500">ABR</span> — {t.abrNote}</p>
                  <p><span className="font-semibold text-red-500">ASBR</span> — {t.asbrNote}</p>
                </div>
              </div>

              {/* LSA Table */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 overflow-x-auto">
                <h2 className="font-semibold mb-4">{t.lsaTable}</h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-wide text-zinc-400 font-medium">{t.lsaType}</th>
                      {LSA_COLUMNS.map(col => (
                        <th key={col.key} className="text-center py-2 px-2 text-xs uppercase tracking-wide text-zinc-400 font-medium" title={t.lsaTypes[col.key as keyof typeof t.lsaTypes]}>
                          {col.label}
                          <div className="text-[9px] normal-case font-normal">{t.lsaTypes[col.key as keyof typeof t.lsaTypes].split(' ').slice(0,1).join('')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {areaTypeOptions.map(at => {
                      const rules = LSA_RULES[at]
                      return (
                        <tr key={at} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${AREA_DOT[at]}`} />
                              <span className="font-medium text-xs">{t.areaTypes[at]}</span>
                            </div>
                          </td>
                          {rules.map((val, i) => {
                            const { text, cls } = cellVal(val)
                            return (
                              <td key={i} className={`text-center py-2 px-2 text-xs ${cls}`}>{text}</td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-[10px] text-zinc-400">T1=Router, T2=Network, T3=Summary Net, T4=Summary ASBR, T5=AS-External, T7=NSSA External</p>
              </div>
            </div>
          </div>

          {/* References */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold mb-3">{t.references}</h2>
            <ul className="space-y-1">
              {t.refList.map(ref => (
                <li key={ref} className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>{ref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
