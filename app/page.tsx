'use client';

import { useState } from 'react';
import { supabase } from './lib/supabase';

export default function Home() {
  const [categoria, setCategoria] = useState('');
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  
  // Estados para o endereço inteligente por CEP
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');

  // Estados para gerenciamento de fotos do defeito
  const [fotosBase64, setFotosBase64] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const opcoesSintomas: Record<string, string[]> = {
    'Refrigeradores e Freezers': [
      'Não está gelando na parte de baixo',
      'Não está gelando nada (completamente parado)',
      'Fazendo barulho excessivo ou estalos',
      'Vazando água por baixo ou dentro',
      'Formando muito gelo (bloqueio de ar)',
      'Alarme apitando ou piscando painel',
      'Motor tenta ligar mas desliga em seguida'
    ],
    'Máquina de Lavar / Lava e Seca': [
      'Não liga ou painel fica piscando',
      'Não joga a água para fora (bomba)',
      'Não entra água ou demora muito',
      'Não centrifuga (fica rodando devagar)',
      'Fazendo barulho muito forte no ciclo de centrifugação',
      'Vazando água por baixo',
      'Painel mostra código de erro (Ex: IE, OE, dE, UE)'
    ],
    'Ar Condicionado / Circulador de Ar': [
      'Não gela (apenas sopra vento / ar fresco)',
      'Vazando água para dentro do cômodo (pingando)',
      'Não liga ou não responde ao controle remoto',
      'Desliga sozinho depois de alguns minutos',
      'Forte barulho na unidade externa ou trepidação',
      'Congelando a tubulação ou as colmeias',
      'Circulador de ar com hélice travada ou fraca'
    ],
    'Smart TVs': [
      'Tela com som mas sem imagem (escura)',
      'Não liga (nem o LED de standby acende)',
      'Liga e desliga sozinha em loop',
      'Linhas verticais ou horizontais na tela',
      'Imagem piscando ou trêmula',
      'Não conecta no Wi-Fi'
    ]
  };

  // Função para aplicar a máscara automática no telefone (WhatsApp)
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); 
    if (input.length > 11) input = input.substring(0, 11); 

    if (input.length > 6) {
      input = `(${input.substring(0, 2)}) ${input.substring(2, 7)}-${input.substring(7)}`;
    } else if (input.length > 2) {
      input = `(${input.substring(0, 2)}) ${input.substring(2)}`;
    } else if (input.length > 0) {
      input = `(${input}`;
    }
    setWhatsapp(input);
  };

  // Função para buscar o CEP automaticamente com máscara
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 8) value = value.substring(0, 8); 

    let cepFormatado = value;
    if (value.length > 5) {
      cepFormatado = `${value.substring(0, 5)}-${value.substring(5)}`;
    }
    setCep(cepFormatado);

    if (value.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await res.json();
        
        if (!data.erro) {
          setRua(data.logradouro);
          setBairro(data.bairro);
          setCidade(`${data.localidade} - ${data.uf}`);
        } else {
          alert('CEP não encontrado. Por favor, digite o endereço manualmente.');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Processa a seleção de imagens
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (fotosBase64.length + filesArray.length > 3) {
        alert('Você pode enviar no máximo 3 fotos do equipamento.');
        return;
      }
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setFotosBase64((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removerFoto = (indexInput: number) => {
    setFotosBase64(fotosBase64.filter((_, i) => i !== indexInput));
  };

  const handleSintomaToggle = (sintoma: string) => {
    if (sintomas.includes(sintoma)) {
      setSintomas(sintomas.filter(s => s !== sintoma));
    } else {
      setSintomas([...sintomas, sintoma]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || sintomas.length === 0 || !nome || !whatsapp || !cep || !rua || !numero || !cidade) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione os sintomas.');
      return;
    }

    setLoading(true);
    const enderecoCompleto = `${rua}, Nº ${numero}${complemento ? ` (${complemento})` : ''} - Bairro: ${bairro} - ${cidade} - CEP: ${cep}`;

    try {
      const { error } = await supabase.from('ordens_servico').insert([
        {
          cliente_nome: nome,
          cliente_whatsapp: whatsapp,
          cliente_endereco: enderecoCompleto,
          categoria: categoria,
          sintomas: sintomas.join(', '), 
          marca_modelo: marcaModelo,     
          status_triagem: 'pendente',
          fotos: fotosBase64
        }
      ]);

      if (error) throw error;
      setSucesso(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar o chamado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        
        {/* LOGO E TÍTULO INTEGRADOS */}
        <header className="flex flex-col items-center justify-center mb-8 space-y-2">
          <div className="flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg shadow-orange-500/20">
            {/* Ícone vetorizado de Engrenagem e Suporte */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-slate-950">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.5 1.5 0 1019.5 18.75l-5.83-5.83M11.42 15.17l2.42-2.42M11.42 15.17L5.75 9.5M13.84 12.75l2.42-2.42m0 0l-5.83-5.83a1.5 1.5 0 00-2.12 2.12l5.83 5.83zm-2.42 2.42L5.75 19.5a1.5 1.5 0 01-2.12-2.12l5.83-5.83z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent uppercase">
            Chame o Técnico
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Triagem profissional para suporte técnico especializado</p>
        </header>

        {sucesso ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">🧡</div>
            <h2 className="text-2xl font-bold text-orange-400">Chamado Enviado com Sucesso!</h2>
            <p className="text-slate-300 max-w-md mx-auto text-sm">
              Nossa central já recebeu seus dados e sintomas. Um técnico especializado entrará em contato via WhatsApp em instantes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Passo 1: Categoria */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">1. Qual equipamento precisa de manutenção?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(opcoesSintomas).map((cat) => {
                  const icones: Record<string, string> = {
                    'Refrigeradores e Freezers': '🧊',
                    'Máquina de Lavar / Lava e Seca': '🧺',
                    'Ar Condicionado / Circulador de Ar': '🌬️',
                    'Smart TVs': '📺'
                  };
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setCategoria(cat); setSintomas([]); }}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col items-start gap-2 ${
                        categoria === cat 
                          ? 'border-orange-500 bg-orange-950/20 text-orange-400 shadow-md shadow-orange-500/10' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{icones[cat]}</span>
                      <span className="font-semibold text-sm">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passo 2: Sintomas Dinâmicos */}
            {categoria && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    2. O que o equipamento está apresentando? (Selecione todos que se aplicam)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {opcoesSintomas[categoria].map((sintoma) => (
                      <button
                        key={sintoma}
                        type="button"
                        onClick={() => handleSintomaToggle(sintoma)}
                        className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center justify-between ${
                          sintomas.includes(sintoma)
                            ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{sintoma}</span>
                      {sintomas.includes(sintoma) && <span className="text-amber-500 font-bold">✓</span>}
                    </button>
                    ))}
                  </div>
                </div>

                {/* Campo de Marca/Modelo */}
                <div className="pt-2">
                  <span className="text-xs text-slate-400 font-medium">Sabe a Marca ou Modelo? (Opcional)</span>
                  <input
                    type="text"
                    value={marcaModelo}
                    onChange={(e) => setMarcaModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 mt-1"
                    placeholder="Ex: Electrolux Frost Free, Split LG Inverter 12000"
                  />
                </div>

                {/* Campo de Fotos do Defeito */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Fotos do Equipamento ou Defeito (Opcional - Máx 3)</span>
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/50 hover:border-orange-500/50 transition-all text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={fotosBase64.length >= 3}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="space-y-1">
                      <span className="text-2xl block">📸</span>
                      <span className="text-sm font-medium text-slate-300 block">Clique para anexar ou tirar foto</span>
                      <span className="text-xs text-slate-500 block">Formatos: JPG, PNG (Direto do celular ou computador)</span>
                    </div>
                  </div>

                  {/* Listagem com miniatura das fotos anexadas */}
                  {fotosBase64.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {fotosBase64.map((foto, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-800 h-24 bg-slate-950">
                          <img src={foto} alt="Defeito" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removerFoto(index)}
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passo 3: Dados de Contato e Endereço por CEP */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-sm font-semibold text-slate-300">3. Seus dados e endereço para a visita</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Nome Completo</span>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">WhatsApp (com DDD)</span>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="Ex: (67) 99999-9999"
                  />
                </div>
              </div>

              {/* Bloco do CEP inteligente */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <span className="text-xs text-slate-400">Digite seu CEP</span>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={cep}
                    onChange={handleCepChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="Ex: 79950-000"
                  />
                  {loadingCep && <span className="text-xs text-orange-400 animate-pulse block mt-1">Buscando endereço...</span>}
                </div>
                
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-xs text-slate-400">Cidade / UF</span>
                  <input
                    type="text"
                    disabled
                    value={cidade}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-400 focus:outline-none opacity-80"
                    placeholder="Preenchido automaticamente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1 sm:col-span-3">
                  <span className="text-xs text-slate-400">Rua / Logradouro</span>
                  <input
                    type="text"
                    required
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    placeholder="Rua, Avenida..."
                  />
                </div>
                
                <div className="space-y-1 sm:col-span-1">
                  <span className="text-xs text-slate-400">Número</span>
                  <input
                    type="text"
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    placeholder="Nº"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Bairro</span>
                  <input
                    type="text"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Complemento / Referência (Opcional)</span>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Próximo ao mercado, Ap 102"
                  />
                </div>
              </div>

            </div>

            {/* Botão de Envio Laranja */}
            <button
              type="submit"
              disabled={loading || loadingCep}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-slate-950 font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? 'Processando Triagem...' : 'Solicitar Atendimento Técnico'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}