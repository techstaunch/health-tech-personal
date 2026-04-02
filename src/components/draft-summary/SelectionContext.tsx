import { createContext, useContext } from "react";

interface SelectionContextType {
    selectedSectionId: string | null;
    setSelectedSectionId: (id: string | null) => void;
    voiceDisabled?: boolean;
}

export const SelectionContext = createContext<SelectionContextType>({
    selectedSectionId: null,
    setSelectedSectionId: () => { },
    voiceDisabled: false,
});

export const useSelection = () => useContext(SelectionContext);
