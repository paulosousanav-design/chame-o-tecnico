'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface OrdenServico {
  id: string; 
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_endereco: string;
  categoria: string;
  sintomas: string;
  marca_modelo: string;
  status_triagem: string; 
  tecnico_id?: string | null;
  created_at?: string; 
}

interface TecnicoParceiro {
  id: string; 
  nome_fantasia: string;
  nome: string;
  whatsapp: string;
  cep?: string; 
}

export default function PainelAdminCompleto() {
  const [chamados, setChamados] = useState<OrdenServico[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoParceiro[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroEquipamento, setFiltroEquipamento] = useState('Todas');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      
      const { data: dataOS, error: errorOS } = await supabase
        .from('ordens_servico')
        .select('*');

      if (errorOS) throw errorOS;
      
      setChamados((dataOS || []).map(os => ({
        ...os,
        id: String(os.id),
        tecnico_id: os.tecnico_id ? String(os.tecnico_id) : null
      })));

      let { data: dataTecnicos, error: errorTecnicos } = await supabase
        .from('parceiros_comerciais')
        .select('id, nome_fantasia, nome, whatsapp, cep');

      if (errorTecnicos) {
        const { data: dataVelha } = await supabase
          .from('tecnicos_parceiros')
          .select('id, nome_fantasia, nome, whatsapp');
        dataTecnicos = dataVelha;
      }
      
      setTecnicos((dataTecnicos || []).map(tec => ({ ...tec, id: String(tec.id) })));

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleVincularTecnico = async (osId: string, tecnicoId: string) => {
    const valorId = (tecnicoId === '' || tecnicoId === 'none' || !tecnicoId) ? null : tecnicoId;
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ tecnico_id: valorId })
        .eq('id', osId); 

      if (error) throw error;
      setChamados(prev => prev.map(os => os.id === osId ? { ...os, tecnico_id: valorId } : os));
      alert('Parceiro designado com sucesso!');
    } catch (err: any) {
      alert(`Erro ao vincular: ${err.message}`);
    }
  };

  const handleAtualizarStatus = async (osId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ status_triagem: novoStatus })
        .eq('id', osId);

      if (error) throw error;
      setChamados(prev => prev.map(os => os.id === osId ? { ...os, status_triagem: novoStatus } : os));
    } catch (err: any) {
      alert(`Erro ao atualizar status: ${err.message}`);
    }
  };

  const handleEncaminharWhats = (os: OrdenServico) => {
    const tecnico = tecnicos.find(t => t.id === os.tecnico_id);
    if (!tecnico) {
      alert('Selecione um técnico antes de encaminhar.');
      return;
    }
    const foneTecnico = tecnico.whatsapp.replace(/\D/g, '');
    
    // SINTAXE CORRIGIDA: Injeção de variáveis via template string com ${}
    const linkRotaMaps = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(tecnico.cep || '')}&destination=${encodeURIComponent(os.cliente_endereco)}`;
    
    const mensagem = encodeURIComponent(
      `⚡ *NOVA ORDEM DE SERVIÇO DISPONÍVEL*\n\n` +
      `Olá *${tecnico.nome_fantasia || tecnico.nome}*,\n` +
      `Temos um novo chamado qualificado para a sua rede:\n\n` +
      `🛠️ *Categoria:* ${os.categoria}\n` +
      `🏷️ *Marca/Modelo:* ${os.marca_modelo || 'Não informada'}\n` +
      `📝 *Sintomas Relatados:* ${os.sintomas}\n\n` +
      `📍 *ENDEREÇO DE VISITA:*\n` +
      `• ${os.cliente_endereco}\n\n` +
      `🗺️ *ROTA GOOGLE MAPS:* ${linkRotaMaps}\n\n` +
      `👤 *CONTATO DO CLIENTE:*\n` +
      `• *Nome:* ${os.cliente_nome}\n` +
      `• *WhatsApp:* https://wa.me/${os.cliente_whatsapp.replace(/\D/g, '')}\n\n` +
      `Por favor, entre em contato para alinhar a manutenção.`
    );
    window.open(`https://api.whatsapp.com/send?phone=55${foneTecnico}&text=${mensagem}`, '_blank');
  };

  const obterDiasNumérico = (dataCriacao?: string): number => {
    if (!dataCriacao) return 0;
    const dataOs = new Date(dataCriacao);
    const hoje = new Date();
    const diferencaTempo = hoje.getTime() - dataOs.getTime();
    return Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));
  };

  const chamadosFiltrados = chamados.filter((os) => {
    const bateEquipamento = filtroEquipamento === 'Todas' || os.categoria === filtroEquipamento;
    const bateStatus = filtroStatus === 'Todos' || os.status_triagem === filtroStatus;
    return bateEquipamento && bateStatus;
  });

  const chamadosOrdenados = [...chamadosFiltrados].sort((a, b) => {
    const aConcluido = a.status_triagem === 'concluido' ? 1 : 0;
    const bConcluido = b.status_triagem === 'concluido' ? 1 : 0;
    if (aConcluido !== bConcluido) return aConcluido - bConcluido;
    return obterDiasNumérico(b.created_at) - obterDiasNumérico(a.created_at);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1026] text-[#FFFFFF] flex items-center justify-center font-sans">
        <p className="text-sm font-bold tracking-widest text-[#FF7A00] uppercase animate-pulse">Carregando Painel Unificado...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1026] p-6 font-sans text-[#FFFFFF]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <header className="flex flex-col gap-4 border-b border-[#2E3B63] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#FFFFFF] uppercase tracking-tight italic">
                PAINEL CENTRAL <span className="text-[#FF7A00] font-light">| MONITORAMENTO</span>
              </h1>
              <p className="text-[#B8C0CC] text-xs font-medium mt-0.5">Triagem inteligente com rastreio de SLA e logística</p>
            </div>
            <button onClick={fetchDados} className="bg-[#FF7A00] hover:bg-[#FF9200] text-[#FFFFFF] text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20 uppercase tracking-wider italic">
              🔄 Atualizar Painel
            </button>
          </div>

          {/* Filtros Categoria */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-[#B8C0CC] uppercase tracking-widest block px-1">Filtrar por Equipamento</label>
            <div className="flex flex-wrap gap-2">
              {['Todas', 'Refrigeradores e Freezers', 'Máquina de Lavar / Lava e Seca', 'Ar Condicionado / Circuladores', 'Smart TVs'].map((cat) => (
                <button key={cat} onClick={() => setFiltroEquipamento(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                    filtroEquipamento === cat 
                      ? 'bg-[#FF7A00] text-[#FFFFFF] border-[#FF7A00] shadow-md shadow-[#FF7A00]/10' 
                      : 'bg-[#16213E] border-[#2E3B63] text-[#B8C0CC] hover:text-[#FFFFFF]'
                  }`}>
                  {cat === 'Todas' ? 'Ver Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#B8C0CC] uppercase tracking-widest block px-1">Filtrar por Status</label>
            <div className="flex flex-wrap gap-2">
              {['Todos', 'pendente', 'em atendimento', 'aguardando_peca', 'concluido'].map((st) => (
                <button key={st} onClick={() => setFiltroStatus(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    filtroStatus === st 
                      ? 'bg-[#FFFFFF] text-[#0B1026] border-[#FFFFFF] font-black' 
                      : 'bg-[#0B1026] border-[#2E3B63] text-[#B8C0CC] hover:text-[#FFFFFF]'
                  }`}>
                  {st === 'Todos' ? 'Todos os Status' : st === 'aguardando_peca' ? '📦 Aguardando Peça' : st}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Lista de Cards */}
        <div className="grid grid-cols-1 gap-4">
          {chamadosOrdenados.map((os) => {
            const tecnicoAtual = tecnicos.find(t => t.id === os.tecnico_id);
            const diasAberto = obterDiasNumérico(os.created_at);
            
            // SINTAXE CORRIGIDA: Injeção de variáveis via template string com ${}
            const linkGoogleMaps = tecnicoAtual 
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(tecnicoAtual.cep || '')}&destination=${encodeURIComponent(os.cliente_endereco)}`
              : '#';

            return (
              <div key={os.id} className="bg-[#16213E] border border-[#2E3B63] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5 transition-all hover:border-[#FF7A00]/40">
                
                {/* PARTE SUPERIOR: Informações e Conteúdo da OS */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#0B1026] text-[#B8C0CC] text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md border border-[#2E3B63]">
                      OS #{os.id.substring(0, 8)}
                    </span>
                    
                    {os.status_triagem !== 'concluido' && diasAberto >= 7 ? (
                      <span className="bg-red-600 text-white border border-red-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-md animate-pulse shadow-md">
                        🚨 CRÍTICO: {diasAberto} Dias em Aberto
                      </span>
                    ) : (
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border bg-[#0B1026] ${
                        diasAberto === 0 ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'
                      }`}>
                        ⏱️ {diasAberto === 0 ? 'Aberta hoje' : diasAberto === 1 ? 'Aberta há 1 dia' : `Aberta há ${diasAberto} dias`}
                      </span>
                    )}

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                      os.status_triagem === 'concluido' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30' :
                      os.status_triagem === 'em atendimento' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30' :
                      os.status_triagem === 'aguardando_peca' ? 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/30' :
                      'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30'
                    }`}>
                      {os.status_triagem === 'aguardando_peca' ? '📦 aguardando peça' : os.status_triagem || 'pendente'}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#FFFFFF]">{os.categoria} {os.marca_modelo && `(${os.marca_modelo})`}</h2>

                  <p className="text-[#FFFFFF] text-sm bg-[#0B1026] p-3 rounded-xl border border-[#2E3B63]">
                    <span className="text-[#FF7A00] font-bold text-xs block mb-0.5 uppercase tracking-wider">Defeito Relatado:</span> {os.sintomas}
                  </p>

                  <div className="text-xs text-[#B8C0CC] space-y-1 pt-1">
                    <p>📍 <strong>Endereço:</strong> <span className="text-[#FFFFFF]">{os.cliente_endereco}</span></p>
                    <p>👤 Cliente: <span className="text-[#FFFFFF] font-medium">{os.cliente_nome}</span> • {os.cliente_whatsapp}</p>
                  </div>
                </div>

                {/* PARTE INTERMEDIÁRIA: Bloco de Rota Isolado em Linha Exclusiva */}
                {os.tecnico_id && tecnicoAtual && (
                  <div className="bg-[#0B1026] border border-[#2E3B63] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs w-full shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[#B8C0CC]">
                        🏁 Origem (Base {tecnicoAtual.nome_fantasia || tecnicoAtual.nome}): <span className="text-[#FFFFFF] font-bold">{tecnicoAtual.cep || 'CEP não cadastrado'}</span>
                      </p>
                      <p className="text-[#B8C0CC]">
                        🎯 Destino (Cliente): <span className="text-[#FFFFFF] font-medium">{os.cliente_endereco}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => window.open(linkGoogleMaps, '_blank')}
                      className="bg-[#FF7A00] hover:bg-[#FF9200] text-[#FFFFFF] font-black px-4 py-2.5 rounded-lg text-center transition-all shadow-md uppercase tracking-wider text-[11px] whitespace-nowrap self-start sm:self-auto"
                    >
                      📍 Abrir Rota no Maps
                    </button>
                  </div>
                )}

                {/* PARTE INFERIOR: Controles e Botões Operacionais */}
                <div className="border-t border-[#2E3B63]/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  
                  {/* Selects */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                      <label className="text-[10px] font-black text-[#B8C0CC] uppercase tracking-widest px-1">Progresso</label>
                      <select 
                        value={os.status_triagem || 'pendente'} 
                        onChange={(e) => handleAtualizarStatus(os.id, e.target.value)}
                        className="w-full bg-[#0B1026] border border-[#2E3B63] p-3 rounded-xl text-xs focus:outline-none focus:border-[#FF7A00] text-[#FFFFFF] font-bold shadow-sm cursor-pointer"
                      >
                        <option value="pendente">⏳ Pendente</option>
                        <option value="em atendimento">👨‍💻 Em Atendimento</option>
                        <option value="aguardando_peca">📦 Aguardando Peça</option>
                        <option value="concluido">✅ Concluído</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-[170px]">
                      <label className="text-[10px] font-black text-[#B8C0CC] uppercase tracking-widest px-1">Designar Técnico</label>
                      <select 
                        value={os.tecnico_id || ''} 
                        onChange={(e) => handleVincularTecnico(os.id, e.target.value)}
                        className="w-full bg-[#0B1026] border border-[#2E3B63] p-3 rounded-xl text-xs focus:outline-none focus:border-[#FF7A00] text-[#FFFFFF] font-medium shadow-sm cursor-pointer"
                      >
                        <option value="">-- Escolher Parceiro --</option>
                        {tecnicos.map((tec) => (
                          <option key={tec.id} value={tec.id}>
                            {tec.nome_fantasia || tec.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Botões Operacionais */}
                  {os.tecnico_id && (
                    <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                      <button
                        onClick={() => handleEncaminharWhats(os)}
                        className="bg-[#22C55E] hover:bg-[#1da84f] text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider whitespace-nowrap"
                      >
                        📲 Enviar OS
                      </button>

                      <button
                        onClick={() => window.open(`/admin/os/${os.id}/print`, '_blank')}
                        className="bg-[#16213E] hover:bg-[#2E3B63] border border-[#2E3B63] text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider whitespace-nowrap text-center"
                      >
                        🖨️ Imprimir
                      </button>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}