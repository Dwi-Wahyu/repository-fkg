import { ScriptOnce } from "@tanstack/react-router";
import { createContext, useContext, useEffect } from "react";

type Theme = "light";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "light",
	setTheme: () => {},
});

export function ThemeProvider({ children }: ThemeProviderProps) {
	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("dark");
		root.classList.add("light");
		root.style.colorScheme = "light";
	}, []);

	return (
		<ThemeProviderContext value={{ theme: "light", setTheme: () => {} }}>
			<ScriptOnce>{`document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';`}</ScriptOnce>
			{children}
		</ThemeProviderContext>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");
	return context;
}
