import type { Locale } from "@cmsauto/contracts";

import { CryptoDashboard } from "./crypto-dashboard";

export async function MarketsFeature({ locale: _locale }: { locale: Locale }) {
  return <CryptoDashboard />;
}
