import { useContext } from "react";
import { SettingsContext } from "@/external/essence/contexts/settingsContext";

const useSettings = () => useContext(SettingsContext);
export default useSettings;
