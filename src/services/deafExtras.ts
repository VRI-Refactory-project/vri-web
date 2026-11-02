/**
 * The Wallet, Messages and Schedule pages have no backend yet. Set VITE_MOCK_DEAF_EXTRAS=true in
 * .env.local to see them filled with sample data; without it they show an honest empty state.
 */
export const extrasMocked = () => import.meta.env.VITE_MOCK_DEAF_EXTRAS === 'true';
