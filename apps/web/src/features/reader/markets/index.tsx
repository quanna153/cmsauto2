import type { Locale } from "@cmsauto/contracts";

import { CryptoDashboard } from "./crypto-dashboard";

export async function MarketsFeature({ locale }: { locale: Locale }) {
  return <CryptoDashboard locale={locale} />;
}
