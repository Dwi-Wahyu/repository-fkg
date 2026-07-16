declare module "*.css";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";

interface ImportMetaEnv {
	readonly WHITELIST_IP_ACCESS?: string;
}
