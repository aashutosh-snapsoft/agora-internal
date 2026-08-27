import { LineItem } from "@/types/content";
import { Observable } from "rxjs";

/**
 * An interface working with a Socratics.ai data grid.
 *
 * Right now, this is stringly typed
 */
export interface IWorksheetServiceV1<ColDef, RowDef> {
	/**
	 * Initialize the worksheet service.
	 */
	init(): void;

	/**
	 * Get the column definitions for the worksheet
	 *
	 * @returns An observable that emits an array of column definitions.
	 */
	getColumns(): Observable<ColDef[]>;

	/**
	 * Get the row data for the worksheet
	 *
	 * @returns An observable that emits an array of row data.
	 */
	getRows(): Observable<RowDef[]>;
}

/**
 * An interface working with a Socratics.ai data grid.
 *
 * Right now, this is stringly typed
 */
export interface IWorksheetServiceV2<ColDef, RowDef> {
	/**
	 * Initialize the worksheet service.
	 */
	init(): void;

	/**
	 * Get the column definitions for the worksheet
	 *
	 * @returns An observable that emits an array of column definitions.
	 */
	getColumns(): ColDef[];

	/**
	 * Get the row data for the worksheet
	 *
	 * @returns An observable that emits an array of row data.
	 */
	getRows(): RowDef[];
}

export interface LineItemFilter {
	/**
	 * Filter a line item
	 *
	 * @param lineItem The line item to filter
	 * @returns True if the line item should be included, false otherwise
	 */
	filter(lineItem: LineItem): boolean;
}

export interface LineItemFilter {
	/**
	 * Filter a line item
	 *
	 * @param lineItem The line item to filter
	 * @returns True if the line item should be included, false otherwise
	 */
	filter(lineItem: LineItem): boolean;
}
