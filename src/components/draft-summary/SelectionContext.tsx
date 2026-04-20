import { createContext, useContext } from "react";

interface SelectionContextType {
    selectedSectionId: string | null;
    setSelectedSectionId: (id: string | null) => void;
    voiceDisabled?: boolean;
    onOpenVoice?: (anchorElement?: HTMLElement) => void;
}

export const SelectionContext = createContext<SelectionContextType>({
    selectedSectionId: null,
    setSelectedSectionId: () => { },
    voiceDisabled: false,
    onOpenVoice: () => { },
});

export const useSelection = () => useContext(SelectionContext);