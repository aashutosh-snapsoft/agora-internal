import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Custom hook for prefetching routes to improve navigation performance
 * @returns Object with prefetch functions
 */
export const useRoutePrefetch = () => {
  const router = useRouter();

  /**
   * Prefetch a single route
   * @param path - The route path to prefetch
   */
  const prefetchRoute = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  /**
   * Prefetch multiple routes
   * @param paths - Array of route paths to prefetch
   */
  const prefetchRoutes = useCallback((paths: string[]) => {
    paths.forEach(path => router.prefetch(path));
  }, [router]);

  /**
   * Prefetch project-related routes
   * @param projectId - The project ID
   * @param includeSubRoutes - Whether to prefetch sub-routes (default: true)
   */
  const prefetchProjectRoutes = useCallback((projectId: string, includeSubRoutes: boolean = true) => {
    const routes = [`/projects/${projectId}`];
    
    if (includeSubRoutes) {
      routes.push(
        `/projects/${projectId}/financials`,
        `/projects/${projectId}/documents`,
        `/projects/${projectId}/settings`,
        `/projects/${projectId}/validation`,
        `/projects/${projectId}/concepts`,
        `/projects/${projectId}/reported`
      );
    }
    
    prefetchRoutes(routes);
  }, [prefetchRoutes]);

  /**
   * Prefetch all project routes for a list of projects
   * @param projects - Array of projects with id property (can be string or undefined)
   * @param includeSubRoutes - Whether to prefetch sub-routes (default: true)
   */
  const prefetchAllProjectRoutes = useCallback((projects: Array<{ id?: string }>, includeSubRoutes: boolean = true) => {
    projects.forEach(project => {
      if (project.id) {
        prefetchProjectRoutes(project.id, includeSubRoutes);
      }
    });
  }, [prefetchProjectRoutes]);

  return {
    prefetchRoute,
    prefetchRoutes,
    prefetchProjectRoutes,
    prefetchAllProjectRoutes,
  };
};
