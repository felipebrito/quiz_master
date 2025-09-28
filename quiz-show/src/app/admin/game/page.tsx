'use client';

import { useRouter } from 'next/navigation';
import GameAdminInterface from '@/components/GameAdminInterface';

export default function GameAdminPage() {
  const router = useRouter();

  const handleStopGame = () => {
    if (confirm('Tem certeza que deseja parar a partida?')) {
      router.push('/admin');
    }
  };

  return (
    <GameAdminInterface onStopGame={handleStopGame} />
  );
}
