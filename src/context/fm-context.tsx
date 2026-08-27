import { FinancialModelComponentType } from "@/types/fm-component";
import { createContext, useState, useContext } from "react";

/**
 * This context determines the currently selected financial model component
 * being interacted with.
 */
const FMComponentsContext = createContext<FMComponentsContextProps>({
	value: {
		"drill-down-title": "",
		"selected-component-type": "income-statement",
	},
	setValue: () => {},
});

interface IValueInterface {
	"drill-down-title": string;
	"selected-component-type": FinancialModelComponentType;
}

interface FMComponentsContextProps {
	value: IValueInterface;
	setValue: React.Dispatch<React.SetStateAction<IValueInterface>>;
}

interface FMComponentsContextProviderProps {
	children: React.ReactNode;
}

export const FMComponentsContextProvider: React.FC<
	FMComponentsContextProviderProps
> = (props) => {
	const [value, setValue] = useState<IValueInterface>({
		"drill-down-title": "",
		"selected-component-type": "income-statement",
	});

	return (
		<FMComponentsContext.Provider value={{ value, setValue }}>
			{props.children}
		</FMComponentsContext.Provider>
	);
};

// Custom hook to use context
export const useFMComponentsContext = () => useContext(FMComponentsContext);
