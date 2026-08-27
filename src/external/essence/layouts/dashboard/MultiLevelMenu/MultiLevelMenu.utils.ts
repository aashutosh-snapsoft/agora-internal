/**
 * Creates a function that checks if a given pathname matches a route pattern, handling dynamic route parameters.
 * @param pathName - The current pathname to check against
 * @returns A function that takes a route pattern and returns 1 if it matches the pathname, 0 otherwise
 */
export function activeRoute(pathName: string) {
	return (path: string) => {
		// Convert route parameters to regex pattern
		const routePattern = path.replace(/:\w+/g, "[^/]+");
		const regex = new RegExp(`^${routePattern}$`);
		return regex.test(pathName ?? "") ? 1 : 0;
	};
}
