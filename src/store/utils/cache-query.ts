/**
 * Utility functions for manipulating GraphQL cache directives
 */
import { DocumentNode, parse, print } from "graphql";
import gql from "graphql-tag";

export interface GraphqlRequestParams {
	forceRefresh?: boolean;
}

/**
 * Replaces @cached directives in a GraphQL query.
 *
 * @param query - The GraphQL query DocumentNode to modify
 * @param forceRefresh - If true, replaces @cached(ttl: N) with @cached(refresh: true)
 * @returns The modified GraphQL query DocumentNode
 */
export const modifyCacheDirective = (
	query: DocumentNode,
	forceRefresh: boolean = false
): DocumentNode => {
	if (!forceRefresh) {
		return query;
	}

	// Convert DocumentNode to string
	const queryString = print(query);

	// Replace @cached(ttl: N) with @cached(refresh: true)
	const modifiedQueryString = queryString.replace(
		/@cached\s*\(\s*ttl\s*:\s*\d+\s*\)/g,
		"@cached(refresh: true)"
	);

	// Parse back to DocumentNode
	return gql(modifiedQueryString);
};

/**
 * Creates a version of a GraphQL query that forces cache refresh
 *
 * @param query - The original GraphQL query DocumentNode
 * @returns The modified query DocumentNode with cache refresh enabled
 */
export const forceRefreshQuery = (query: DocumentNode): DocumentNode => {
	return modifyCacheDirective(query, true);
};
