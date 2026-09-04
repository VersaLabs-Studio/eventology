// ============================================================================
// @eventology/wallet — Barrel Export
// ============================================================================
// Stubbed wallet seam (HO-H): Apple Wallet `.pkpass` + Google Wallet save
// links behind a provider boundary, mirroring the AI seam. V2.0 ships the
// stub only — no live Apple/Google keys, swappable via WALLET_PROVIDER env.
// ============================================================================

export {
  getWalletProvider,
  resetWalletProvider,
  type WalletProvider,
} from './provider';
export { StubWalletProvider } from './stub-provider';
export type {
  GoogleSaveLink,
  PassArtifact,
  WalletPlatform,
  WalletTicket,
} from './types';
