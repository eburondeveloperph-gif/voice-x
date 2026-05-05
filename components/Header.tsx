/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useUI } from '@/lib/state';
import { PRODUCT_FULL_NAME, PRODUCT_BRAND, EBURON_LOGO_URL } from '@/lib/app-constants';

export default function Header() {
  const { toggleSidebar } = useUI();

  return (
    <header className="flex w-full items-center justify-between px-6 py-4 fixed top-0 z-[100] pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 drop-shadow-[0_0_15px_rgba(190,242,100,0.5)]">
          <img src={EBURON_LOGO_URL} alt="Eburon Logo" className="h-6 w-6 invert" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md">{PRODUCT_BRAND}</h1>
          <p className="text-sm font-medium text-white/70 drop-shadow-sm">{PRODUCT_FULL_NAME}</p>
        </div>
      </div>
      <div className="header-right pointer-events-auto">
        <button
          className="rounded-full bg-white/10 p-2 text-white backdrop-blur shadow-sm hover:bg-white/20 transition-colors"
          onClick={toggleSidebar}
          aria-label="Settings"
        >
          <span className="icon">tune</span>
        </button>
      </div>
    </header>
  );
}