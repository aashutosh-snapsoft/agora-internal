import { Observable } from "rxjs";

export interface ChatContext {
	project_id?: string;
	context?: string;
}

export interface ChatMessage {
	content: string;
}

export interface IAIChat {
	chat(message: ChatMessage, context: ChatContext): Observable<string>;
}
