/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SnakeGame from './components/SnakeGame';

export default function App() {
  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <main className="relative z-10">
        <SnakeGame />
      </main>
      
      {/* Footer Meta */}
      <footer className="fixed bottom-4 left-0 right-0 z-20 pointer-events-none flex justify-center opacity-30">
        <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-white">
          使用 React & Canvas 建構
        </p>
      </footer>
    </div>
  );
}

