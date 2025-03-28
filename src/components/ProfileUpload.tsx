
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, UserCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileUploadProps {
  userId: string;
  url: string | null;
  onUpload: (url: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ProfileUpload({ userId, url, onUpload, size = "lg" }: ProfileUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  useEffect(() => {
    if (url) setAvatarUrl(url);
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Verificar o tamanho do arquivo (limitar a 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter menos de 5MB');
      }

      // Verificar o tipo do arquivo
      if (!file.type.match(/image\/(jpeg|png|gif|jpg)/)) {
        throw new Error('O arquivo deve ser uma imagem (jpg, png ou gif)');
      }

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública do avatar
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;
      
      // Atualizar o perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(avatarUrl);
      onUpload(avatarUrl);
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      
      if (!avatarUrl) return;
      
      // Extrair o nome do arquivo da URL
      const fileName = avatarUrl.split('/').pop();
      
      if (fileName) {
        // Remover o arquivo do storage
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
      }
      
      // Atualizar o perfil do usuário
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
        
      setAvatarUrl(null);
      onUpload('');
      toast.success('Foto de perfil removida com sucesso!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${sizeClasses[size]}`}>
        <Avatar className={`${sizeClasses[size]} border-2 border-gray-200`}>
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback className="bg-gray-100">
            <UserCircle2 className="h-2/3 w-2/3 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <label 
            htmlFor="avatar-upload" 
            className="cursor-pointer bg-primary hover:bg-primary/90 text-white p-2 rounded-full"
          >
            <Camera className="h-4 w-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
          </label>
          
          {avatarUrl && (
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full h-8 w-8 p-0"
              onClick={removeAvatar}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {uploading && (
        <span className="text-sm text-gray-500">Enviando...</span>
      )}
    </div>
  );
}
