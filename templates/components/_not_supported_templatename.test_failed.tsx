import React from "react";
import { createRoot } from "react-dom/client";
import TemplateName from "./templatename";

it("It should mount", () => {
	const div = document.createElement("div");
	const root = createRoot(div);
	root.render(<TemplateName />);
	root.unmount();
});
