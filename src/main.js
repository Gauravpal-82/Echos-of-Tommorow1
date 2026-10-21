import './style.css';
import { createGame } from './game.js';
import { getAllAssetEntries } from './config/assets.js';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize game instance
  const game = createGame();

  // Floating helper button for Asset Upload Checklist & Guide
  createAssetDrawerUI();
});

function createAssetDrawerUI() {
  const trigger = document.createElement('button');
  trigger.id = 'asset-guide-trigger';
  trigger.className = 'fixed bottom-3 right-3 z-40 bg-slate-900/80 hover:bg-slate-800 text-sky-400 border border-slate-700 hover:border-sky-500 rounded-lg px-3 py-1.5 text-xs font-mono shadow-md backdrop-blur transition-all flex items-center gap-1.5 cursor-pointer';
  trigger.innerHTML = '🎨 <span>Asset Checklist</span>';
  document.body.appendChild(trigger);

  const drawer = document.createElement('div');
  drawer.id = 'asset-drawer';
  drawer.className = 'fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 border-l border-slate-800 text-slate-200 z-50 p-5 shadow-2xl backdrop-blur-md transform translate-x-full transition-transform duration-300 flex flex-col font-sans';
  
  const assets = getAllAssetEntries();

  drawer.innerHTML = `
    <div class="flex items-center justify-between pb-4 border-b border-slate-800">
      <div>
        <h2 class="text-base font-bold text-sky-400 font-serif">Asset Customization Hub</h2>
        <p class="text-xs text-slate-400">Echoes of Tomorrow • Team Zeronix</p>
      </div>
      <button id="close-drawer" class="text-slate-400 hover:text-white p-1 text-lg leading-none cursor-pointer">✕</button>
    </div>

    <div class="my-3 p-3 bg-sky-950/30 border border-sky-800/40 rounded-lg text-xs text-sky-200 leading-relaxed">
      ✨ <strong>Easy Replacement:</strong> Drop your own illustrated PNG files into the respective folders in <code class="bg-black/50 px-1 py-0.5 rounded text-sky-300">public/assets/</code>. The game will automatically load your graphics!
    </div>

    <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-2 mb-2">Graphic & Audio Manifest (${assets.length} items)</div>

    <div class="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
      ${assets.map(item => `
        <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div class="flex items-center justify-between font-mono text-[11px] text-sky-300">
            <span>${item.key}</span>
            <span class="text-slate-500">${item.width ? `${item.width}×${item.height}px` : 'audio'}</span>
          </div>
          <div class="text-[11px] text-slate-400 font-mono break-all mt-1">${item.path}</div>
        </div>
      `).join('')}
    </div>

    <div class="pt-4 border-t border-slate-800 text-center">
      <a href="/ASSET_GUIDE.md" target="_blank" class="text-xs text-sky-400 hover:underline">Read complete ASSET_GUIDE.md documentation ↗</a>
    </div>
  `;

  document.body.appendChild(drawer);

  trigger.addEventListener('click', () => {
    drawer.classList.remove('translate-x-full');
  });

  const closeBtn = drawer.querySelector('#close-drawer');
  closeBtn.addEventListener('click', () => {
    drawer.classList.add('translate-x-full');
  });
}
