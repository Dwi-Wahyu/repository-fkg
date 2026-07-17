import { hasInternalAccess } from "./internalAccess";
import { checkAccess as checkIpWhitelist } from "./ipWhitelist";

export async function checkDocumentAccess(): Promise<boolean> {
	return checkIpWhitelist() || (await hasInternalAccess());
}
