'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

interface OrdenServico {
  id: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_endereco: string;
  categoria: string;
  sintomas: string;
  marca_modelo: string;
  status_triagem: string;
  created_at: string;
}

interface TecnicoParceiro {
  nome_fantasia: string;
  nome: string;
  whatsapp: string;
}

export default function ImpressaoOS() {
  const params = useParams();
  const router = useRouter();
  const [os, setOs] = useState<OrdenServico | null>(null);
  const [tecnico, setTecnico] = useState<TecnicoParceiro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchOS(String(params.id));
    }
  }, [params]);

  async function fetchOS(id: string) {
    try {
      setLoading(true);
      const { data: dataOS, error: errorOS } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', id)
        .single();

      if (errorOS) throw errorOS;
      setOs(dataOS);

      if (dataOS?.tecnico_id) {
        const { data: dataTec } = await supabase
          .from('parceiros_comerciais')
          .select('nome_fantasia, nome, whatsapp')
          .eq('id', String(dataOS.tecnico_id))
          .single();
        
        setTecnico(dataTec);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da OS:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1026] flex items-center justify-center">
        <p className="text-[#FF7A00] font-bold tracking-widest uppercase animate-pulse">Gerando layout de impressão...</p>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-[#0B1026] text-white flex flex-col items-center justify-center gap-4">
        <p>Ordem de Serviço não encontrada.</p>
        <button onClick={() => router.back()} className="bg-[#FF7A00] px-4 py-2 rounded-xl text-xs font-bold">Voltar</button>
      </div>
    );
  }

  const dataFormatada = new Date(os.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4 sm:p-8 font-sans antialiased">
      
      {/* Menu do Admin (Sone na impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print bg-[#1E293B] p-4 rounded-2xl shadow-md">
        <button onClick={() => router.back()} className="text-white hover:text-[#FF7A00] text-xs font-bold flex items-center gap-1.5 transition-all">
          ⬅️ Voltar ao Painel
        </button>
        <button onClick={() => window.print()} className="bg-[#FF7A00] hover:bg-[#FF9200] text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md uppercase tracking-wider italic">
          🖨️ Imprimir Ordem de Serviço
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 border border-gray-200 shadow-sm print:p-0 print:border-none print:shadow-none">
        
        {/* VIA 1: OFICINA (COMPLETA) */}
        <section className="space-y-6 pb-6">
          <div className="flex justify-between items-start border-b-2 border-[#0B1026] pb-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#0B1026]">CHAME O TÉCNICO</h1>
              <p className="text-[11px] text-gray-500 font-medium">Controle Interno de Manutenção</p>
              {tecnico && (
                <p className="text-xs text-gray-700 mt-1">
                  🛠️ <strong>Técnico Responsável:</strong> {tecnico.nome_fantasia || tecnico.nome}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="bg-[#0B1026] text-white text-xs font-black px-3 py-1.5 rounded uppercase tracking-wider">
                VIA DA OFICINA
              </span>
              <h2 className="text-lg font-black text-[#FF7A00] mt-2">OS #{os.id.substring(0, 8).toUpperCase()}</h2>
              <p className="text-[10px] text-gray-500 font-bold">Abertura: {dataFormatada}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
            <div className="col-span-2">
              <p className="text-gray-500 font-bold text-[10px] uppercase">Nome do Cliente</p>
              <p className="font-bold text-sm text-gray-900">{os.cliente_nome}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold text-[10px] uppercase">WhatsApp</p>
              <p className="font-semibold text-gray-900">{os.cliente_whatsapp}</p>
            </div>
            <div className="col-span-3 border-t border-gray-200 pt-2 mt-1">
              <p className="text-gray-500 font-bold text-[10px] uppercase">Endereço de Atendimento</p>
              <p className="font-medium text-gray-800">{os.cliente_endereco}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg text-xs overflow-hidden">
            <div className="bg-[#16213E] text-white p-2 font-bold text-[10px] uppercase tracking-widest">
              Equipamento e Defeito Inicial
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase">Categoria</p>
                <p className="font-bold text-gray-900">{os.categoria}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase">Marca / Modelo</p>
                <p className="font-bold text-gray-900">{os.marca_modelo || 'Não Informado'}</p>
              </div>
              <div className="col-span-2 border-t border-gray-100 pt-2">
                <p className="text-gray-500 font-bold text-[10px] uppercase">Reclamação do Cliente</p>
                <p className="text-gray-800 italic bg-amber-50/60 p-2.5 rounded border border-amber-100 mt-1">
                  "{os.sintomas}"
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg text-xs overflow-hidden">
            <div className="bg-gray-100 text-gray-700 p-2 font-bold text-[10px] uppercase tracking-widest border-b border-gray-200">
              Laudo Técnico e Valores (Preenchimento Manual)
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase mb-1">Defeito Constatado / Solução:</p>
                <div className="border-b border-dashed border-gray-300 h-6 w-full"></div>
                <div className="border-b border-dashed border-gray-300 h-6 w-full mt-2"></div>
              </div>

              <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase mb-2">Peças Utilizadas:</p>
                <div className="grid grid-cols-4 gap-2 font-bold text-[10px] text-gray-400 uppercase border-b border-gray-200 pb-1">
                  <div className="col-span-2">Peça / Componente</div>
                  <div className="text-center">Qtd</div>
                  <div className="text-right">Subtotal</div>
                </div>
                <div className="grid grid-cols-4 gap-2 h-6 border-b border-gray-100"></div>
                <div className="grid grid-cols-4 gap-2 h-6 border-b border-gray-100"></div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-500">Total Peças:</span>
                    <span className="text-gray-400">R$ _________________</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-500">Mão de Obra:</span>
                    <span className="text-gray-400">R$ _________________</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-1.5 border border-gray-200 rounded font-bold">
                    <span className="text-[#0B1026]">VALOR TOTAL:</span>
                    <span className="text-gray-900">R$ _________________</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6 text-[10px] text-gray-600">
            <div className="text-center"><div className="border-b border-gray-400 w-full h-8"></div><p className="font-bold uppercase mt-1">Assinatura do Técnico</p></div>
            <div className="text-center"><div className="border-b border-gray-400 w-full h-8"></div><p className="font-bold uppercase mt-1">Assinatura do Cliente</p></div>
          </div>
        </section>

        {/* LINHA DE CORTE */}
        <div className="border-b-2 border-dashed border-gray-400 my-8 relative flex justify-center">
          <span className="absolute -top-3 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            ✂️ Recorte aqui para a via do cliente
          </span>
        </div>

        {/* VIA 2: CLIENTE (COMPACTA) */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center border-b border-gray-300 pb-2">
            <div>
              <h2 className="text-base font-black tracking-tight text-[#0B1026]">CHAME O TÉCNICO</h2>
              <p className="text-[9px] text-gray-400">Comprovante de Entrada do Equipamento</p>
            </div>
            <div className="text-right">
              <span className="bg-[#FF7A00] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                VIA DO CLIENTE
              </span>
              <p className="text-sm font-black text-[#0B1026] mt-1">OS #{os.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-gray-400 font-bold text-[9px] uppercase">Nome do Cliente</p>
              <p className="font-bold text-gray-800">{os.cliente_nome}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-[9px] uppercase">Data de Abertura</p>
              <p className="font-medium text-gray-800">{dataFormatada}</p>
            </div>
            <div className="col-span-2 border-t border-gray-200 pt-1.5 mt-0.5">
              <p className="text-gray-400 font-bold text-[9px] uppercase">Aparelho Registrado</p>
              <p className="font-bold text-gray-900">{os.categoria} {os.marca_modelo && `— ${os.marca_modelo}`}</p>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-200/60 p-2 rounded text-[9px] text-gray-500 leading-relaxed">
            <strong>Termos:</strong> O cliente declara que o aparelho deu entrada para fins de orçamento. Reparos só serão executados após autorização expressa. O serviço aprovado conta com garantia legal de 90 dias sobre as peças substituídas.
          </div>

          <div className="flex justify-between items-end pt-4 text-[10px]">
            <p className="text-gray-400 italic text-[9px]">Acompanhe o andamento direto no seu WhatsApp.</p>
            <div className="w-56 text-center">
              <div className="border-b border-gray-400 w-full h-5"></div>
              <p className="text-[9px] font-bold uppercase text-gray-600 mt-1">Responsável pelo Recebimento</p>
            </div>
          </div>
        </section>

      </div>

      <style jsx global>{`
        @media print {
          body { background-color: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}