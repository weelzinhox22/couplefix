
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [connectionCode, setConnectionCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const { data: connection, isLoading: isLoadingConnection } = useQuery({
    queryKey: ['connection'],
    queryFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');
      
      // Check if user has a connection already (either as user or partner)
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" which is expected
      return data || null;
    },
    enabled: !!session?.user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  // Connect with partner mutation
  const connectPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user || !partnerCode) throw new Error('Not authenticated or no code provided');
      
      // Validate the connection code format
      if (!partnerCode.startsWith('MP-') || partnerCode.length !== 9) {
        throw new Error('Formato de código de conexão inválido');
      }
      
      // First, find the partner profile using the connection code
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('connection_code', partnerCode)
        .single();
      
      if (findError) throw new Error('Código de conexão inválido');
      if (!partnerProfile) throw new Error('Parceiro não encontrado');
      if (partnerProfile.id === session.user.id) throw new Error('Você não pode se conectar consigo mesmo');
      
      // Check if a connection already exists between these users
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('*')
        .or(`(user_id.eq.${session.user.id}.and.partner_id.eq.${partnerProfile.id}),(user_id.eq.${partnerProfile.id}.and.partner_id.eq.${session.user.id})`)
        .maybeSingle();
      
      if (existingConnection) throw new Error('Vocês já estão conectados');
      
      // Create the connection
      const { data, error } = await supabase
        .from('connections')
        .insert({
          user_id: session.user.id,
          partner_id: partnerProfile.id,
          status: 'connected'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
      toast.success('Conectado com sucesso ao seu parceiro!');
      setPartnerCode('');
    },
    onError: (error) => {
      toast.error(`Erro ao conectar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setConnectionCode(profile.connection_code || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Código de conexão copiado!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Seu Perfil</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize seus dados de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" value={session?.user?.email || ''} disabled />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Nome de usuário
                </label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending || !username}
              >
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
          
          {/* Partner Connection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Conexão com Parceiro</CardTitle>
              <CardDescription>
                Conecte sua conta com seu parceiro para compartilhar listas e avaliações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connection ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="text-green-500" />
                  <div>
                    <p className="font-medium text-green-800">Conectado com sucesso!</p>
                    <p className="text-sm text-green-600">Você já está conectado com seu parceiro.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seu código de conexão</label>
                    <div className="flex items-center">
                      <Input value={connectionCode} readOnly />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={copyToClipboard}
                        className="ml-2"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Compartilhe este código com seu parceiro para se conectar
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="partnerCode" className="text-sm font-medium">
                      Código do parceiro
                    </label>
                    <Input 
                      id="partnerCode" 
                      value={partnerCode} 
                      onChange={(e) => setPartnerCode(e.target.value)}
                      placeholder="Digite o código de conexão do seu parceiro"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => connectPartnerMutation.mutate()}
                    disabled={connectPartnerMutation.isPending || !partnerCode || partnerCode.length !== 9}
                    className="w-full"
                  >
                    Conectar com Parceiro
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Logout Button */}
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
