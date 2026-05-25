'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CadastroParceiro() {
  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [documento, setDocumento] = useState(''); // CPF ou CNPJ formatado
  const [whatsapp, setWhatsapp] = useState(''); // WhatsApp formatado
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. MÁSCARA DE WHATSAPP: (67) 99999-9999
  const handleWhatsappChange = (v: string) => {
    let value = v.replace(/\D/g, ''); // Remove tudo que não é número
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setWhatsapp(value);
  };

  // 2. MÁSCARA DE CPF/CNPJ: Dinâmica dependendo do tamanho
  const handleDocumentoChange = (v: string) => {
    let value = v.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      // CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0001-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setDocumento(value);
  };

  // 3. MÁSCARA DE CEP + BUSCA AUTOMÁTICA DE ENDEREÇO
  const handleCepChange = async (v: string) => {
    let value = v.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    // Aplica a máscara de traço: 79950-000
    let cepFormatado = value;
    if (value.length > 5) {
      cepFormatado = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(cepFormatado);

    // Quando digitar os 8 números completos, faz a busca na API ViaCEP
    if (value.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await res.json();
        
        if (!data.erro) {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(`${data.localidade} - ${data.uf}`);
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  // Lógica das Caixas de Especialidade
  const handleEspecialidadeChange = (cat: string) => {
    if (especialidades.includes(cat)) {
      setEspecialidades(especialidades.filter(item => item !== cat));
    } else {
      setEspecialidades([...especialidades, cat]);
    }
  };

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    
    if (!nome || !whatsapp) {
      alert('Por favor, preencha o Nome e o WhatsApp obrigatoriamente.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('parceiros_comerciais')
        .insert([
          {
            nome,
            nome_fantasia: nomeFantasia || null,
            documento: documento || null,
            whatsapp: whatsapp.replace(/\D/g, ''), // Salva limpo no banco (apenas números)
            cep: cep || null,
            cidade: cidade || null,
            rua: rua || null,
            numero: numero || null,
            complemento: complemento || null,
            bairro: bairro || null,
            especialidades,
            status: 'ativo'
          }
        ]);

      if (error) throw error;

      alert('🎯 Cadastro realizado com sucesso!');
      
      // Limpa os campos
      setNome(''); setNomeFantasia(''); setDocumento(''); setWhatsapp('');
      setCep(''); setCidade(''); setRua(''); setNumero(''); setComplemento(''); setBairro('');
      setEspecialidades([]);

    } catch (err: any) {
      alert(`Erro ao enviar cadastro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-orange-500 uppercase tracking-tight italic">
            SEJA UM PARCEIRO TÉCNICO
          </h1>
          <p className="text-slate-400 text-xs mt-1">Cadastre sua empresa e receba ordens de serviço qualificadas</p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-6">
          
          {/* 1. DADOS OFICIAIS */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">1. Dados Oficiais e Comerciais</h2>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Nome Completo / Razão Social *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="Ex: Paulo Sousa" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Nome Fantasia da Empresa</label>
              <input type="text" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="Ex: Eletrônica Paulista" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">CPF ou CNPJ</label>
                <input type="text" value={documento} onChange={(e) => handleDocumentoChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="000.000.000-00 ou 00.000.000/0001-00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">WhatsApp *</label>
                <input type="text" value={whatsapp} onChange={(e) => handleWhatsappChange(e.target.value)} required
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="(67) 99300-3773" />
              </div>
            </div>
          </div>

          {/* 2. LOCALIZAÇÃO */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">2. Localização (Digite o CEP para autocompletar)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">CEP</label>
                <input type="text" value={cep} onChange={(e) => handleCepChange(e.target.value)}
                  className="w-full bg-slate-950 border border-orange-500/40 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200 font-bold" placeholder="79950-000" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Cidade - UF</label>
                <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none text-slate-400" placeholder="Preenchido pelo CEP" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Rua / Logradouro</label>
                <input type="text" value={rua} onChange={(e) => setRua(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="Rua ou Avenida" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Número</label>
                <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="123" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Complemento</label>
                <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="Ex: Sala A / Casa" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Bairro</label>
                <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-slate-200" placeholder="Bairro" />
              </div>
            </div>
          </div>

          {/* 3. ESPECIALIDADES */}
          <div className="space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">3. Especialidades (Selecione o que conserta)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['Refrigeradores e Freezers', 'Máquina de Lavar / Lava e Seca', 'Ar Condicionado / Circuladores', 'Smart TVs'].map((cat) => {
                const selecionado = especialidades.includes(cat);
                return (
                  <button type="button" key={cat} onClick={() => handleEspecialidadeChange(cat)}
                    className={`p-3.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between ${
                      selecionado 
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}>
                    <span>{cat}</span>
                    {selecionado && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 text-slate-950 font-black text-xs py-4.5 rounded-xl transition-all uppercase tracking-wider italic shadow-lg shadow-orange-500/10 mt-4">
            {loading ? 'Processando Registro...' : 'ENVIAR MINHA FICHA DE PARCEIRO'}
          </button>
        </form>

      </div>
    </main>
  );
}